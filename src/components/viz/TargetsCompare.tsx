import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { animate } from 'motion/react';
import { OBJECTIVES, ROBOT } from '@/data/results';
import { clamp, easeOut, useInView, useReducedMotion } from '@/lib/hooks';
import { mono, sans } from './svg';

// Finding 4 (Table 4). Same inputs, backbone and training scenes on RoboTwin; only the training
// target differs. Per-policy outcome regression follows the scene; the winner-label classifier
// collapses, because most successful training outcomes become wrong-class targets. Below: the
// labels behind the collapse, and the other panels, where no target beats the fixed arm.

const MINUS = '−';
const NB = '\u00a0';
const sgn = (v: number, d = 2) => `${v > 0 ? '+' : v < 0 ? MINUS : ''}${Math.abs(v).toFixed(d)}`;
const ival = (c: readonly [number, number]) => `[${sgn(c[0])},${NB}${sgn(c[1])}]`;
const int = (n: number) => n.toLocaleString('en-US');

/** horizontal bar from a baseline x0 to a data end x1, rounded (4px) at the data end only */
function barPath(x0: number, x1: number, y: number, h: number, r = 4) {
  const len = Math.abs(x1 - x0);
  if (len < 0.25) return '';
  const rr = Math.min(r, len, h / 2);
  return x1 >= x0
    ? `M${x0},${y}H${x1 - rr}A${rr},${rr} 0 0 1 ${x1},${y + rr}V${y + h - rr}A${rr},${rr} 0 0 1 ${x1 - rr},${y + h}H${x0}Z`
    : `M${x0},${y}H${x1 + rr}A${rr},${rr} 0 0 0 ${x1},${y + rr}V${y + h - rr}A${rr},${rr} 0 0 0 ${x1 + rr},${y + h}H${x0}Z`;
}
const halo = { stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke', strokeLinejoin: 'round' } as const;
const serifItalic = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' } as const;

/* ---------------------------------------------------------------- */
/* measuring, timing, tooltip                                         */
/* ---------------------------------------------------------------- */

function useWidth<T extends HTMLElement>(ref: RefObject<T | null>, fallback = 870) {
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const v = Math.round(el.getBoundingClientRect().width);
      if (v > 0) setW(v);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function useTimeline(run: boolean, total: number) {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!run || reduce) return;
    const c = animate(0, total, { duration: total, ease: 'linear', onUpdate: setT });
    return () => c.stop();
  }, [run, total, reduce]);
  return reduce ? (run ? total : 0) : t;
}
const phase = (t: number, start: number, dur: number) => easeOut(clamp((t - start) / dur));

type Tip = { x: number; y: number; body: ReactNode } | null;
interface TipApi {
  at: (e: { clientX: number; clientY: number }, body: ReactNode) => void;
  atEl: (el: Element, body: ReactNode) => void;
  hide: () => void;
}

function useTip(box: RefObject<HTMLElement | null>): [Tip, TipApi] {
  const [tip, setTip] = useState<Tip>(null);
  const api: TipApi = {
    at: (e, body) => {
      const r = box.current?.getBoundingClientRect();
      if (r) setTip({ x: e.clientX - r.left, y: e.clientY - r.top, body });
    },
    atEl: (el, body) => {
      const r = box.current?.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      if (r) setTip({ x: b.left + Math.min(b.width / 2, 120) - r.left, y: b.top + b.height / 2 - r.top, body });
    },
    hide: () => setTip(null),
  };
  return [tip, api];
}

function TipBox({ tip, width }: { tip: Tip; width: number }) {
  if (!tip) return null;
  const W = 240;
  const left = Math.max(0, Math.min(width - W, tip.x - W / 2));
  const below = tip.y < 130;
  return (
    <div
      className="pointer-events-none absolute rounded-xl border border-rule-2 bg-surface px-3 py-2.5 shadow-[var(--shadow)]"
      style={{ left, top: below ? tip.y + 18 : tip.y - 14, width: W, zIndex: 20, transform: below ? undefined : 'translateY(-100%)' }}
    >
      {tip.body}
    </div>
  );
}

function Key({ color, kind = 'line' }: { color: string; kind?: 'line' | 'dash' }) {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" className="shrink-0" aria-hidden>
      <line x1={1.5} y1={5} x2={12.5} y2={5} stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray={kind === 'dash' ? '2.5 2.5' : undefined} />
    </svg>
  );
}

function TipBody({ title, sub, rows, foot }: { title: string; sub?: string; rows: { key: ReactNode; value: string; label: string }[]; foot?: ReactNode }) {
  return (
    <div>
      <div className="font-sans text-[12.5px] font-semibold leading-tight text-ink">{title}</div>
      {sub && <div className="mt-0.5 font-mono text-[10.5px] leading-snug text-ink-3">{sub}</div>}
      {rows.length > 0 && (
        <div className="mt-2 flex flex-col" style={{ gap: 4 }}>
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              {r.key}
              <span className="num text-[12px] font-medium text-ink">{r.value}</span>
              <span className="font-sans text-[11.5px] text-ink-3">{r.label}</span>
            </div>
          ))}
        </div>
      )}
      {foot && (
        <div className={`font-sans text-[11.5px] leading-snug text-ink-2 ${rows.length ? 'mt-2 border-t border-rule' : 'mt-1.5'}`} style={{ paddingTop: rows.length ? 6 : 0 }}>
          {foot}
        </div>
      )}
    </div>
  );
}

const Kicker = ({ children }: { children: ReactNode }) => <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{children}</div>;

/* ---------------------------------------------------------------- */
/* (a) the two targets on one scale                                    */
/* ---------------------------------------------------------------- */

const OUT = OBJECTIVES.robot.rows[0];
const WIN = OBJECTIVES.robot.rows[1];
const FIXED = ROBOT.overall.fixed;
const ORACLE = ROBOT.overall.oracle;

const TARGETS = [
  { key: 'outcome', name: 'Outcome regression', sub: 'predicts each policy’s success', head: 'one sigmoid head per policy', v: OUT.score, d: OUT.diff, ci: OUT.ci, color: 'var(--blue)' },
  { key: 'winner', name: 'Winner-label classifier', sub: 'predicts which policy wins', head: 'softmax over the succeeding policy, ties broken by inference time', v: WIN.score, d: WIN.diff, ci: undefined, color: 'var(--coral)' },
] as const;

function heroGeom(w: number) {
  const narrow = w < 640;
  if (!narrow) {
    const PL = 250;
    const PR = w - 128;
    const cys = [84, 152];
    const BH = 22;
    const axisY = cys[1] + BH / 2 + 24;
    return { narrow, PL, PR, cys, BH, refTop: 42, axisY, H: axisY + 36 };
  }
  const PL = 0;
  const PR = w - 74;
  const cys = [64, 138];
  const BH = 20;
  const axisY = cys[1] + BH / 2 + 40;
  return { narrow, PL, PR, cys, BH, refTop: 24, axisY, H: axisY + 36 };
}

function Hero({ w, inView, tip }: { w: number; inView: boolean; tip: TipApi }) {
  const g = heroGeom(w);
  const t = useTimeline(inView, 2.4);
  const [hover, setHover] = useState<string | null>(null);
  const X = (v: number) => g.PL + (v / 100) * (g.PR - g.PL);
  const tRef = phase(t, 0, 0.6);
  // both bars grow at the same speed, so the winner-label bar visibly stops short
  const SPEED = 1.5; // seconds for 0 → 100%
  const grow = (v: number) => easeOut(clamp((t - 0.35) / ((v / 100) * SPEED)));
  const tGhost = phase(t, 0.35 + (WIN.score / 100) * SPEED + 0.05, 0.5);
  const tLate = phase(t, 1.55, 0.5);

  const refBody = (which: 'fixed' | 'oracle') =>
    which === 'fixed' ? (
      <TipBody title="Fixed policy · ME-Dex" sub="best single policy on training and test scenes" rows={[{ key: <Key color="var(--slate)" />, value: `${FIXED.toFixed(2)}%`, label: 'success' }]} />
    ) : (
      <TipBody title="Per-scene oracle" sub="best policy chosen per scene in hindsight" rows={[{ key: <Key color="var(--ink-3)" kind="dash" />, value: `${ORACLE.toFixed(2)}%`, label: 'success' }]} />
    );

  const barBody = (r: (typeof TARGETS)[number]) => (
    <TipBody
      title={r.name}
      sub={`${r.head} · ${int(ROBOT.scenes)} test scenes`}
      rows={[
        { key: <Key color={r.color} />, value: `${r.v.toFixed(2)}%`, label: 'success' },
        { key: <Key color="var(--slate)" />, value: `${FIXED.toFixed(2)}%`, label: 'fixed policy, ME-Dex' },
        { key: <Key color="var(--ink-3)" kind="dash" />, value: `${ORACLE.toFixed(2)}%`, label: 'per-scene oracle' },
      ]}
      foot={
        <>
          vs. fixed <span className="num text-ink">{sgn(r.d)}</span>
          {r.ci && <span className="num text-ink-3"> {ival(r.ci)}, paired 95% interval over scenes</span>}
        </>
      }
    />
  );

  const hit = (key: string, body: ReactNode, label: string) => ({
    role: 'img',
    tabIndex: 0,
    'aria-label': label,
    onPointerEnter: () => setHover(key),
    onPointerMove: (e: PointerEvent) => tip.at(e, body),
    onPointerLeave: () => {
      setHover(null);
      tip.hide();
    },
    onFocus: (e: FocusEvent<SVGElement>) => {
      setHover(key);
      tip.atEl(e.currentTarget, body);
    },
    onBlur: () => {
      setHover(null);
      tip.hide();
    },
    style: { outline: 'none' },
  });

  const yTop = g.refTop;
  const yBot = g.cys[1] + g.BH / 2 + 10;

  return (
    <svg viewBox={`0 0 ${w} ${g.H}`} width={w} height={g.H} className="block h-auto w-full overflow-visible" role="group" aria-label="Robot success of the outcome-regression router and the winner-label classifier, with the fixed policy and the per-scene oracle">
      {/* grid */}
      {[0, 20, 40, 60, 80, 100].map((v) => (
        <line key={v} x1={X(v)} x2={X(v)} y1={yTop} y2={yBot} stroke="var(--rule)" />
      ))}

      {/* reference lines: the fixed policy and the per-scene oracle */}
      <g opacity={tRef}>
        <line x1={X(FIXED)} x2={X(FIXED)} y1={yTop - 4} y2={yBot} stroke="var(--slate)" strokeWidth={2} strokeLinecap="round" />
        <line x1={X(ORACLE)} x2={X(ORACLE)} y1={yTop - 4} y2={yBot} stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="4 4" />
        {g.narrow ? (
          <>
            <text x={X(FIXED) - 6} y={yTop - 8} textAnchor="end" fontSize={10.5} fill="var(--ink-2)" style={mono}>
              ME-Dex {FIXED.toFixed(2)}
            </text>
            <text x={X(ORACLE) + 6} y={yTop - 8} textAnchor="start" fontSize={10.5} fill="var(--ink-2)" style={mono}>
              oracle {ORACLE.toFixed(2)}
            </text>
          </>
        ) : (
          <>
            <text x={X(FIXED) - 8} y={yTop - 20} textAnchor="end" fontSize={11.5} fill="var(--ink-2)" style={sans}>
              fixed policy, ME-Dex
            </text>
            <text x={X(FIXED) - 8} y={yTop - 6} textAnchor="end" fontSize={11} fill="var(--ink)" style={mono}>
              {FIXED.toFixed(2)}
            </text>
            <text x={X(ORACLE) + 8} y={yTop - 20} textAnchor="start" fontSize={11.5} fill="var(--ink-2)" style={sans}>
              per-scene oracle
            </text>
            <text x={X(ORACLE) + 8} y={yTop - 6} textAnchor="start" fontSize={11} fill="var(--ink)" style={mono}>
              {ORACLE.toFixed(2)}
            </text>
          </>
        )}
      </g>

      {TARGETS.map((r, i) => {
        const cy = g.cys[i];
        const p = grow(r.v);
        const xe = X(r.v * p);
        const dim = hover !== null && hover !== r.key && hover !== 'fixed' && hover !== 'oracle';
        return (
          <g key={r.key} opacity={dim ? 0.35 : 1} style={{ transition: 'opacity .25s' }}>
            {/* label */}
            {g.narrow ? (
              <text x={0} y={cy - g.BH / 2 - 9} fontSize={13} fontWeight={650} fill="var(--ink)" style={{ ...sans, ...halo }}>
                {r.name}
              </text>
            ) : (
              <>
                <text x={0} y={cy - 2} fontSize={14} fontWeight={650} fill="var(--ink)" style={sans}>
                  {r.name}
                </text>
                <text x={0} y={cy + 15} fontSize={11.5} fill="var(--ink-3)" style={sans}>
                  {r.sub}
                </text>
              </>
            )}

            {/* the shortfall to the fixed policy */}
            {r.key === 'winner' && (
              <g opacity={tGhost}>
                <rect x={X(r.v) + 2} y={cy - g.BH / 2} width={Math.max(0, X(FIXED) - X(r.v) - 3)} height={g.BH} fill="var(--coral-wash)" />
                <text x={(X(r.v) + X(FIXED)) / 2} y={cy + 4} textAnchor="middle" fontSize={g.narrow ? 10.5 : 11.5} fill="var(--ink-2)" style={mono}>
                  {sgn(r.d)}
                </text>
              </g>
            )}
            <path d={barPath(X(0), xe, cy - g.BH / 2, g.BH)} fill={r.color} />
            {r.ci && (
              <g opacity={tLate}>
                <line x1={X(FIXED + r.ci[0])} x2={X(FIXED + r.ci[1])} y1={cy} y2={cy} stroke="var(--ink)" strokeWidth={1.3} />
                <line x1={X(FIXED + r.ci[0])} x2={X(FIXED + r.ci[0])} y1={cy - 6} y2={cy + 6} stroke="var(--ink)" strokeWidth={1.3} />
                <line x1={X(FIXED + r.ci[1])} x2={X(FIXED + r.ci[1])} y1={cy - 6} y2={cy + 6} stroke="var(--ink)" strokeWidth={1.3} />
              </g>
            )}

            {/* value column */}
            <text x={w} y={cy + (g.narrow ? 6 : 7)} textAnchor="end" fontSize={g.narrow ? 24 : 32} fontWeight={600} fill="var(--ink)" style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'lining-nums tabular-nums' }}>
              {(r.v * p).toFixed(2)}%
            </text>
            {g.narrow ? (
              r.ci && (
                <text x={0} y={cy + g.BH / 2 + 15} fontSize={10.5} fill="var(--ink-3)" opacity={tLate} style={{ ...mono, ...halo }}>
                  vs. fixed {sgn(r.d)} {ival(r.ci)}
                </text>
              )
            ) : (
              r.ci && (
                <text x={X(FIXED) - 8} y={cy - g.BH / 2 - 8} textAnchor="end" opacity={tLate} style={{ ...mono, ...halo }}>
                  <tspan fontSize={11} fontWeight={600} fill="var(--ink)">
                    {sgn(r.d)}
                  </tspan>
                  <tspan dx={5} fontSize={10.5} fill="var(--ink-3)">
                    {ival(r.ci)}
                  </tspan>
                </text>
              )
            )}

            <rect
              x={0}
              y={cy - g.BH / 2 - (g.narrow ? 24 : 14)}
              width={w}
              height={g.BH + (g.narrow ? 46 : 32)}
              fill="transparent"
              {...hit(r.key, barBody(r), `${r.name}: ${r.v.toFixed(2)}% success, ${sgn(r.d)} vs. the fixed policy`)}
            />
          </g>
        );
      })}

      {/* hit areas for the reference lines, drawn above the rows */}
      <rect x={X(FIXED) - 7} y={yTop - 32} width={14} height={yBot - yTop + 32} fill="transparent" {...hit('fixed', refBody('fixed'), `Fixed policy ME-Dex: ${FIXED}%`)} />
      <rect x={X(ORACLE) - 7} y={yTop - 32} width={14} height={yBot - yTop + 32} fill="transparent" {...hit('oracle', refBody('oracle'), `Per-scene oracle: ${ORACLE}%`)} />

      {/* the one axis */}
      {[0, 20, 40, 60, 80, 100].map((v) => (
        <text key={v} x={X(v)} y={g.axisY} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
          {v}
        </text>
      ))}
      <text x={(X(0) + X(100)) / 2} y={g.axisY + 19} textAnchor="middle" fontSize={11.5} fill="var(--ink-3)" style={serifItalic}>
        robot success, % of {int(ROBOT.scenes)} test scenes
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* (b) where the winner labels come from                              */
/* ---------------------------------------------------------------- */

const L = OBJECTIVES.labels;
const SHARE_WRONG = L.wrongClass / L.successful; // 0.782
const CELLS = 100;
const N_WRONG = Math.round(SHARE_WRONG * CELLS); // 78
const ROWS = 4;
const COLS = CELLS / ROWS;

function Labels({ inView, tip }: { inView: boolean; tip: TipApi }) {
  const t = useTimeline(inView, 2.6);
  const kept = L.successful - L.wrongClass;
  const body = (
    <TipBody
      title="Successful training outcomes"
      sub={`${int(L.successful)} successes of ${ROBOT.policies} policies on the training scenes`}
      rows={[
        { key: <Key color="var(--coral)" />, value: int(L.wrongClass), label: `wrong-class targets (${Math.round(SHARE_WRONG * 100)}%)` },
        { key: <Key color="var(--teal)" />, value: int(kept), label: 'the label of their scene' },
      ]}
      foot={<>A scene with several successes yields one label, the fastest policy; every other success becomes a wrong-class target. One square ≈ {Math.round(L.successful / CELLS)} outcomes.</>}
    />
  );
  const tText = phase(t, 1.7, 0.6);

  return (
    <div>
      <Kicker>Where the winner labels come from</Kicker>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="shrink-0 font-display text-[44px] font-semibold leading-none text-ink" style={{ fontVariantNumeric: 'lining-nums tabular-nums', minWidth: '1.62em' }}>
          {Math.round(SHARE_WRONG * 100 * phase(t, 0.7, 1.1))}%
        </span>
        <span className="font-sans text-[13px] leading-snug text-ink-2">
          of the <span className="num text-ink">{int(L.successful)}</span> successful training outcomes become wrong-class targets
        </span>
      </div>
      <div
        className="mt-4 grid"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, auto)`, gridAutoFlow: 'column', gap: 3 }}
        role="img"
        aria-label={`${int(L.wrongClass)} of ${int(L.successful)} successful training outcomes become wrong-class targets`}
        tabIndex={0}
        onPointerMove={(e) => tip.at(e, body)}
        onPointerLeave={tip.hide}
        onFocus={(e) => tip.atEl(e.currentTarget, body)}
        onBlur={tip.hide}
      >
        {Array.from({ length: CELLS }).map((_, k) => {
          const col = Math.floor(k / ROWS);
          const shown = phase(t, col * 0.012, 0.35);
          // a success turning into a wrong-class target: the square flips (no muddy colour blend)
          const f = k >= CELLS - N_WRONG ? clamp((t - (0.7 + (k - (CELLS - N_WRONG)) * 0.011)) / 0.24) : 0;
          const sc = (0.6 + 0.4 * shown) * (1 - 0.45 * Math.sin(Math.PI * f));
          return (
            <span
              key={k}
              className="aspect-square rounded-[2px]"
              style={{ background: f > 0.5 ? 'var(--coral)' : 'var(--teal)', opacity: shown, transform: `scale(${sc})` }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-sans text-[12px] text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'var(--coral)' }} />
          wrong-class target <span className="num text-ink">{int(L.wrongClass)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: 'var(--teal)' }} />
          the scene&rsquo;s label <span className="num text-ink">{int(kept)}</span>
        </span>
        <span className="text-ink-4">one square ≈ {Math.round(L.successful / CELLS)}</span>
      </div>
      <p className="mt-4 font-sans text-[13px] leading-[1.55] text-ink-2" style={{ opacity: tText }}>
        Several policies succeed on most training scenes, and a latency tie-break decides{' '}
        <span className="num text-ink">{Math.round(L.tieBreakShare * 100)}%</span> of the labels. The classifier learns to pick fast policies,{' '}
        <span className="num text-ink">{L.fastPolicySeconds}</span>{NB}s per scene, that often fail.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* (c) the other panels: difference from the fixed arm, points         */
/* ---------------------------------------------------------------- */

const E = OBJECTIVES.eleven;
const S = OBJECTIVES.sixteen;
const E_OUT = E.rows.find((r) => r.key === 'outcome')!;
const E_TYPE = E.rows.find((r) => r.key === 'type')!;
const E_FIX = E.rows.find((r) => r.key === 'fixed')!;
const S_WIN = S.rows.find((r) => r.key === 'winner')!;
const S_FIX = S.rows.find((r) => r.key === 'fixed')!;

type Shape = 'dot' | 'square' | 'diamond';
const OTHERS: { key: string; name: string; meta: string; d: number; ci?: [number, number]; score: number; fixed: number; fixedLabel: string; color: string; shape: Shape }[] = [
  {
    key: 'outcome',
    name: 'Outcome router',
    meta: `${E.benchmarks} benchmarks · ${E.seeds} seeds`,
    d: E_OUT.diff!,
    ci: E_OUT.ci,
    score: E_OUT.score,
    fixed: E_FIX.score,
    fixedLabel: 'matched fixed arm',
    color: 'var(--blue)',
    shape: 'dot',
  },
  {
    key: 'type',
    name: `${OBJECTIVES.typeRouter.types}-type classifier + table`,
    meta: `${E.benchmarks} benchmarks · ${E.seeds} seeds`,
    d: E_TYPE.diff!,
    ci: E_TYPE.ci,
    score: E_TYPE.score,
    fixed: E_FIX.score,
    fixedLabel: 'matched fixed arm',
    color: 'var(--ink-3)',
    shape: 'square',
  },
  {
    key: 'winner',
    name: `Winner labels, best of ${OBJECTIVES.winnerLabels16.recipes} recipes`,
    meta: `${S.benchmarks} benchmarks`,
    d: S_WIN.diff!,
    score: S_WIN.score,
    fixed: S_FIX.score,
    fixedLabel: 'fixed arm, best training mean',
    color: 'var(--coral)',
    shape: 'diamond',
  },
];

function Mark({ shape, color }: { shape: Shape; color: string }) {
  if (shape === 'square') return <rect x={-5} y={-5} width={10} height={10} fill={color} stroke="var(--surface)" strokeWidth={2} />;
  if (shape === 'diamond') return <rect x={-5} y={-5} width={10} height={10} transform="rotate(45)" fill={color} stroke="var(--surface)" strokeWidth={2} />;
  return <circle r={5.5} fill={color} stroke="var(--surface)" strokeWidth={2} />;
}

const D0 = -3.5;
const D1 = 1;

function Others({ inView, tip }: { inView: boolean; tip: TipApi }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref, 440);
  const t = useTimeline(inView, 2.6);
  const [hover, setHover] = useState<string | null>(null);
  const narrow = w < 400;
  const VAL = 132;
  const PL = 6;
  const PR = w - VAL;
  const X = (d: number) => PL + ((d - D0) / (D1 - D0)) * (PR - PL);
  const ROW = narrow ? 62 : 50;
  const LINE = narrow ? 44 : 30; // plot line, below the name
  const top = 26;
  const ys = OTHERS.map((_, i) => top + i * ROW);
  const axisY = top + OTHERS.length * ROW + 6;
  const H = axisY + 34;

  const body = (r: (typeof OTHERS)[number]) => (
    <TipBody
      title={r.name}
      sub={r.meta}
      rows={[
        { key: <Key color={r.color} />, value: r.score.toFixed(2), label: 'score' },
        { key: <Key color="var(--slate)" />, value: r.fixed.toFixed(2), label: r.fixedLabel },
      ]}
      foot={
        <>
          difference <span className="num text-ink">{sgn(r.d)}</span>
          {r.ci ? <span className="num text-ink-3"> {ival(r.ci)}, paired 95% interval</span> : <span className="text-ink-3"> · no interval reported</span>}
        </>
      }
    />
  );

  return (
    <div ref={ref}>
      <Kicker>Outside robotics · vs. the fixed arm</Kicker>
      <svg viewBox={`0 0 ${w} ${H}`} width={w} height={H} className="mt-3 block h-auto w-full overflow-visible" role="group" aria-label="Difference from the fixed arm, in points, of three routers on 11 and 16 benchmarks">
        {[-3, -2, -1, 1].map((d) => (
          <line key={d} x1={X(d)} x2={X(d)} y1={top - 6} y2={axisY - 12} stroke="var(--rule)" />
        ))}
        <line x1={X(0)} x2={X(0)} y1={top - 10} y2={axisY - 12} stroke="var(--slate)" strokeWidth={2} strokeLinecap="round" />
        <text x={X(0)} y={top - 16} textAnchor="middle" fontSize={9.5} letterSpacing="0.14em" fill="var(--ink-3)" style={mono}>
          FIXED ARM
        </text>

        {OTHERS.map((r, i) => {
          const y0 = ys[i];
          const cy = y0 + LINE;
          const p = phase(t, 0.3 + i * 0.15, 0.9);
          const dim = hover !== null && hover !== r.key;
          return (
            <g key={r.key} opacity={dim ? 0.35 : 1} style={{ transition: 'opacity .25s' }}>
              <text x={PL} y={y0 + 12} style={{ ...sans, ...halo }}>
                <tspan fontSize={12.5} fontWeight={600} fill="var(--ink)">
                  {r.name}
                </tspan>
              </text>
              <text x={narrow ? PL : w} y={y0 + (narrow ? 27 : 12)} textAnchor={narrow ? 'start' : 'end'} fontSize={10.5} fill="var(--ink-3)" style={{ ...mono, ...halo }}>
                {r.meta}
              </text>
              {r.ci && (
                <g opacity={p}>
                  <line x1={X(r.d + (r.ci[0] - r.d) * p)} x2={X(r.d + (r.ci[1] - r.d) * p)} y1={cy} y2={cy} stroke={r.color} strokeWidth={1.6} />
                  <line x1={X(r.d + (r.ci[0] - r.d) * p)} x2={X(r.d + (r.ci[0] - r.d) * p)} y1={cy - 5} y2={cy + 5} stroke={r.color} strokeWidth={1.6} />
                  <line x1={X(r.d + (r.ci[1] - r.d) * p)} x2={X(r.d + (r.ci[1] - r.d) * p)} y1={cy - 5} y2={cy + 5} stroke={r.color} strokeWidth={1.6} />
                </g>
              )}
              <g transform={`translate(${X(r.d * p)},${cy})`} opacity={p > 0 ? 1 : 0}>
                <Mark shape={r.shape} color={r.color} />
              </g>
              <text x={w} y={cy + 4} textAnchor="end" opacity={phase(t, 1.0 + i * 0.15, 0.5)} style={mono}>
                <tspan fontSize={12} fontWeight={600} fill="var(--ink)">
                  {sgn(r.d)}
                </tspan>
                {r.ci && (
                  <tspan fontSize={10.5} fill="var(--ink-3)" dx={5}>
                    {ival(r.ci)}
                  </tspan>
                )}
              </text>
              <rect
                x={0}
                y={y0}
                width={w}
                height={ROW - 4}
                fill="transparent"
                role="img"
                tabIndex={0}
                aria-label={`${r.name}, ${r.meta}: ${sgn(r.d)} points vs. the fixed arm`}
                onPointerEnter={() => setHover(r.key)}
                onPointerMove={(e) => tip.at(e, body(r))}
                onPointerLeave={() => {
                  setHover(null);
                  tip.hide();
                }}
                onFocus={(e) => {
                  setHover(r.key);
                  tip.atEl(e.currentTarget, body(r));
                }}
                onBlur={() => {
                  setHover(null);
                  tip.hide();
                }}
                style={{ outline: 'none' }}
              />
            </g>
          );
        })}

        {[-3, -2, -1, 0, 1].map((d) => (
          <text key={d} x={X(d)} y={axisY} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
            {d > 0 ? `+${d}` : d < 0 ? `${MINUS}${-d}` : '0'}
          </text>
        ))}
        <text x={(X(D0) + X(D1)) / 2} y={axisY + 19} textAnchor="middle" fontSize={11.5} fill="var(--ink-3)" style={serifItalic}>
          router − fixed arm, points
        </text>
      </svg>
      <p className="mt-2 font-sans text-[12.5px] leading-snug text-ink-3">
        No target beats the fixed arm. Only a third of the {int(OBJECTIVES.winnerLabels16.labels)} winner labels are decided by a unique best outcome; the type
        classifier, {Math.round(OBJECTIVES.typeRouter.accuracy * 100)}% accurate, maps {Math.round(OBJECTIVES.typeRouter.sameArm * 100)}% of its predictions to the
        true type&rsquo;s arm.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function TargetsCompare() {
  const box = useRef<HTMLDivElement>(null);
  const plot = useRef<HTMLDivElement>(null);
  const w = useWidth(plot);
  const inView = useInView(box, '-60px', true);
  const [tip, api] = useTip(box);
  const wide = w >= 700;

  return (
    <div ref={box} className="relative">
      <div ref={plot}>
        <Kicker>
          {['RoboTwin', `${int(ROBOT.scenes)} test scenes from ${ROBOT.unseenTasks} unseen tasks`, 'same inputs, backbone and training scenes']
            .map((x) => (w < 640 ? x : x.replace(/ /g, NB)))
            .join(' · ')}
        </Kicker>
        <div className="mt-4">
          <Hero w={w} inView={inView} tip={api} />
        </div>
      </div>
      <div
        className="mt-7 grid border-t border-rule"
        style={{ gridTemplateColumns: wide ? 'minmax(0, 0.94fr) minmax(0, 1.06fr)' : 'minmax(0, 1fr)', columnGap: 0, paddingTop: 22 }}
      >
        <div style={wide ? { paddingRight: 28 } : undefined}>
          <Labels inView={inView} tip={api} />
        </div>
        <div style={wide ? { paddingLeft: 28, borderLeft: '1px solid var(--rule)' } : { marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--rule)' }}>
          <Others inView={inView} tip={api} />
        </div>
      </div>
      <TipBox tip={tip} width={box.current?.clientWidth ?? w} />
    </div>
  );
}
