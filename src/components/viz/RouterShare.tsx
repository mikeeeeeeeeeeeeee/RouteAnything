import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, animate, motion } from 'motion/react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { GROUPS, ONE_ROUTER, ROUTERS, ROUTERS_ALL, ROUTERS_BENCH, ROUTER_ROBOT, type GroupKey, type RouterRow } from '@/data/results';
import { clamp, easeOut, useInView, useReducedMotion } from '@/lib/hooks';
import { useTokens } from '@/theme/tokens';
import { mono, sans } from './svg';

// Finding 2 (Table 3, Table 7). One capability-tree router over 16 benchmarks, read two ways:
//  · by output group, as the share of the headroom it captures on a track that runs from the fixed
//    candidate (0%) to the per-input oracle (100%); the robot row is a different router (Section 5.2);
//  · by benchmark, as router − fixed in points.
// Most of every track stays empty: that is the finding.

type View = 'group' | 'bench';

const MINUS = '−';
const sgn = (v: number, d = 2) => `${v > 0 ? '+' : v < 0 ? MINUS : ''}${Math.abs(v).toFixed(d)}`;
const pct = (s: number) => `${s < 0 ? MINUS : ''}${Math.round(Math.abs(s) * 100)}%`;
const int = (n: number) => n.toLocaleString('en-US');
const NB = '\u00a0';
const ival = (c: [number, number]) => `[${sgn(c[0])},${NB}${sgn(c[1])}]`;
const short = (k: GroupKey) => GROUPS.find((g) => g.key === k)?.short ?? k;
/** paper style: one decimal for departures, two where the router sits within 0.05 of the fixed candidate */
const fmtD = (d: number) => (Math.abs(d) < 0.05 ? sgn(d, 2) : sgn(d, 1));

/** horizontal bar from a baseline x0 to a data end x1, rounded (4px) at the data end only */
function barPath(x0: number, x1: number, y: number, h: number, r = 4) {
  const len = Math.abs(x1 - x0);
  if (len < 0.25) return '';
  const rr = Math.min(r, len, h / 2);
  return x1 >= x0
    ? `M${x0},${y}H${x1 - rr}A${rr},${rr} 0 0 1 ${x1},${y + rr}V${y + h - rr}A${rr},${rr} 0 0 1 ${x1 - rr},${y + h}H${x0}Z`
    : `M${x0},${y}H${x1 + rr}A${rr},${rr} 0 0 0 ${x1},${y + rr}V${y + h - rr}A${rr},${rr} 0 0 0 ${x1 + rr},${y + h}H${x0}Z`;
}

/** text halo, so labels stay legible where they cross a gridline */
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

/** a one-shot clock in seconds, 0 → total, started when `run` turns true */
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
  const W = 236;
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

function Key({ color, kind = 'line' }: { color: string; kind?: 'line' | 'dash' | 'ring' }) {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" className="shrink-0" aria-hidden>
      {kind === 'ring' ? (
        <circle cx={7} cy={5} r={3.4} fill="none" stroke={color} strokeWidth={1.6} />
      ) : (
        <line x1={1.5} y1={5} x2={12.5} y2={5} stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray={kind === 'dash' ? '2.5 2.5' : undefined} />
      )}
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

/* ---------------------------------------------------------------- */
/* By group: share of the headroom                                    */
/* ---------------------------------------------------------------- */

type ShareRow = RouterRow & { kind: 'group' | 'all' | 'robot'; meta: string };

const SHARE_ROWS: ShareRow[] = [
  ...ROUTERS.map((r) => ({ ...r, kind: 'group' as const, meta: `${r.benchmarks} benchmark${r.benchmarks > 1 ? 's' : ''} · ${int(r.inputs)} inputs` })),
  { ...ROUTERS_ALL, kind: 'all', meta: `pooled · ${int(ROUTERS_ALL.inputs)} inputs` },
  { ...ROUTER_ROBOT, label: 'Robot manipulation', kind: 'robot', meta: `RoboTwin · ${int(ROUTER_ROBOT.inputs)} test scenes` },
];

function groupGeom(w: number) {
  const narrow = w < 600;
  if (!narrow) {
    const LW = 196;
    const X0 = LW + 34;
    const X1 = w - 206;
    const ROW = 52;
    const top = 30;
    const cys = [0, 1, 2, 3, 4].map((i) => top + i * ROW + ROW / 2);
    const sepY = top + 5 * ROW + 4;
    cys.push(sepY + 6 + ROW / 2);
    const robotSep = cys[5] + ROW / 2 + 14;
    const robotKick = robotSep + 22;
    cys.push(robotKick + 8 + ROW / 2);
    const axisY = cys[6] + ROW / 2 + 10;
    return { narrow, X0, X1, ROW, cys, sepY, robotSep, robotKick, axisY, H: axisY + 34, cols: [w - 128, w - 67, w - 6] };
  }
  const X0 = 22;
  const X1 = w - 12;
  const ROW = 70;
  const top = 24;
  const tops = [0, 1, 2, 3, 4].map((i) => top + i * ROW);
  const sepY = top + 5 * ROW + 2;
  tops.push(sepY + 8);
  const robotSep = tops[5] + ROW + 8;
  const robotKick = robotSep + 22;
  tops.push(robotKick + 8);
  const cys = tops.map((y) => y + 32);
  const axisY = tops[6] + ROW + 4;
  return { narrow, X0, X1, ROW, cys, sepY, robotSep, robotKick, axisY, H: axisY + 34, cols: [] as number[] };
}

function GroupView({ w, inView, tip }: { w: number; inView: boolean; tip: TipApi }) {
  const g = groupGeom(w);
  const t = useTimeline(inView, 2.3);
  const [hover, setHover] = useState<number | null>(null);
  const X = (s: number) => g.X0 + s * (g.X1 - g.X0);
  const ticks = g.narrow ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];

  const body = (r: ShareRow) => (
    <TipBody
      title={r.kind === 'robot' ? 'Robot manipulation · outcome router' : r.label}
      sub={r.kind === 'all' ? `capability-tree router · ${int(r.inputs)} test inputs` : `${r.benchmarks} benchmark${r.benchmarks > 1 ? 's' : ''} · ${int(r.inputs)} test ${r.kind === 'robot' ? 'scenes' : 'inputs'}`}
      rows={[
        { key: <Key color="var(--blue)" />, value: r.router.toFixed(2), label: 'router' },
        { key: <Key color="var(--slate)" />, value: r.fixed.toFixed(2), label: 'fixed candidate' },
        { key: <Key color="var(--ink-3)" kind="ring" />, value: r.oracle.toFixed(2), label: 'oracle' },
      ]}
      foot={
        <>
          router − fixed <span className="num text-ink">{sgn(r.diff)}</span>
          {r.ci && <span className="num text-ink-3"> {ival(r.ci)}</span>} · share <span className="num text-ink">{pct(r.share)}</span> of{' '}
          <span className="num">{(r.oracle - r.fixed).toFixed(2)}</span> points of headroom
        </>
      }
    />
  );

  return (
    <svg viewBox={`0 0 ${w} ${g.H}`} width={w} height={g.H} className="block h-auto w-full overflow-visible" role="group" aria-label="Share of the headroom between the fixed candidate and the oracle captured by the router, per output group">
      {/* header */}
      <text x={0} y={12} fontSize={9.5} letterSpacing="0.14em" fill="var(--ink-3)" style={mono}>
        CAPABILITY-TREE ROUTER{g.narrow ? '' : ' · BY OUTPUT GROUP'}
      </text>
      {!g.narrow &&
        ['FIXED', 'ROUTER', 'ORACLE'].map((h, j) => (
          <text key={h} x={g.cols[j]} y={12} textAnchor="end" fontSize={9.5} letterSpacing="0.14em" fill="var(--ink-3)" style={mono}>
            {h}
          </text>
        ))}

      {/* recessive grid */}
      {ticks
        .filter((s) => s > 0 && s < 1)
        .map((s) => (
          <line key={s} x1={X(s)} x2={X(s)} y1={g.cys[0] - 22} y2={g.axisY - 8} stroke="var(--rule)" />
        ))}

      {/* block separators */}
      <line x1={0} x2={w} y1={g.sepY} y2={g.sepY} stroke="var(--rule-2)" />
      <line x1={0} x2={w} y1={g.robotSep} y2={g.robotSep} stroke="var(--rule)" />
      <text x={0} y={g.robotKick} fontSize={9.5} letterSpacing="0.14em" fill="var(--ink-3)" style={{ ...mono, ...halo }}>
        {g.narrow ? 'ROBOTS · OUTCOME ROUTER' : 'ROBOTS · A DIFFERENT ROUTER: OUTCOME ROUTER READING CAMERA FRAMES'}
      </text>

      {SHARE_ROWS.map((r, i) => {
        const cy = g.cys[i];
        const tTrack = phase(t, 0.05 + i * 0.07, 0.75);
        const tRing = phase(t, 0.55 + i * 0.07, 0.3);
        const tMark = phase(t, 0.85 + i * 0.07, 0.85);
        const tLab = phase(t, 1.35 + i * 0.07, 0.45);
        const tNum = phase(t, 0.15 + i * 0.05, 0.5);
        const xm = X(r.share * tMark);
        const strong = r.kind === 'all';
        const dim = hover !== null && hover !== i;
        const labX = Math.max(xm, X(0)) + 11;
        return (
          <g key={r.key} opacity={dim ? 0.3 : 1} style={{ transition: 'opacity .25s' }}>
            {/* row label */}
            {g.narrow ? (
              <>
                <text x={0} y={cy - 18} fontSize={13} fontWeight={strong ? 650 : 500} fill="var(--ink)" style={{ ...sans, ...halo }}>
                  {r.label}
                </text>
                <text x={w} y={cy - 18} textAnchor="end" opacity={tLab} style={{ ...sans, ...halo }}>
                  <tspan fontSize={13} fontWeight={650} fill="var(--ink)">
                    {pct(r.share)}
                  </tspan>
                  <tspan dx={6} fontSize={10.5} fill="var(--ink-3)" style={mono}>
                    {sgn(r.diff)}
                    {r.ci ? ` ${ival(r.ci)}` : ''}
                  </tspan>
                </text>
                <text x={0} y={cy + 25} fontSize={10.5} fill="var(--ink-3)" style={{ ...mono, ...halo }} opacity={tNum}>
                  fixed {r.fixed.toFixed(2)} · <tspan fill="var(--ink)">router {r.router.toFixed(2)}</tspan> · oracle {r.oracle.toFixed(2)}
                </text>
              </>
            ) : (
              <>
                <text x={0} y={cy - 1} fontSize={13.5} fontWeight={strong ? 650 : 500} fill="var(--ink)" style={sans}>
                  {r.label}
                </text>
                <text x={0} y={cy + 15} fontSize={10.5} fill="var(--ink-3)" style={mono}>
                  {r.meta}
                </text>
                {[r.fixed, r.router, r.oracle].map((v, j) => (
                  <text
                    key={j}
                    x={g.cols[j]}
                    y={cy + 4}
                    textAnchor="end"
                    fontSize={12}
                    fontWeight={j === 1 ? 600 : 400}
                    fill={j === 1 ? 'var(--ink)' : 'var(--ink-3)'}
                    style={mono}
                    opacity={tNum}
                  >
                    {v.toFixed(2)}
                  </text>
                ))}
              </>
            )}

            {/* the headroom: fixed candidate (0%) → oracle (100%) */}
            <rect x={X(0)} y={cy - 6} width={Math.max(0, (X(1) - X(0)) * tTrack)} height={12} rx={6} fill="var(--surface-2)" stroke="var(--rule-2)" />
            <path d={barPath(X(0), xm, cy - 6, 12)} fill={r.share >= 0 ? 'var(--blue)' : 'var(--coral)'} />
            <line x1={X(0)} x2={X(0)} y1={cy - 11} y2={cy + 11} stroke="var(--slate)" strokeWidth={2} strokeLinecap="round" />
            <circle cx={X(1)} cy={cy} r={6} fill="var(--surface)" stroke="var(--ink-3)" strokeWidth={2} opacity={tRing} />
            <circle cx={xm} cy={cy} r={6.5} fill="var(--blue)" stroke="var(--surface)" strokeWidth={2} opacity={tMark > 0 ? 1 : 0} />

            {/* direct label: share, and router − fixed in points */}
            {!g.narrow && (
              <text x={labX} y={cy - 11} opacity={tLab} style={{ ...sans, ...halo }}>
                <tspan fontSize={strong ? 14.5 : 13} fontWeight={650} fill="var(--ink)">
                  {pct(r.share)}
                </tspan>
                <tspan dx={7} fontSize={10.5} fill="var(--ink-3)" style={mono}>
                  {sgn(r.diff)}
                  {r.ci ? ` ${ival(r.ci)}` : ''}
                </tspan>
              </text>
            )}

            {/* hover / focus target */}
            <rect
              x={0}
              y={cy - (g.narrow ? 34 : g.ROW / 2)}
              width={w}
              height={g.narrow ? g.ROW - 6 : g.ROW}
              fill="transparent"
              role="img"
              tabIndex={0}
              aria-label={`${r.label}: router ${r.router.toFixed(2)}, fixed ${r.fixed.toFixed(2)}, oracle ${r.oracle.toFixed(2)}, share ${pct(r.share)}`}
              onPointerEnter={() => setHover(i)}
              onPointerMove={(e) => tip.at(e, body(r))}
              onPointerLeave={() => {
                setHover(null);
                tip.hide();
              }}
              onFocus={(e) => {
                setHover(i);
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

      {/* the one axis */}
      {ticks.map((s) => (
        <text key={s} x={X(s)} y={g.axisY + 6} textAnchor={s === 0 ? 'start' : s === 1 ? 'end' : 'middle'} dx={s === 0 ? -4 : s === 1 ? 6 : 0} fontSize={10.5} fill="var(--ink-3)" style={mono}>
          {s === 0 ? (g.narrow ? '0%' : '0% · fixed candidate') : s === 1 ? (g.narrow ? '100%' : 'oracle · 100%') : `${s * 100}%`}
        </text>
      ))}
      <text x={(X(0) + X(1)) / 2} y={g.axisY + 25} textAnchor="middle" fontSize={11.5} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
        share of the headroom the router captures
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* By benchmark: router − fixed, points                               */
/* ---------------------------------------------------------------- */

const BENCH = ROUTERS_BENCH.map((b, i) => ({ ...b, i, d: Math.round((b.router - b.fixed) * 100) / 100 })).sort((a, b) => b.d - a.d || a.i - b.i);
/** the benchmarks on which the router stays within 0.01 points of the fixed candidate (the paper: 10) */
const SAME = BENCH.filter((b) => Math.abs(b.d) <= 0.01);

function benchGeom(w: number) {
  const narrow = w < 600;
  const ROW = narrow ? 24 : 25;
  const top = narrow ? 44 : 30;
  const LW = narrow ? 118 : 196;
  const ZL = narrow ? 124 : LW + 34;
  const ZR = narrow ? w - 40 : w - 150;
  const cys = BENCH.map((_, i) => top + i * ROW + ROW / 2);
  const axisY = top + BENCH.length * ROW + 16;
  return { narrow, ROW, LW, ZL, ZR, cys, axisY, H: axisY + 34 };
}

const D0 = -3;
const D1 = 9;

function BenchView({ w, inView, tip }: { w: number; inView: boolean; tip: TipApi }) {
  const g = benchGeom(w);
  const t = useTimeline(inView, 1.9);
  const [hover, setHover] = useState<number | null>(null);
  const X = (d: number) => g.ZL + ((d - D0) / (D1 - D0)) * (g.ZR - g.ZL);
  const zero = X(0);
  const iA = BENCH.findIndex((b) => Math.abs(b.d) <= 0.01);
  const iB = iA + SAME.length - 1;
  const tBr = phase(t, 1.0, 0.6);

  const body = (b: (typeof BENCH)[number]) => (
    <TipBody
      title={b.bench}
      sub={`${short(b.group)} · ${int(b.inputs)} test inputs · fixed candidate ${b.fixedArm}`}
      rows={[
        { key: <Key color="var(--blue)" />, value: b.router.toFixed(2), label: 'router' },
        { key: <Key color="var(--slate)" />, value: b.fixed.toFixed(2), label: 'fixed candidate' },
        { key: <Key color="var(--ink-3)" kind="ring" />, value: b.oracle.toFixed(2), label: 'oracle' },
      ]}
      foot={
        <>
          router − fixed <span className="num text-ink">{sgn(b.d)}</span>
          {Math.abs(b.d) <= 0.01 && <span className="text-ink-3"> · matches the fixed candidate</span>}
        </>
      }
    />
  );

  return (
    <svg viewBox={`0 0 ${w} ${g.H}`} width={w} height={g.H} className="block h-auto w-full overflow-visible" role="group" aria-label="Router minus fixed candidate, in points, on each of the 16 benchmarks">
      <text x={0} y={12} fontSize={9.5} letterSpacing="0.14em" fill="var(--ink-3)" style={mono}>
        {g.narrow ? 'ROUTER − FIXED, BY BENCHMARK' : 'ROUTER − FIXED CANDIDATE, BY BENCHMARK · SORTED'}
      </text>
      <text x={zero} y={g.cys[0] - 19} textAnchor="middle" fontSize={9.5} letterSpacing="0.14em" fill="var(--ink-3)" style={mono}>
        FIXED CANDIDATE
      </text>

      {/* grid + zero */}
      {[-2, 2, 4, 6, 8].map((d) => (
        <line key={d} x1={X(d)} x2={X(d)} y1={g.cys[0] - 12} y2={g.axisY - 8} stroke="var(--rule)" />
      ))}
      <line x1={zero} x2={zero} y1={g.cys[0] - 13} y2={g.axisY - 8} stroke="var(--slate)" strokeWidth={1.5} />

      {/* bracket over the benchmarks where the router sends (almost) every input to the fixed candidate */}
      {iA >= 0 && (
        <g opacity={tBr}>
          <path
            d={`M${zero + 14},${g.cys[iA] - 7}h6V${g.cys[iB] + 7}h-6`}
            fill="none"
            stroke="var(--ink-4)"
            strokeWidth={1.2}
            transform={`translate(${(1 - tBr) * -6},0)`}
          />
          <text x={zero + 30} y={(g.cys[iA] + g.cys[iB]) / 2 - 3} fontSize={g.narrow ? 11.5 : 12.5} fontWeight={600} fill="var(--ink-2)" style={sans}>
            router = fixed candidate
          </text>
          <text x={zero + 30} y={(g.cys[iA] + g.cys[iB]) / 2 + 13} fontSize={10.5} fill="var(--ink-3)" style={mono}>
            {g.narrow ? `on ${SAME.length} of ${BENCH.length}` : `on ${SAME.length} of ${BENCH.length} benchmarks, within 0.01 points`}
          </text>
        </g>
      )}

      {BENCH.map((b, i) => {
        const cy = g.cys[i];
        const p = phase(t, 0.1 + i * 0.04, 0.75);
        const xe = X(b.d * p);
        const flat = Math.abs(b.d) < 0.05;
        const dim = hover !== null && hover !== i;
        const tl = phase(t, 0.55 + i * 0.04, 0.4);
        return (
          <g key={b.bench} opacity={dim ? 0.3 : 1} style={{ transition: 'opacity .25s' }}>
            {!g.narrow && (
              <text x={0} y={cy + 3.5} fontSize={9} letterSpacing="0.12em" fill="var(--ink-4)" style={mono}>
                {short(b.group).toUpperCase()}
              </text>
            )}
            <text x={g.narrow ? 0 : 86} y={cy + 4} fontSize={g.narrow ? 11.5 : 12.5} fontWeight={flat ? 400 : 550} fill={flat ? 'var(--ink-3)' : 'var(--ink)'} style={sans}>
              {b.bench}
            </text>
            {flat ? (
              <circle cx={zero} cy={cy} r={4} fill="var(--surface)" stroke="var(--slate)" strokeWidth={1.6} opacity={p > 0 ? 1 : 0} />
            ) : (
              <>
                <path d={barPath(zero, xe, cy - 6, 12)} fill={b.d > 0 ? 'var(--blue)' : 'var(--coral)'} />
                <text
                  x={b.d > 0 ? X(b.d) + 7 : X(b.d) - 7}
                  y={cy + 4}
                  textAnchor={b.d > 0 ? 'start' : 'end'}
                  opacity={tl}
                  style={{ ...mono, ...halo }}
                >
                  <tspan fontSize={11.5} fontWeight={600} fill="var(--ink)">
                    {fmtD(b.d)}
                  </tspan>
                  {i === 0 && (
                    <tspan dx={6} fontSize={11} fill="var(--ink-3)" style={sans}>
                      {g.narrow ? '' : `on ${b.inputs} inputs`}
                    </tspan>
                  )}
                </text>
              </>
            )}
            <rect
              x={0}
              y={cy - g.ROW / 2}
              width={w}
              height={g.ROW}
              fill="transparent"
              role="img"
              tabIndex={0}
              aria-label={`${b.bench}: router ${b.router.toFixed(2)}, fixed ${b.fixed.toFixed(2)}, difference ${sgn(b.d)}`}
              onPointerEnter={() => setHover(i)}
              onPointerMove={(e) => tip.at(e, body(b))}
              onPointerLeave={() => {
                setHover(null);
                tip.hide();
              }}
              onFocus={(e) => {
                setHover(i);
                tip.atEl(e.currentTarget, body(b));
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

      {/* the one axis */}
      {[-2, 0, 2, 4, 6, 8].map((d) => (
        <text key={d} x={X(d)} y={g.axisY + 6} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
          {d > 0 ? `+${d}` : d < 0 ? `${MINUS}${-d}` : '0'}
        </text>
      ))}
      <text x={(X(D0) + X(D1)) / 2} y={g.axisY + 25} textAnchor="middle" fontSize={11.5} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
        router − fixed candidate, points
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* legend and footnote strip                                          */
/* ---------------------------------------------------------------- */

function Swatch({ kind, color }: { kind: 'dot' | 'ring' | 'tick' | 'bar'; color: string }) {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden className="shrink-0">
      {kind === 'dot' && <circle cx={8} cy={6} r={4.5} fill={color} />}
      {kind === 'ring' && <circle cx={8} cy={6} r={4} fill="none" stroke={color} strokeWidth={1.8} />}
      {kind === 'tick' && <line x1={8} x2={8} y1={0.5} y2={11.5} stroke={color} strokeWidth={2} strokeLinecap="round" />}
      {kind === 'bar' && <path d={barPath(1, 15, 2, 8, 3)} fill={color} />}
    </svg>
  );
}

function Legend({ view }: { view: View }) {
  const items: { kind: 'dot' | 'ring' | 'tick' | 'bar'; color: string; label: string }[] =
    view === 'group'
      ? [
          { kind: 'tick', color: 'var(--slate)', label: 'fixed candidate (0%)' },
          { kind: 'dot', color: 'var(--blue)', label: 'router' },
          { kind: 'ring', color: 'var(--ink-3)', label: 'oracle (100%)' },
          { kind: 'bar', color: 'var(--coral)', label: 'below the fixed candidate' },
        ]
      : [
          { kind: 'bar', color: 'var(--blue)', label: 'router above the fixed candidate' },
          { kind: 'bar', color: 'var(--coral)', label: 'below' },
          { kind: 'ring', color: 'var(--slate)', label: 'equal, within 0.01' },
        ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-[12px] text-ink-3">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <Swatch kind={it.kind} color={it.color} />
          {it.label}
        </span>
      ))}
      <span className="text-ink-4">· hover a row for the scores</span>
    </div>
  );
}

function Facts({ w }: { w: number }) {
  const { classifierAcc: acc, toFixed, leaves, ruleTree, untrained, imageSuite } = ONE_ROUTER;
  const cells: { kick: string; big: string; text: ReactNode }[] = [
    {
      kick: 'Leaf classifier',
      big: `${toFixed[0]}–${toFixed[1]}%`,
      text: (
        <>
          of inputs still go to the fixed candidate, though the classifier is {acc[0]}–{acc[1]}% accurate over {leaves} leaves: within a benchmark one candidate wins
          almost every type.
        </>
      ),
    },
    {
      kick: 'Other routers vs. fixed candidate',
      big: sgn(untrained.diff),
      text: (
        <>
          an untrained Qwen3.5-4B that names the candidate itself, <span className="num text-ink-2">{ival(untrained.ci)}</span>. A rule-based tree with{' '}
          {ruleTree.leaves} leaves: <span className="num text-ink-2">{sgn(ruleTree.diff)}</span> <span className="num text-ink-2">{ival(ruleTree.ci)}</span>.
        </>
      ),
    },
    {
      kick: 'Image-routing suite',
      big: `0 of ${imageSuite.configs}`,
      text: (
        <>
          configurations, across {imageSuite.designs} router designs, beat the fixed generator with an interval above zero; {imageSuite.significantlyWorse} are
          significantly worse.
        </>
      ),
    },
  ];
  const row = w >= 600;
  return (
    <div className="mt-6 grid border-t border-rule" style={{ gridTemplateColumns: row ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)' }}>
      {cells.map((c, i) => (
        <div
          key={c.kick}
          style={
            row
              ? { padding: `16px ${i < 2 ? 20 : 0}px 2px ${i > 0 ? 20 : 0}px`, borderLeft: i > 0 ? '1px solid var(--rule)' : undefined }
              : { padding: '16px 0 2px', marginTop: i > 0 ? 16 : 0, borderTop: i > 0 ? '1px solid var(--rule)' : undefined }
          }
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{c.kick}</div>
          <div className="mt-1.5 font-display text-[30px] font-semibold leading-none text-ink">{c.big}</div>
          <p className="mt-1.5 font-sans text-[12.5px] leading-snug text-ink-3">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function RouterShare() {
  const tk = useTokens();
  const box = useRef<HTMLDivElement>(null);
  const plot = useRef<HTMLDivElement>(null);
  const w = useWidth(plot);
  const inView = useInView(box, '-60px', true);
  const [view, setView] = useState<View>('group');
  const [tip, api] = useTip(box);
  const [toggled, setToggled] = useState(false);
  const H = view === 'group' ? groupGeom(w).H : benchGeom(w).H;

  return (
    <div ref={box} className="relative">
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <RubberSegment
          items={[
            { value: 'group', label: 'By group' },
            { value: 'bench', label: 'By benchmark' },
          ]}
          value={view}
          onChange={(v) => {
            api.hide();
            setToggled(true);
            setView(v as View);
          }}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="Read the router by output group or by benchmark"
        />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">
          {['16 benchmarks', `${int(ROUTERS_ALL.inputs)} test inputs`, 'one seed'].map((x) => x.replace(/ /g, NB)).join(' · ')}
        </span>
      </div>
      <div ref={plot} style={{ height: H, overflow: 'hidden', transition: toggled ? 'height .45s cubic-bezier(.22,1,.36,1)' : undefined }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onPointerLeave={api.hide}
          >
            {view === 'group' ? <GroupView w={w} inView={inView} tip={api} /> : <BenchView w={w} inView={inView} tip={api} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <Legend view={view} />
      <Facts w={w} />
      <TipBox tip={tip} width={box.current?.clientWidth ?? w} />
    </div>
  );
}
