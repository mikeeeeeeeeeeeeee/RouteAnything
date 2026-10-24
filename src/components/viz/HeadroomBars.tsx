import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type RefObject } from 'react';
import { animate, motion } from 'motion/react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { GROUPS, HEADROOM, HEADROOM_ALL, HEADROOM_BENCH, groupLabel, type GroupKey } from '@/data/results';
import { clamp, easeInOut, easeOut, lerp, seg, useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { useTokens } from '@/theme/tokens';
import { mono, sans } from './svg';

// Finding 1 (Table 2, Table 6): per-input headroom on the test split. Each row pairs the best fixed
// arm per benchmark, chosen on training inputs (hollow), with the per-input oracle, the best arm on
// each input (filled); the direct label is the gap. A tick marks the best fixed arm chosen in
// hindsight on the test inputs, wherever it differs from the training choice. Switching views
// unfolds each output type into its benchmarks.

type View = 'group' | 'bench';
type Kind = 'group' | 'total' | 'header' | 'bench';

interface Mark {
  fixed: number;
  hindsight: number;
  oracle: number;
  gap: number;
}

interface Info {
  title: string;
  kicker?: string;
  inputs: number;
  arms?: string;
  benchmarks?: number;
  fixedArm?: string;
  hindsightArm?: string;
}

interface Row {
  key: string;
  kind: Kind;
  group?: GroupKey;
  label: string;
  sub?: string;
  y: number;
  h: number;
  mark?: Mark;
  info?: Info;
  /** position among the data rows, for the reveal stagger */
  order: number;
  /** narrow benchmark view: the label rides just left of the row's own marks */
  attach: boolean;
}

interface Layout {
  view: View;
  rows: Row[];
  byKey: Map<string, Row>;
  H: number;
  domain: [number, number];
  ticks: number[];
  plotL: number;
  plotR: number;
  sepY: number;
  gridTop: number;
  gridBottom: number;
  bottomAxis: boolean;
  compact: boolean;
}

const fmtInt = (n: number) => n.toLocaleString('en-US');
const fmt2 = (v: number) => v.toFixed(2);
const fmtGap = (v: number) => `+${v.toFixed(1)}`;
const SEGMENT = 'color-mix(in oklab, var(--ink-4) 46%, transparent)';
const SEGMENT_ON = 'color-mix(in oklab, var(--ink-3) 55%, transparent)';

/* ------------------------------------------------------------------ */
/* layout                                                              */
/* ------------------------------------------------------------------ */

function buildLayout(view: View, W: number): Layout {
  const compact = W < 560;
  const attach = compact && view === 'bench';
  const plotL = attach ? 6 : compact ? 106 : 214;
  const plotR = W - (compact ? 38 : 58);
  const top = compact ? 30 : 34;
  const rows: Row[] = [];
  let y = top + 4;
  let order = 0;

  const totalRow = (yy: number, h: number): Row => ({
    key: 'total',
    kind: 'total',
    label: compact && !attach ? 'All 24' : `All ${HEADROOM_ALL.benchmarks} benchmarks`,
    sub: `${fmtInt(HEADROOM_ALL.inputs)} inputs`,
    y: yy,
    h,
    mark: { fixed: HEADROOM_ALL.fixed, hindsight: HEADROOM_ALL.hindsight, oracle: HEADROOM_ALL.oracle, gap: HEADROOM_ALL.gap },
    info: { title: `All ${HEADROOM_ALL.benchmarks} benchmarks`, inputs: HEADROOM_ALL.inputs, benchmarks: HEADROOM_ALL.benchmarks },
    order: 0,
    attach,
  });

  if (view === 'group') {
    const rh = compact ? 42 : 46;
    for (const r of HEADROOM) {
      const g = GROUPS.find((x) => x.key === r.group)!;
      rows.push({
        key: `g:${r.group}`,
        kind: 'group',
        group: r.group,
        label: compact ? g.short : g.label,
        sub: compact ? `${fmtInt(r.inputs)} inputs` : `${fmtInt(r.inputs)} inputs · ${r.arms} arms`,
        y: y + rh / 2,
        h: rh,
        mark: { fixed: r.fixed, hindsight: r.hindsight, oracle: r.oracle, gap: r.gap },
        info: { title: g.label, inputs: r.inputs, arms: r.arms, benchmarks: r.benchmarks },
        order: order++,
        attach: false,
      });
      y += rh;
    }
    y += 16;
    const sepY = y - 8;
    const tr = totalRow(y + rh / 2, rh);
    tr.order = order++;
    rows.push(tr);
    y += rh;
    return finish({ view, rows, H: y + 10, domain: [60, 100], ticks: [60, 70, 80, 90, 100], plotL, plotR, sepY, gridTop: top - 6, gridBottom: y - 2, bottomAxis: false, compact });
  }

  const rh = compact ? 22 : 23;
  const hh = compact ? 26 : 28;
  for (const g of GROUPS) {
    const benches = HEADROOM_BENCH.filter((b) => b.group === g.key);
    if (!benches.length) continue;
    rows.push({ key: `h:${g.key}`, kind: 'header', group: g.key, label: g.label, y: y + hh - 9, h: hh, order: -1, attach });
    y += hh;
    for (const b of benches) {
      rows.push({
        key: `b:${b.bench}`,
        kind: 'bench',
        group: g.key,
        label: b.bench,
        y: y + rh / 2,
        h: rh,
        mark: { fixed: b.fixed, hindsight: b.hindsight, oracle: b.oracle, gap: b.gap },
        info: { title: b.bench, kicker: g.short, inputs: b.inputs, fixedArm: b.fixedArm, hindsightArm: b.hindsightArm },
        order: order++,
        attach,
      });
      y += rh;
    }
  }
  y += 16;
  const sepY = y - 8;
  const trh = compact ? 42 : 46;
  const tr = totalRow(y + trh / 2, trh);
  tr.order = order++;
  rows.push(tr);
  y += trh;
  return finish({ view, rows, H: y + 26, domain: [20, 100], ticks: [20, 40, 60, 80, 100], plotL, plotR, sepY, gridTop: top - 6, gridBottom: y - 2, bottomAxis: true, compact });
}

function finish(l: Omit<Layout, 'byKey'>): Layout {
  return { ...l, byKey: new Map(l.rows.map((r) => [r.key, r])) };
}

/** where a type sits in the benchmark view: the middle of its block */
function blockCenter(l: Layout, g: GroupKey) {
  const ys = l.rows.filter((r) => r.group === g).map((r) => r.y);
  return ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;
}

const groupMark = (g: GroupKey): Mark => {
  const r = HEADROOM.find((x) => x.group === g)!;
  return { fixed: r.fixed, hindsight: r.hindsight, oracle: r.oracle, gap: r.gap };
};

const lerpMark = (a: Mark, b: Mark, e: number): Mark => ({
  fixed: lerp(a.fixed, b.fixed, e),
  hindsight: lerp(a.hindsight, b.hindsight, e),
  oracle: lerp(a.oracle, b.oracle, e),
  gap: b.gap,
});

/** rough text widths for placing attached labels (Geist at 11px, Geist Mono at 10.5px) */
const sansW = (s: string, size: number, weight = 450) => s.length * size * (weight > 550 ? 0.6 : 0.56);
const monoW = (s: string, size: number) => s.length * size * 0.6;

/* ------------------------------------------------------------------ */
/* hooks                                                               */
/* ------------------------------------------------------------------ */

/** true on devices with a hovering pointer (the hint says "hover", else "tap") */
function useCanHover() {
  const [h, setH] = useState(() => window.matchMedia('(hover: hover)').matches);
  useEffect(() => {
    const m = window.matchMedia('(hover: hover)');
    const on = () => setH(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return h;
}

function useWidth<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setW(Math.round(el.getBoundingClientRect().width));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ------------------------------------------------------------------ */
/* the figure                                                          */
/* ------------------------------------------------------------------ */

const REVEAL_END = 3.2;
const SWITCH_S = 0.95;

export function HeadroomBars() {
  const tk = useTokens();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, '-60px', true);
  const W = useWidth(boxRef);

  const [view, setView] = useState<View>('group');
  const [from, setFrom] = useState<View>('group');
  const [p, setP] = useState(1);
  const ctrl = useRef<{ stop: () => void } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const lastPointer = useRef<string>('mouse');
  // a tap focuses the row before its click lands, so the click reads the hover from before the tap
  const hoverAtDown = useRef<string | null>(null);
  const hoverNow = useRef<string | null>(null);
  useEffect(() => {
    hoverNow.current = hover;
  }, [hover]);

  const [revealed, setRevealed] = useState(false);
  const [t] = useClock(inView && !reduced && !revealed);
  useEffect(() => {
    if (t >= REVEAL_END) setRevealed(true);
  }, [t]);
  const tt = reduced || revealed ? REVEAL_END : t;

  useEffect(() => () => ctrl.current?.stop(), []);

  const width = Math.max(W, 240);
  const A = useMemo(() => buildLayout(from, width), [from, width]);
  const B = useMemo(() => buildLayout(view, width), [view, width]);
  const switching = p < 1 && from !== view;
  const e = switching ? easeInOut(p) : 1;

  const switchTo = (v: View) => {
    if (v === view) return;
    setHover(null);
    ctrl.current?.stop();
    if (reduced) {
      setFrom(v);
      setView(v);
      setP(1);
      return;
    }
    // turning back mid-flight stays continuous (the easing is symmetric)
    const start = switching && v === from ? 1 - p : 0;
    setFrom(view);
    setView(v);
    setP(start);
    ctrl.current = animate(start, 1, { duration: SWITCH_S * (1 - start), ease: 'linear', onUpdate: (x) => setP(x) });
  };

  // the current frame: scale, size and rows
  const compact = B.compact;
  const d0 = lerp(A.domain[0], B.domain[0], e);
  const d1 = lerp(A.domain[1], B.domain[1], e);
  const plotL = lerp(A.plotL, B.plotL, e);
  const plotR = lerp(A.plotR, B.plotR, e);
  const X = (v: number) => plotL + ((v - d0) / (d1 - d0)) * (plotR - plotL);
  const H = lerp(A.H, B.H, e);
  const minSep = compact ? 10 : 12;
  const rDot = compact ? 4 : 4.6;
  const rOr = compact ? 4.6 : 5.2;
  const segH = compact ? 7 : 8;
  const groupFont = compact ? 12.5 : 13.5;
  const benchFont = compact ? 11 : 12.5;
  const gapFont = (k: Kind) => (compact ? 10.5 : k === 'bench' ? 11.5 : 12.5);

  type Frame = { key: string; row: Row; y: number; mark?: Mark; opMarks: number; opLabel: number; opGap: number };
  const frames: Frame[] = [];
  const keys = new Set<string>([...A.rows.map((r) => r.key), ...B.rows.map((r) => r.key)]);
  for (const k of keys) {
    const a = A.byKey.get(k);
    const b = B.byKey.get(k);
    if (!switching) {
      if (b) frames.push({ key: k, row: b, y: b.y, mark: b.mark, opMarks: 1, opLabel: 1, opGap: 1 });
      continue;
    }
    if (a && b) {
      frames.push({ key: k, row: b, y: lerp(a.y, b.y, e), mark: b.mark, opMarks: 1, opLabel: 1, opGap: 1 });
    } else if (b) {
      // entering: benchmarks unfold out of their type, a type folds out of its benchmarks
      let y0 = b.y;
      let m0 = b.mark;
      if ((b.kind === 'bench' || b.kind === 'header') && b.group) {
        const anchor = A.byKey.get(`g:${b.group}`);
        if (anchor) y0 = anchor.y;
        if (b.kind === 'bench') m0 = groupMark(b.group);
      } else if (b.kind === 'group' && b.group) {
        y0 = blockCenter(A, b.group);
      }
      // unfolding, a benchmark's marks start on top of its type's and take over at once; folding, a
      // type's marks take over only once its benchmarks have collapsed onto them
      frames.push({
        key: k,
        row: b,
        y: lerp(y0, b.y, e),
        mark: b.mark && m0 ? lerpMark(m0, b.mark, e) : b.mark,
        opMarks: b.kind === 'group' ? seg(p, 0.72, 0.28) : seg(p, 0, 0.3),
        opLabel: seg(p, 0.52, 0.42),
        opGap: seg(p, 0.62, 0.38),
      });
    } else if (a) {
      // leaving
      let y1 = a.y;
      let m1 = a.mark;
      if ((a.kind === 'bench' || a.kind === 'header') && a.group) {
        const anchor = B.byKey.get(`g:${a.group}`);
        if (anchor) y1 = anchor.y;
        if (a.kind === 'bench') m1 = groupMark(a.group);
      } else if (a.kind === 'group' && a.group) {
        y1 = blockCenter(B, a.group);
      }
      frames.push({
        key: k,
        row: a,
        y: lerp(a.y, y1, e),
        mark: a.mark && m1 ? lerpMark(a.mark, m1, e) : a.mark,
        opMarks: a.kind === 'group' ? 1 - seg(p, 0.02, 0.3) : 1 - seg(p, 0.72, 0.28),
        opLabel: 1 - seg(p, 0, 0.28),
        opGap: 1 - seg(p, 0, 0.22),
      });
    }
  }
  // leaving rows underneath
  frames.sort((f, g) => (B.byKey.has(f.key) ? 1 : 0) - (B.byKey.has(g.key) ? 1 : 0));

  const stagger = B.view === 'group' ? 0.07 : 0.028;
  const gridIn = seg(tt, 0, 0.5);
  const hoverRow = hover && !switching ? B.byKey.get(hover) : undefined;

  const ticks = Array.from(new Set([...A.ticks, ...B.ticks])).sort((a, b) => a - b);
  const tickOp = (v: number) => {
    const inA = A.ticks.includes(v);
    const inB = B.ticks.includes(v);
    if (!switching) return inB ? 1 : 0;
    if (inA && inB) return 1;
    return inB ? seg(p, 0.4, 0.6) : 1 - seg(p, 0, 0.4);
  };
  const bottomAxisOp = switching ? lerp(A.bottomAxis ? 1 : 0, B.bottomAxis ? 1 : 0, e) : B.bottomAxis ? 1 : 0;
  const gridBottom = lerp(A.gridBottom, B.gridBottom, e);
  const sepY = lerp(A.sepY, B.sepY, e);
  const axisTitleOp = switching ? lerp(A.plotL > 60 ? 1 : 0, B.plotL > 60 ? 1 : 0, e) : B.plotL > 60 ? 1 : 0;

  const pointerProps = (k: string) => ({
    onPointerDown: (ev: RPointerEvent) => {
      lastPointer.current = ev.pointerType;
      hoverAtDown.current = hoverNow.current;
    },
    onPointerEnter: (ev: RPointerEvent) => {
      if (ev.pointerType === 'mouse') setHover(k);
    },
    onPointerLeave: (ev: RPointerEvent) => {
      if (ev.pointerType === 'mouse') setHover((h) => (h === k ? null : h));
    },
    onClick: () => {
      if (lastPointer.current !== 'mouse') setHover(hoverAtDown.current === k ? null : k);
    },
    onFocus: () => setHover(k),
    onBlur: () => setHover((h) => (h === k ? null : h)),
  });

  const canHover = useCanHover();
  const halo = { stroke: 'var(--surface)', strokeWidth: 4, strokeLinejoin: 'round' as const, paintOrder: 'stroke' as const };

  return (
    <div ref={rootRef}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <RubberSegment
          items={[
            { value: 'group', label: 'By output type' },
            { value: 'bench', label: 'By benchmark' },
          ]}
          value={view}
          onChange={(v) => switchTo(v as View)}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="Rows by"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[12px] text-ink-3">
          <LegendItem glyph="fixed" label="best fixed arm (training)" />
          <LegendItem glyph="oracle" label="per-input oracle" />
          <LegendItem glyph="tick" label="best fixed in hindsight" />
        </div>
      </div>

      <div ref={boxRef} className="relative">
        {W > 0 ? (
          <svg
            viewBox={`0 0 ${width} ${H}`}
            width={width}
            height={H}
            className="block h-auto w-full select-none overflow-visible"
            role="group"
            aria-label={`Per-input headroom on the test split, ${view === 'group' ? 'by output type' : 'by benchmark'}: the best fixed arm against the per-input oracle. All ${HEADROOM_ALL.benchmarks} benchmarks: ${fmt2(HEADROOM_ALL.fixed)} against ${fmt2(HEADROOM_ALL.oracle)}.`}
          >
            {/* axis */}
            <g opacity={gridIn}>
              {ticks.map((v) => {
                const op = tickOp(v);
                const x = X(v);
                if (op <= 0.001 || x < plotL - 1 || x > plotR + 1) return null;
                return (
                  <g key={v} opacity={op}>
                    <line x1={x} y1={B.gridTop} x2={x} y2={gridBottom} stroke="var(--rule)" />
                    <text x={x} y={B.gridTop - 9} textAnchor="middle" fontSize={compact ? 10 : 10.5} fill="var(--ink-3)" style={mono}>
                      {v}
                    </text>
                    {bottomAxisOp > 0.01 && (
                      <text x={x} y={gridBottom + 16} textAnchor="middle" fontSize={compact ? 10 : 10.5} fill="var(--ink-3)" opacity={bottomAxisOp} style={mono}>
                        {v}
                      </text>
                    )}
                  </g>
                );
              })}
              {axisTitleOp > 0.01 && (
                <text x={plotL - 16} y={B.gridTop - 9} textAnchor="end" fontSize={compact ? 9 : 9.5} letterSpacing={1.4} fill="var(--ink-4)" opacity={axisTitleOp} style={mono}>
                  {compact ? 'SCORE' : 'SCORE, 0–100'}
                </text>
              )}
              {/* the pooled row sits apart */}
              <line x1={compact ? 0 : 24} y1={sepY} x2={width - (compact ? 4 : 12)} y2={sepY} stroke="var(--rule-2)" />
            </g>

            {frames.map(({ key, row, y, mark, opMarks, opLabel, opGap }) => {
              const order = Math.max(0, row.order);
              const dotIn = seg(tt, 0.08 + stagger * order, 0.35);
              const grow = easeOut(clamp((tt - 0.32 - stagger * order) / 0.95));
              const gapIn = seg(tt, 1.0 + stagger * order, 0.35);
              const dim = hoverRow && hoverRow.key !== key ? 0.24 : 1;
              const on = hoverRow?.key === key;
              const total = row.kind === 'total';

              if (row.kind === 'header') {
                return (
                  <g key={key} opacity={opLabel * gridIn * (hoverRow ? 0.4 : 1)} style={{ transition: 'opacity .25s' }}>
                    <text
                      x={row.attach ? 2 : plotL - 16}
                      y={y + 3.5}
                      textAnchor={row.attach ? 'start' : 'end'}
                      fontSize={compact ? 9 : 9.5}
                      letterSpacing={1.3}
                      fill="var(--ink-3)"
                      style={mono}
                      {...(row.attach ? halo : {})}
                    >
                      {row.label.toUpperCase()}
                    </text>
                  </g>
                );
              }

              const m = mark!;
              const own = row.mark!;
              const xf = X(m.fixed);
              const xoEnd = Math.max(X(m.oracle), xf + minSep);
              const xo = lerp(xf, xoEnd, grow);
              const xh = X(m.hindsight);
              const showTick = own.hindsight !== own.fixed;
              const big = own.gap >= 10;
              const labelFont = row.kind === 'bench' ? benchFont : groupFont;
              const twoLine = row.kind !== 'bench';
              const rf = total ? rDot + 0.6 : rDot;
              const ro = total ? rOr + 0.6 : rOr;
              const gapText = fmtGap(own.gap);
              const gapX = xoEnd + ro + (total ? 8 : 6);

              // label position: in the label column, or riding just left of the marks
              let lx = plotL - 16;
              let anchor: 'start' | 'end' = 'end';
              if (row.attach) {
                const lw = Math.max(sansW(row.label, labelFont, total ? 650 : 450), twoLine && row.sub ? monoW(row.sub, 9.5) : 0);
                lx = xf - rf - 7;
                if (lx - lw < 0) {
                  lx = gapX + monoW(gapText, gapFont(row.kind)) + 9;
                  anchor = 'start';
                }
              }
              const labelStyle = row.attach ? halo : {};
              return (
                <g
                  key={key}
                  opacity={dim}
                  style={{ transition: 'opacity .25s', outline: 'none' }}
                  tabIndex={!switching ? 0 : -1}
                  role="img"
                  aria-label={ariaRow(row)}
                  {...pointerProps(key)}
                >
                  <rect x={0} y={y - row.h / 2} width={width} height={row.h} fill="transparent" />
                  {/* label */}
                  <g opacity={dotIn * opLabel}>
                    <text
                      x={lx}
                      y={twoLine ? y - 1.5 : y + 4}
                      textAnchor={anchor}
                      fontSize={labelFont}
                      fontWeight={row.kind === 'bench' ? (on ? 600 : 450) : total ? 650 : 600}
                      fill={row.kind === 'bench' && !on ? 'var(--ink-2)' : 'var(--ink)'}
                      style={sans}
                      {...labelStyle}
                    >
                      {row.label}
                    </text>
                    {twoLine && row.sub && (
                      <text x={lx} y={y + 13} textAnchor={anchor} fontSize={compact ? 9.5 : 10.5} fill="var(--ink-3)" style={mono} {...labelStyle}>
                        {row.sub}
                      </text>
                    )}
                  </g>
                  <g opacity={opMarks}>
                    {/* the gap */}
                    {xo - xf > 0.5 && <rect x={xf} y={y - segH / 2} width={xo - xf} height={segH} rx={segH / 2} fill={on ? SEGMENT_ON : SEGMENT} />}
                    {/* best fixed arm in hindsight */}
                    {showTick && (
                      <line
                        x1={xh}
                        x2={xh}
                        y1={y - (compact ? 7.5 : 9)}
                        y2={y + (compact ? 7.5 : 9)}
                        stroke="var(--ink-2)"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        opacity={gapIn * opGap}
                      />
                    )}
                    {/* best fixed arm, chosen on training inputs */}
                    <circle cx={xf} cy={y} r={rf} fill="var(--surface)" stroke="var(--slate)" strokeWidth={2} opacity={dotIn} />
                    {/* per-input oracle */}
                    <circle cx={xo} cy={y} r={ro} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} opacity={dotIn} />
                  </g>
                  <text
                    x={gapX}
                    y={y + 4}
                    fontSize={gapFont(row.kind)}
                    fontWeight={total || big ? 650 : 450}
                    fill={total || big || on ? 'var(--ink)' : 'var(--ink-2)'}
                    opacity={gapIn * opGap}
                    style={mono}
                  >
                    {gapText}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div style={{ height: 440 }} />
        )}

        {hoverRow?.mark && hoverRow.info && <Tip row={hoverRow} X={X} W={width} H={H} compact={compact} rOr={rOr} minSep={minSep} />}
      </div>

      <p className="mt-2 font-sans text-[12px] leading-snug text-ink-3">
        Gap: oracle minus fixed, in points on each benchmark’s 0–100 scale · {canHover ? 'hover' : 'tap'} a row for its values
      </p>

      <SrTable />
    </div>
  );
}

function ariaRow(r: Row) {
  if (!r.mark || !r.info) return r.label;
  const m = r.mark;
  return `${r.info.title}: ${fmtInt(r.info.inputs)} inputs; fixed ${fmt2(m.fixed)}${r.info.fixedArm ? ` (${r.info.fixedArm})` : ''}, best fixed in hindsight ${fmt2(m.hindsight)}${
    r.info.hindsightArm ? ` (${r.info.hindsightArm})` : ''
  }, oracle ${fmt2(m.oracle)}, gap ${fmt2(m.gap)} points`;
}

/* ------------------------------------------------------------------ */
/* tooltip                                                             */
/* ------------------------------------------------------------------ */

function Tip({ row, X, W, H, compact, rOr, minSep }: { row: Row; X: (v: number) => number; W: number; H: number; compact: boolean; rOr: number; minSep: number }) {
  const m = row.mark!;
  const info = row.info!;
  const TW = compact ? Math.min(272, W - 8) : 272;
  const xf = X(m.fixed);
  const xo = Math.max(X(m.oracle), xf + minSep);
  let style: CSSProperties;
  if (compact) {
    const below = row.y < H * 0.55;
    style = {
      left: Math.max(4, (W - TW) / 2),
      top: below ? row.y + row.h / 2 + 2 : row.y - row.h / 2 - 2,
      width: TW,
      transform: below ? 'none' : 'translateY(-100%)',
    };
  } else {
    // beside the row, on the side with more room
    const rightX = xo + rOr + 58;
    const roomRight = W - rightX;
    const roomLeft = xf - 18 - 214;
    const right = roomRight >= TW || roomRight > roomLeft;
    const left = right ? Math.min(W - TW, rightX) : Math.max(214, xf - 18 - TW);
    style = { left, top: clamp(row.y, 80, H - 80), width: TW, transform: 'translateY(-50%)' };
  }
  const bench = row.kind === 'bench';
  const lines: { glyph: Glyph; label: string; arm?: string; value: number }[] = [
    { glyph: 'fixed', label: 'Fixed, chosen on training inputs', arm: info.fixedArm, value: m.fixed },
    { glyph: 'tick', label: 'Best fixed in hindsight', arm: bench ? (info.hindsightArm ?? 'the same arm') : undefined, value: m.hindsight },
    { glyph: 'oracle', label: 'Per-input oracle', arm: bench ? 'best arm on each input' : undefined, value: m.oracle },
  ];
  const facts = [
    `${fmtInt(info.inputs)} input${info.inputs === 1 ? '' : 's'}`,
    info.arms ? `${info.arms} arms` : null,
    info.benchmarks ? `${info.benchmarks} benchmark${info.benchmarks > 1 ? 's' : ''}` : null,
  ].filter(Boolean);
  return (
    <div className="pointer-events-none absolute z-10" style={style}>
      <motion.div
        key={row.key}
        initial={{ opacity: 0, y: 4, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
        className="rounded-xl border border-rule bg-surface/95 px-3.5 pb-3 pt-2.5 shadow-[var(--shadow-lg)] backdrop-blur-md"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-sans text-[13px] font-semibold text-ink">{info.title}</span>
          {info.kicker && <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-4">{info.kicker}</span>}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-[30px] font-semibold leading-none text-ink">+{fmt2(m.gap)}</span>
          <span className="font-sans text-[12px] leading-tight text-ink-3">points of per-input headroom</span>
        </div>
        <div className="mt-2.5 space-y-[6px] border-t border-rule pt-2.5">
          {lines.map((r) => (
            <div key={r.glyph} className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-start gap-x-2">
              <span className="flex h-[16px] items-center">
                <GlyphSvg glyph={r.glyph} />
              </span>
              <span className="min-w-0 font-sans text-[12px] leading-[16px] text-ink-2">
                {r.label}
                {r.arm && <span className="block truncate text-[11px] leading-[14px] text-ink-4">{r.arm}</span>}
              </span>
              <span className="num text-[12.5px] font-medium leading-[16px] text-ink">{fmt2(r.value)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 font-mono text-[10.5px] text-ink-3">{facts.join(' · ')}</div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* legend glyphs                                                       */
/* ------------------------------------------------------------------ */

type Glyph = 'fixed' | 'oracle' | 'tick';

function GlyphSvg({ glyph }: { glyph: Glyph }) {
  return (
    <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden className="shrink-0 overflow-visible">
      {glyph === 'fixed' && <circle r={4.2} fill="var(--surface)" stroke="var(--slate)" strokeWidth={2} />}
      {glyph === 'oracle' && <circle r={4.8} fill="var(--ink)" />}
      {glyph === 'tick' && <line x1={0} x2={0} y1={-6} y2={6} stroke="var(--ink-2)" strokeWidth={1.6} strokeLinecap="round" />}
    </svg>
  );
}

function LegendItem({ glyph, label }: { glyph: Glyph; label: string }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <GlyphSvg glyph={glyph} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* the same numbers as a table, for screen readers                     */
/* ------------------------------------------------------------------ */

function SrTable() {
  return (
    <table className="sr-only">
      <caption>Per-input headroom on the test split (Table 2 and Table 6)</caption>
      <thead>
        <tr>
          <th scope="col">Row</th>
          <th scope="col">Inputs</th>
          <th scope="col">Fixed arm</th>
          <th scope="col">Fixed</th>
          <th scope="col">Best fixed in hindsight</th>
          <th scope="col">Oracle</th>
          <th scope="col">Gap</th>
        </tr>
      </thead>
      <tbody>
        {HEADROOM.map((r) => (
          <tr key={r.group}>
            <th scope="row">{groupLabel(r.group)}</th>
            <td>{fmtInt(r.inputs)}</td>
            <td>{r.arms} arms</td>
            <td>{fmt2(r.fixed)}</td>
            <td>{fmt2(r.hindsight)}</td>
            <td>{fmt2(r.oracle)}</td>
            <td>{fmt2(r.gap)}</td>
          </tr>
        ))}
        <tr>
          <th scope="row">All {HEADROOM_ALL.benchmarks} benchmarks</th>
          <td>{fmtInt(HEADROOM_ALL.inputs)}</td>
          <td />
          <td>{fmt2(HEADROOM_ALL.fixed)}</td>
          <td>{fmt2(HEADROOM_ALL.hindsight)}</td>
          <td>{fmt2(HEADROOM_ALL.oracle)}</td>
          <td>{fmt2(HEADROOM_ALL.gap)}</td>
        </tr>
        {HEADROOM_BENCH.map((b) => (
          <tr key={b.bench}>
            <th scope="row">
              {b.bench} ({groupLabel(b.group)})
            </th>
            <td>{fmtInt(b.inputs)}</td>
            <td>{b.fixedArm}</td>
            <td>{fmt2(b.fixed)}</td>
            <td>
              {fmt2(b.hindsight)}
              {b.hindsightArm ? ` (${b.hindsightArm})` : ''}
            </td>
            <td>{fmt2(b.oracle)}</td>
            <td>{fmt2(b.gap)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
