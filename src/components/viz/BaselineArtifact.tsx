import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, animate, motion } from 'motion/react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { MATCHED, OBJECTIVES } from '@/data/results';
import { clamp, easeOut, lerp, useInView, useReducedMotion } from '@/lib/hooks';
import { useTokens } from '@/theme/tokens';
import { mono, sans } from './svg';

// Finding 5 (§5.4, Table 4). One outcome router, two ways of choosing the fixed arm it is compared
// with. Requiring a score on every training input drops Opus 5.5 wherever it missed a few, so that
// baseline falls back to the next model and scores lower. Only the baseline moves; the router's
// difference from it changes sign.

type Mode = 'matched' | 'full';

const MINUS = '−';
const NB = '\u00a0';
const sgn = (v: number, d = 2) => `${v > 0.0049 ? '+' : v < -0.0049 ? MINUS : ''}${Math.abs(v).toFixed(d)}`;
const ival = (c: readonly [number, number]) => `[${sgn(c[0])},${NB}${sgn(c[1])}]`;
const int = (n: number) => n.toLocaleString('en-US');

const P = MATCHED.pooled; // matched 68.30, fullCoverage 65.52, router 67.90
const E11 = OBJECTIVES.eleven;
const OUT_CI = E11.rows.find((r) => r.key === 'outcome')!.ci!;

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
      <div className="mt-2 flex flex-col" style={{ gap: 4 }}>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            {r.key}
            <span className="num text-[12px] font-medium text-ink">{r.value}</span>
            <span className="font-sans text-[11.5px] text-ink-3">{r.label}</span>
          </div>
        ))}
      </div>
      {foot && (
        <div className="mt-2 border-t border-rule font-sans text-[11.5px] leading-snug text-ink-2" style={{ paddingTop: 6 }}>
          {foot}
        </div>
      )}
    </div>
  );
}

const Kicker = ({ children }: { children: ReactNode }) => <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{children}</div>;

function hitProps(key: string, body: ReactNode, label: string, tip: TipApi, setHover: (k: string | null) => void) {
  return {
    role: 'img',
    tabIndex: 0,
    'aria-label': label,
    onPointerEnter: () => setHover(key),
    onPointerMove: (e: { clientX: number; clientY: number }) => tip.at(e, body),
    onPointerLeave: () => {
      setHover(null);
      tip.hide();
    },
    onFocus: (e: { currentTarget: Element }) => {
      setHover(key);
      tip.atEl(e.currentTarget, body);
    },
    onBlur: () => {
      setHover(null);
      tip.hide();
    },
    style: { outline: 'none' },
  };
}

/* ---------------------------------------------------------------- */
/* pooled: the baseline moves, the router stays                        */
/* ---------------------------------------------------------------- */

const S0 = 64.6;
const S1 = 69.4;

const noop = () => {};

function NumberLine({ w, p, t, tip }: { w: number; p: number; t: number; tip: TipApi }) {
  const X = (v: number) => 14 + ((v - S0) / (S1 - S0)) * (w - 28);
  const fixed = lerp(P.matched, P.fullCoverage, p);
  const diff = P.router - fixed;
  const y = 58;
  const tIn = phase(t, 0, 0.5);
  const tR = phase(t, 0.15, 0.5);
  const tF = phase(t, 0.35, 0.5);
  const tC = phase(t, 0.7, 0.6);
  // the other baseline stays visible as a ghost, fading out of the way as the moving mark nears it
  const ghostO = (v: number) => clamp((Math.abs(X(v) - X(fixed)) - 34) / 50);
  const ghosts = [
    { key: 'g-full', v: P.fullCoverage, label: 'full coverage', o: ghostO(P.fullCoverage) },
    { key: 'g-matched', v: P.matched, label: 'matched', o: ghostO(P.matched) },
  ];
  const routerBody = (
    <TipBody
      title="Outcome router"
      sub={`${E11.benchmarks} benchmarks · ${int(E11.inputs)} test inputs · ${E11.seeds} seeds`}
      rows={[
        { key: <Key color="var(--blue)" />, value: P.router.toFixed(2), label: 'router, either way' },
        { key: <Key color="var(--slate)" />, value: P.matched.toFixed(2), label: 'matched fixed arm' },
        { key: <Key color="var(--slate)" kind="dash" />, value: P.fullCoverage.toFixed(2), label: 'fixed arm requiring full coverage' },
      ]}
    />
  );
  const fixedBody = (
    <TipBody
      title={p < 0.5 ? 'Matched fixed arm' : 'Fixed arm requiring full coverage'}
      sub={p < 0.5 ? 'Opus 5.5, with GPT-6 Astra’s outcome where Opus has none' : 'falls back to the next model where Opus 5.5 misses a score'}
      rows={[{ key: <Key color="var(--slate)" />, value: (p < 0.5 ? P.matched : P.fullCoverage).toFixed(2), label: 'pooled score' }]}
      foot={
        <>
          router − fixed <span className="num text-ink">{sgn(p < 0.5 ? P.vsMatched : P.vsFull)}</span>
        </>
      }
    />
  );

  return (
    <svg viewBox={`0 0 ${w} 136`} width={w} height={136} className="block h-auto w-full overflow-visible" role="group" aria-label={`Pooled scores: router ${P.router}, fixed arm ${fixed.toFixed(2)}`}>
      <g opacity={tIn}>
        {[65, 66, 67, 68, 69].map((v) => (
          <g key={v}>
            <line x1={X(v)} x2={X(v)} y1={y - 4} y2={y + 4} stroke="var(--ink-4)" />
            <text x={X(v)} y={128} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
              {v}
            </text>
          </g>
        ))}
        <line x1={X(S0)} x2={X(S1)} y1={y} y2={y} stroke="var(--rule-2)" />
      </g>

      {/* the inactive baseline, as a ghost */}
      {ghosts.map((g) => (
        <g key={g.key} opacity={g.o * tF}>
          <line x1={X(g.v)} x2={X(g.v)} y1={y - 12} y2={y + 12} stroke="var(--slate)" strokeWidth={2} strokeDasharray="3 3" />
          <text x={X(g.v)} y={y + 30} textAnchor="middle" fontSize={11.5} fill="var(--ink-3)" style={{ ...sans, ...halo }}>
            {g.label}
          </text>
          <text x={X(g.v)} y={y + 45} textAnchor="middle" fontSize={11.5} fill="var(--ink-3)" style={{ ...mono, ...halo }}>
            {g.v.toFixed(2)}
          </text>
        </g>
      ))}

      {/* the difference, drawn between the two marks */}
      <path d={barPath(X(fixed), X(fixed) + (X(P.router) - X(fixed)) * tC, y - 2.5, 5, 2.5)} fill={diff < 0 ? 'var(--coral)' : 'var(--blue)'} />

      {/* the fixed arm: the only thing that moves */}
      <g opacity={tF} transform={`translate(${X(fixed)},0)`}>
        <line x1={0} x2={0} y1={y - 13} y2={y + 13} stroke="var(--surface)" strokeWidth={6} strokeLinecap="round" />
        <line x1={0} x2={0} y1={y - 12} y2={y + 12} stroke="var(--slate)" strokeWidth={3} strokeLinecap="round" />
        <text x={0} y={y + 30} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)" style={{ ...sans, ...halo }}>
          fixed arm
        </text>
        <text x={0} y={y + 45} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)" style={{ ...mono, ...halo }}>
          {fixed.toFixed(2)}
        </text>
        <rect x={-30} y={y - 16} width={60} height={66} fill="transparent" {...hitProps('fixed', fixedBody, `Fixed arm ${fixed.toFixed(2)}`, tip, noop)} />
      </g>

      {/* the router: stays put */}
      <g opacity={tR}>
        <circle cx={X(P.router)} cy={y} r={7.5} fill="var(--blue)" stroke="var(--surface)" strokeWidth={2.5} />
        <text x={X(P.router)} y={y - 30} textAnchor="middle" fontSize={12} fill="var(--ink-2)" style={{ ...sans, ...halo }}>
          outcome router
        </text>
        <text x={X(P.router)} y={y - 15} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)" style={{ ...mono, ...halo }}>
          {P.router.toFixed(2)}
        </text>
        <rect x={X(P.router) - 44} y={y - 44} width={88} height={56} fill="transparent" {...hitProps('router', routerBody, `Outcome router ${P.router}`, tip, noop)} />
      </g>
    </svg>
  );
}

const D0 = -1.5;
const D1 = 3;

function DiffBar({ w, p, t, tip }: { w: number; p: number; t: number; tip: TipApi }) {
  const X = (d: number) => 10 + ((d - D0) / (D1 - D0)) * (w - 20);
  const fixed = lerp(P.matched, P.fullCoverage, p);
  const diff = (P.router - fixed) * phase(t, 0.7, 0.8);
  const y = 34;
  const ciO = clamp(1 - p * 4) * phase(t, 1.3, 0.5);
  const body = (
    <TipBody
      title="Router − fixed arm, pooled"
      sub={`${E11.benchmarks} benchmarks · ${int(E11.inputs)} test inputs · ${E11.seeds} seeds`}
      rows={[
        { key: <Key color="var(--coral)" />, value: sgn(P.vsMatched), label: `vs. matched fixed arm ${ival(OUT_CI)}` },
        { key: <Key color="var(--blue)" />, value: sgn(P.vsFull), label: 'vs. fixed arm requiring full coverage' },
      ]}
    />
  );
  return (
    <svg viewBox={`0 0 ${w} 76`} width={w} height={76} className="block h-auto w-full overflow-visible" role="group" aria-label={`Router minus fixed arm: ${sgn(P.router - fixed)} points`}>
      {[-1, 1, 2, 3].map((d) => (
        <line key={d} x1={X(d)} x2={X(d)} y1={y - 16} y2={y + 16} stroke="var(--rule)" />
      ))}
      <line x1={X(0)} x2={X(0)} y1={y - 20} y2={y + 18} stroke="var(--slate)" strokeWidth={2} strokeLinecap="round" />
      <text x={X(0)} y={y - 25} textAnchor="middle" fontSize={9.5} letterSpacing="0.14em" fill="var(--ink-3)" style={mono}>
        FIXED ARM
      </text>
      <path d={barPath(X(0), X(diff), y - 8, 16)} fill={diff < 0 ? 'var(--coral)' : 'var(--blue)'} />
      <g opacity={ciO}>
        <line x1={X(OUT_CI[0])} x2={X(OUT_CI[1])} y1={y} y2={y} stroke="var(--ink)" strokeWidth={1.3} />
        <line x1={X(OUT_CI[0])} x2={X(OUT_CI[0])} y1={y - 6} y2={y + 6} stroke="var(--ink)" strokeWidth={1.3} />
        <line x1={X(OUT_CI[1])} x2={X(OUT_CI[1])} y1={y - 6} y2={y + 6} stroke="var(--ink)" strokeWidth={1.3} />
      </g>
      {[-1, 0, 1, 2, 3].map((d) => (
        <text key={d} x={X(d)} y={y + 36} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
          {d > 0 ? `+${d}` : d < 0 ? `${MINUS}${-d}` : '0'}
        </text>
      ))}
      <rect x={0} y={y - 18} width={w} height={36} fill="transparent" {...hitProps('diff', body, 'Router minus fixed arm', tip, noop)} />
    </svg>
  );
}

function Readout({ p, t }: { p: number; t: number }) {
  const fixed = lerp(P.matched, P.fullCoverage, p);
  const diff = P.router - fixed;
  const neg = diff < -0.0049;
  return (
    <div style={{ opacity: phase(t, 0.5, 0.6) }}>
      <Kicker>Router − fixed arm</Kicker>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-[54px] font-semibold leading-none text-ink" style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
          {sgn(diff)}
        </span>
        <span className="font-sans text-[13px] text-ink-3">points</span>
      </div>
      <div className="relative mt-2 h-[38px]">
        <AnimatePresence initial={false} mode="wait">
          <motion.p
            key={neg ? 'neg' : 'pos'}
            className="font-sans text-[12.5px] leading-snug text-ink-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: neg ? 'var(--coral)' : 'var(--blue)' }} />
            {neg ? (
              <>
                a deficit, within noise <span className="num text-ink-3">{ival(OUT_CI)}</span>
              </>
            ) : (
              <>an apparent gain: only the baseline moved</>
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* two benchmarks: matched → full coverage                            */
/* ---------------------------------------------------------------- */

const EX = [...MATCHED.examples].sort((a, b) => b.matched - a.matched);
const Y0 = 48;
const Y1 = 82;

function Slopes({ w, p, t, tip }: { w: number; p: number; t: number; tip: TipApi }) {
  const [hover, setHover] = useState<string | null>(null);
  const XL = 62;
  const XR = w - 62;
  const top = 46;
  const bottom = 214;
  const Y = (v: number) => bottom - ((v - Y0) / (Y1 - Y0)) * (bottom - top);
  const tLine = phase(t, 0.3, 0.9);
  const active = p < 0.5 ? 0 : 1;
  return (
    <svg viewBox={`0 0 ${w} 232`} width={w} height={232} className="block h-auto w-full overflow-visible" role="group" aria-label="Fixed arm's score on HLE and AA-Omniscience, matched and requiring full coverage">
      {['matched', 'full coverage'].map((h, j) => (
        <g key={h}>
          <text x={j ? XR : XL} y={14} textAnchor="middle" fontSize={12} fontWeight={active === j ? 650 : 400} fill={active === j ? 'var(--ink)' : 'var(--ink-3)'} style={sans}>
            {h}
          </text>
          <line x1={j ? XR : XL} x2={j ? XR : XL} y1={24} y2={bottom + 8} stroke="var(--rule)" />
        </g>
      ))}
      {EX.map((e, i) => {
        const yl = Y(e.matched);
        const yr = Y(e.fullCoverage);
        const xe = XL + (XR - XL) * tLine;
        const ye = yl + (yr - yl) * tLine;
        const xd = lerp(XL, XR, p);
        const yd = lerp(yl, yr, p);
        const v = lerp(e.matched, e.fullCoverage, p);
        const dim = hover !== null && hover !== e.bench;
        const body = (
          <TipBody
            title={e.bench}
            sub="fixed arm’s test score"
            rows={[
              { key: <Key color="var(--slate)" />, value: e.matched.toFixed(2), label: 'matched' },
              { key: <Key color="var(--slate)" kind="dash" />, value: e.fullCoverage.toFixed(2), label: 'requiring full coverage' },
            ]}
            foot={
              <>
                the full-coverage baseline scores <span className="num text-ink">{(e.matched - e.fullCoverage).toFixed(2)}</span> points lower
              </>
            }
          />
        );
        return (
          <g key={e.bench} opacity={dim ? 0.3 : 1} style={{ transition: 'opacity .25s' }}>
            <text x={XL} y={yl - 14} fontSize={12} fontWeight={600} fill="var(--ink)" style={{ ...sans, ...halo }}>
              {e.bench}
            </text>
            <line x1={XL} y1={yl} x2={xe} y2={ye} stroke="var(--slate)" strokeWidth={2} strokeLinecap="round" />
            <circle cx={XL} cy={yl} r={4.5} fill="var(--surface)" stroke="var(--slate)" strokeWidth={1.8} />
            <circle cx={XR} cy={yr} r={4.5} fill="var(--surface)" stroke="var(--slate)" strokeWidth={1.8} opacity={tLine >= 1 ? 1 : 0} />
            <text x={XL - 12} y={yl + 4} textAnchor="end" fontSize={11.5} fontWeight={active === 0 ? 600 : 400} fill={active === 0 ? 'var(--ink)' : 'var(--ink-3)'} style={mono}>
              {e.matched.toFixed(2)}
            </text>
            <text x={XR + 12} y={yr + 4} textAnchor="start" fontSize={11.5} fontWeight={active === 1 ? 600 : 400} fill={active === 1 ? 'var(--ink)' : 'var(--ink-3)'} style={mono} opacity={tLine}>
              {e.fullCoverage.toFixed(2)}
            </text>
            <text x={(XL + XR) / 2} y={(yl + yr) / 2 + 20} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={{ ...mono, ...halo }} opacity={phase(t, 1.1, 0.5)}>
              {MINUS}
              {(e.matched - e.fullCoverage).toFixed(2)}
            </text>
            {/* the baseline, travelling with the toggle */}
            <circle cx={xd} cy={yd} r={6} fill="var(--slate)" stroke="var(--surface)" strokeWidth={2} opacity={phase(t, 1.0, 0.4)} />
            <rect
              x={0}
              y={Math.min(yl, yr) - 26}
              width={w}
              height={Math.abs(yr - yl) + 40}
              fill="transparent"
              {...hitProps(e.bench, body, `${e.bench}: ${e.matched.toFixed(2)} matched, ${e.fullCoverage.toFixed(2)} with full coverage; now ${v.toFixed(2)}`, tip, setHover)}
            />
          </g>
        );
      })}
    </svg>
  );
}

function Missing({ t, tip }: { t: number; tip: TipApi }) {
  const { missed, of } = MATCHED.hleMissing;
  const body = (
    <TipBody
      title="Opus 5.5 on HLE training inputs"
      sub={`${int(of)} training inputs`}
      rows={[
        { key: <Key color="var(--slate)" />, value: int(of - missed), label: 'scored' },
        { key: <Key color="var(--coral)" />, value: int(missed), label: 'missing' },
      ]}
      foot={<>A few scores are also missing on {MATCHED.benchmarksWithMissing - 1} other benchmarks.</>}
    />
  );
  const grow = phase(t, 0.6, 1.0);
  return (
    <div>
      <p className="font-sans text-[12.5px] leading-snug text-ink-2">
        Opus 5.5 lacks <span className="num text-ink">{missed}</span> of <span className="num text-ink">{int(of)}</span> HLE training scores.
      </p>
      <div
        className="mt-2 flex h-2 w-full"
        style={{ gap: 2 }}
        role="img"
        aria-label={`${missed} of ${of} scores missing`}
        tabIndex={0}
        onPointerMove={(e) => tip.at(e, body)}
        onPointerLeave={tip.hide}
        onFocus={(e) => tip.atEl(e.currentTarget, body)}
        onBlur={tip.hide}
      >
        <span className="h-full" style={{ width: `${((of - missed) / of) * 100 * grow}%`, background: 'var(--slate)', borderRadius: '4px 0 0 4px' }} />
        <span className="h-full" style={{ width: `${(missed / of) * 100}%`, minWidth: 3, background: 'var(--coral)', borderRadius: '0 4px 4px 0', opacity: grow >= 1 ? 1 : 0, transition: 'opacity .3s' }} />
      </div>
      <p className="mt-2.5 font-sans text-[12px] leading-snug text-ink-3">
        Missing a few scores on {MATCHED.benchmarksWithMissing} benchmarks, it fails the full-coverage rule there. The matched arm uses{' '}
        {MATCHED.fallbackArm}&rsquo;s outcome where Opus 5.5 has none, as the routers do.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function BaselineArtifact() {
  const tk = useTokens();
  const box = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const W = useWidth(outerRef);
  const wl = useWidth(leftRef, 480);
  const wr = useWidth(rightRef, 340);
  const inView = useInView(box, '-60px', true);
  const reduce = useReducedMotion();
  const [tip, api] = useTip(box);
  const [mode, setMode] = useState<Mode>('matched');
  const [p, setP] = useState(0);
  const pRef = useRef(0);
  const t = useTimeline(inView, 2.2);
  const wide = W >= 700;

  useEffect(() => {
    const target = mode === 'full' ? 1 : 0;
    if (reduce) {
      pRef.current = target;
      setP(target);
      return;
    }
    const c = animate(pRef.current, target, {
      duration: 1.35,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => {
        pRef.current = v;
        setP(v);
      },
    });
    return () => c.stop();
  }, [mode, reduce]);

  const split = wide && wl >= 430;

  return (
    <div ref={box} className="relative">
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Kicker>Fixed arm</Kicker>
        <RubberSegment
          items={[
            { value: 'matched', label: 'Matched' },
            { value: 'full', label: W < 480 ? 'Full coverage' : 'Requires full coverage' },
          ]}
          value={mode}
          onChange={(v) => {
            api.hide();
            setMode(v as Mode);
          }}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="How the fixed arm is chosen"
        />
      </div>

      <div ref={outerRef} className="grid" style={{ gridTemplateColumns: wide ? 'minmax(0, 1.18fr) minmax(0, 0.82fr)' : 'minmax(0, 1fr)' }}>
        <div ref={leftRef} style={wide ? { paddingRight: 30 } : undefined}>
          <Kicker>{['Pooled', `${E11.benchmarks} benchmarks`, `${int(E11.inputs)} test inputs`, `${E11.seeds} seeds`].map((x) => x.replace(/ /g, NB)).join(' · ')}</Kicker>
          <div className="mt-4">
            <NumberLine w={wl - (wide ? 30 : 0)} p={p} t={t} tip={api} />
          </div>
          <div className="mt-5 grid items-end" style={{ gridTemplateColumns: split ? '200px minmax(0, 1fr)' : 'minmax(0, 1fr)', columnGap: 18, rowGap: 12 }}>
            <Readout p={p} t={t} />
            <DiffBar w={split ? wl - 30 - 200 - 18 : wl - (wide ? 30 : 0)} p={p} t={t} tip={api} />
          </div>
        </div>
        <div ref={rightRef} style={wide ? { paddingLeft: 30, borderLeft: '1px solid var(--rule)' } : { marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
          <Kicker>Fixed arm on two of the {MATCHED.benchmarksWithMissing} benchmarks</Kicker>
          <div className="mt-3">
            <Slopes w={wr - (wide ? 30 : 0)} p={p} t={t} tip={api} />
          </div>
          <div className="mt-3">
            <Missing t={t} tip={api} />
          </div>
        </div>
      </div>
      <TipBox tip={tip} width={box.current?.clientWidth ?? W} />
    </div>
  );
}

