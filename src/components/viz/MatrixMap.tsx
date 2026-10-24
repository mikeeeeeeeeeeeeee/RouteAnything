import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { motion } from 'motion/react';
import CountUp from '@/components/reactbits/CountUp/CountUp';
import { GROUPS, HEADROOM, HEADROOM_BENCH, MATRIX, PANELS, POOLS, SETUP, type GroupKey, type PoolKey } from '@/data/results';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import type { Pt } from '@/lib/polyline';
import { Packet } from './flow';

// §3, the omni-modal outcome matrix. Every arm of a pool runs on the same inputs and each run is
// scored with the benchmark's own metric. Groups are listed in the order of the paper's Fig. 1a
// (questions, image questions, agent tasks, generation prompts, robot scenes), which is also the
// order of the pools they draw on, so no two links cross. Per-group test inputs and arm counts are
// Table 2; per-benchmark inputs and fixed arms are Table 6; the panels are Table 1.

const ORDER: GroupKey[] = ['text', 'imgqa', 'agents', 'imggen', 'video', 'speech', 'robot'];
const ROWS = ORDER.map((k) => GROUPS.find((g) => g.key === k)!);
const HEAD = Object.fromEntries(HEADROOM.map((h) => [h.group, h])) as Record<GroupKey, (typeof HEADROOM)[number]>;
const POOL = Object.fromEntries(POOLS.map((p) => [p.key, p])) as Record<PoolKey, (typeof POOLS)[number]>;

/** benchmark names in §3 against their rows in Table 6 */
const ALIAS: Record<string, string> = { GPQA: 'GPQA (extended)', MMMU: 'MMMU (dev/val)' };
const benchRow = (name: string) => HEADROOM_BENCH.find((b) => b.bench === (ALIAS[name] ?? name));

/** GPT-6 Astra joins for long-context, knowledge and agent tasks; image-text QA has three arms (Table 2) */
const ASTRA = 'GPT-6 Astra';
const armsFor = (g: GroupKey) => POOL[GROUPS.find((x) => x.key === g)!.pool].arms.filter((a) => g !== 'imgqa' || a !== ASTRA);
const poolArm = (pool: PoolKey, short: string) => POOL[pool].arms.find((a) => a === short || a.includes(short));

const EASE = [0.22, 1, 0.36, 1] as const;
const fmt = (n: number) => n.toLocaleString('en-US');

type Focus = { kind: 'group'; key: GroupKey } | { kind: 'pool'; key: PoolKey } | null;

function useWidth<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export function MatrixMap() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const inView = useInView(ref, '-60px', true);
  const reduced = useReducedMotion();

  return (
    <div ref={ref} className="@container">
      <Headline on={inView} cols={width >= 600 ? 4 : 2} />
      <MapView reduced={reduced} wide={width >= 690} />
      <PanelsTable wide={width >= 640} />
      <Testbeds cols={width >= 820 ? 2 : 1} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (a) the totals                                                       */
/* ------------------------------------------------------------------ */

const STATS = [
  { value: MATRIX.runs, label: 'scored runs', note: 'each with its benchmark’s own metric, on a 0–100 scale' },
  { value: MATRIX.tasks, label: 'tasks', note: `${MATRIX.benchmarks} benchmarks in seven groups` },
  { value: MATRIX.armVersions, label: 'arm versions', note: 'which differ in model, harness and effort' },
  { value: MATRIX.testInputs, label: 'test inputs', note: 'on which every arm of the pool is scored' },
];

function Headline({ on, cols }: { on: boolean; cols: 2 | 4 }) {
  return (
    <div className={`grid ${cols === 4 ? 'grid-cols-4' : 'grid-cols-2 gap-y-5'}`}>
      {STATS.map((s, i) => {
        const left = cols === 4 ? i > 0 : i % 2 === 1;
        return (
          <div key={s.label} className={`min-w-0 ${left ? 'border-l border-rule pl-4 md:pl-5' : 'pr-3'} ${cols === 4 && i < 3 ? 'pr-3' : ''}`}>
            <div className="relative inline-block font-display text-[clamp(34px,4.6vw,46px)] font-semibold leading-none text-ink">
              {/* the final value reserves the width, so the count never shifts the row */}
              <span className="invisible" style={{ fontVariantNumeric: 'lining-nums proportional-nums' }}>
                {fmt(s.value)}
              </span>
              <span className="absolute inset-0 whitespace-nowrap">
                <CountUp
                  to={s.value}
                  separator=","
                  duration={2.1}
                  delay={0.12 * i}
                  easing="expo"
                  startWhen={on}
                  className="font-display"
                  style={{ fontVariantNumeric: 'lining-nums proportional-nums' }}
                />
              </span>
            </div>
            <div className="mt-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-2">{s.label}</div>
            <div className="mt-1 max-w-[190px] font-sans text-[12px] leading-snug text-ink-3">{s.note}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (b) the map: groups, their benchmarks, and the pool each draws on    */
/* ------------------------------------------------------------------ */

interface Link {
  group: GroupKey;
  pool: PoolKey;
  d: string;
  pts: Pt[];
  len: number;
  a: Pt;
  b: Pt;
}

interface Geom {
  w: number;
  h: number;
  colTop: number;
  /** pool card tops inside the pool column, chosen to sit beside the groups that use them */
  tops: Partial<Record<PoolKey, number>>;
  links: Link[];
}

function bezier(a: Pt, b: Pt) {
  const k = (b[0] - a[0]) * 0.5;
  const c1: Pt = [a[0] + k, a[1]];
  const c2: Pt = [b[0] - k, b[1]];
  const pts: Pt[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const u = 1 - t;
    pts.push([
      u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
      u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1],
    ]);
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const r = (v: number) => v.toFixed(1);
  return { d: `M${r(a[0])},${r(a[1])} C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${r(b[0])},${r(b[1])}`, pts, len };
}

interface Tip {
  x: number;
  y: number;
  bench: string;
  group: GroupKey;
}

const COLS = 'grid-cols-[minmax(0,1fr)_96px_228px]';
const CARD_GAP = 10;

function MapView({ reduced, wide }: { reduced: boolean; wide: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const on = useInView(wrap, '-80px', true);
  const box = useRef<HTMLDivElement>(null);
  const poolCol = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const poolRefs = useRef<Partial<Record<PoolKey, HTMLDivElement | null>>>({});
  const [focus, setFocus] = useState<Focus>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [geom, setGeom] = useState<Geom | null>(null);
  const [clock] = useClock(!!focus && wide && !reduced);

  // Rows and cards are measured by layout offsets (immune to the entrance transforms). Each pool card
  // is centred on the groups it serves, then pushed apart so cards never overlap.
  const measure = useCallback(() => {
    const el = box.current;
    const col = poolCol.current;
    if (!el || !col || !wide) return setGeom(null);
    const rows = ROWS.map((g, i) => {
      const r = rowRefs.current[i];
      return r ? { g, cy: r.offsetTop + r.offsetHeight / 2, right: r.offsetLeft + r.offsetWidth, bottom: r.offsetTop + r.offsetHeight } : null;
    });
    if (rows.some((r) => !r)) return;
    const R = rows as NonNullable<(typeof rows)[number]>[];
    const colTop = col.offsetTop;
    const groupsH = Math.max(...R.map((r) => r.bottom));
    const hgt = (p: PoolKey) => poolRefs.current[p]?.offsetHeight ?? 0;
    const tops: Partial<Record<PoolKey, number>> = {};
    let y = 0;
    for (const p of POOLS) {
      const mine = R.filter((r) => r.g.pool === p.key);
      const want = mine.reduce((s, r) => s + r.cy, 0) / mine.length - colTop - hgt(p.key) / 2;
      tops[p.key] = Math.max(want, y);
      y = tops[p.key]! + hgt(p.key) + CARD_GAP;
    }
    const H = Math.max(groupsH - colTop, y - CARD_GAP);
    let limit = H;
    for (const p of [...POOLS].reverse()) {
      tops[p.key] = Math.min(tops[p.key]!, limit - hgt(p.key));
      limit = tops[p.key]! - CARD_GAP;
    }
    const shift = Math.min(0, ...POOLS.map((p) => tops[p.key]!));
    for (const p of POOLS) tops[p.key] = Math.round(tops[p.key]! - shift);
    // a link enters its card level with the groups it comes from, so one-to-one links run straight
    const x1 = col.offsetLeft - 7;
    const port = (p: PoolKey) => {
      const mine = R.filter((r) => r.g.pool === p);
      const cy = mine.reduce((s, r) => s + r.cy, 0) / mine.length;
      const top = colTop + tops[p]!;
      return Math.min(top + hgt(p) - 10, Math.max(top + 10, cy));
    };
    const links: Link[] = R.map((r) => {
      const a: Pt = [r.right + 7, r.cy];
      const b: Pt = [x1, port(r.g.pool)];
      return { group: r.g.key, pool: r.g.pool, a, b, ...bezier(a, b) };
    });
    const next: Geom = { w: el.clientWidth, h: Math.ceil(colTop + H), colTop, tops, links };
    setGeom((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [wide]);

  useLayoutEffect(() => {
    measure();
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    rowRefs.current.forEach((r) => r && ro.observe(r));
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [measure]);

  const poolOf = (g: GroupKey) => GROUPS.find((x) => x.key === g)!.pool;
  const litGroup = (g: GroupKey) => !focus || (focus.kind === 'group' ? focus.key === g : poolOf(g) === focus.key);
  const litPool = (p: PoolKey) => !focus || (focus.kind === 'pool' ? focus.key === p : poolOf(focus.key) === p);
  const active = (g: GroupKey) => !!focus && litGroup(g);
  const activePool = (p: PoolKey) => !!focus && litPool(p);
  const litArms = new Set<string>(focus?.kind === 'group' ? armsFor(focus.key) : focus?.kind === 'pool' ? POOL[focus.key].arms : []);
  const tipRow = tip ? benchRow(tip.bench) : undefined;
  const fixedArm = tip && tipRow ? poolArm(poolOf(tip.group), tipRow.fixedArm) : undefined;

  const t = (delay: number, duration = 0.6) => (reduced ? { duration: 0 } : { duration, delay, ease: EASE });
  const enter = (g: GroupKey) => ({ onMouseEnter: () => setFocus({ kind: 'group', key: g }), onMouseLeave: () => setFocus(null), onFocus: () => setFocus({ kind: 'group', key: g }), onBlur: () => setFocus(null) });

  const groupRow = (g: (typeof ROWS)[number], i: number) => {
    const h = HEAD[g.key];
    const act = active(g.key);
    const unit = g.key === 'robot' ? 'scenes' : 'inputs';
    return (
      <motion.div
        key={g.key}
        ref={(n: HTMLDivElement | null) => {
          rowRefs.current[i] = n;
        }}
        tabIndex={0}
        aria-label={`${g.label}: ${g.benchmarks.length} benchmarks, ${fmt(h.inputs)} test ${unit} scored by ${h.arms} ${POOL[g.pool].label.toLowerCase()}`}
        {...enter(g.key)}
        className={`border-t border-rule outline-none first:border-t-0 ${wide ? 'py-[11px]' : 'py-3'}`}
        initial={{ opacity: 0, y: 8 }}
        animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={t(0.15 + 0.06 * i)}
      >
        <div
          className={`grid items-center gap-x-4 gap-y-2 transition-opacity duration-300 ${wide ? 'grid-cols-[156px_minmax(0,1fr)]' : 'grid-cols-1'}`}
          style={{ opacity: litGroup(g.key) ? 1 : 0.34 }}
        >
          <div className={wide ? '' : 'flex flex-wrap items-center gap-x-2.5 gap-y-1'}>
            <span
              className={`inline-block rounded-[4px] border px-[5px] py-[3px] font-mono text-[9px] uppercase leading-none tracking-[0.14em] transition-colors duration-300 ${
                act ? 'border-blue/45 bg-blue-wash text-ink' : 'border-rule-2 text-ink-3'
              }`}
            >
              {g.input}
            </span>
            <div className={`font-sans text-[13.5px] font-semibold leading-[1.2] text-ink ${wide ? 'mt-[6px]' : ''}`}>{g.label}</div>
            <div className={`num text-[10.5px] leading-none ${act ? 'text-ink-2' : 'text-ink-3'} ${wide ? 'mt-[6px]' : 'basis-full'}`}>
              {fmt(h.inputs)} {unit} <span className="text-ink-4">×</span> {h.arms} arms
            </div>
          </div>
          <div className="flex flex-wrap gap-[5px]">
            {g.benchmarks.map((b, j) => {
              const out = !benchRow(b);
              const hot = tip?.bench === b;
              return (
                <motion.span
                  key={b}
                  onMouseEnter={(e) => {
                    const el = box.current!;
                    const o = el.getBoundingClientRect();
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setTip({ x: r.left - o.left - el.clientLeft + r.width / 2, y: r.top - o.top - el.clientTop, bench: b, group: g.key });
                  }}
                  onMouseLeave={() => setTip(null)}
                  className={`cursor-default whitespace-nowrap rounded-full border px-[8px] py-[4px] font-sans text-[11.5px] leading-none transition-colors duration-300 ${
                    out
                      ? `border-dashed ${act ? 'border-blue/45 text-ink-2' : 'border-rule-2 text-ink-3'}`
                      : hot
                        ? 'border-blue bg-blue-wash text-ink'
                        : act
                          ? 'border-blue/40 bg-blue-wash text-ink'
                          : 'border-rule-2 bg-surface text-ink-2'
                  }`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
                  transition={t(0.3 + 0.06 * i + 0.035 * j, 0.45)}
                >
                  {b}
                </motion.span>
              );
            })}
          </div>
          {!wide && (
            <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">
              <svg width="20" height="8" viewBox="0 0 20 8" aria-hidden>
                <path d="M1,4 H17 M13.5,1 L17,4 L13.5,7" fill="none" stroke={act ? 'var(--blue)' : 'var(--line)'} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {POOL[g.pool].label}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const poolCard = (p: (typeof POOLS)[number], j: number) => {
    const act = activePool(p.key);
    const top = geom?.tops[p.key];
    return (
      <motion.div
        key={p.key}
        ref={(n: HTMLDivElement | null) => {
          poolRefs.current[p.key] = n;
        }}
        tabIndex={0}
        aria-label={`${p.label}: ${p.arms.join(', ')}`}
        onMouseEnter={() => setFocus({ kind: 'pool', key: p.key })}
        onMouseLeave={() => setFocus(null)}
        onFocus={() => setFocus({ kind: 'pool', key: p.key })}
        onBlur={() => setFocus(null)}
        className={`outline-none ${wide ? 'absolute inset-x-0' : ''}`}
        style={wide ? { top: top ?? 0, visibility: top === undefined ? 'hidden' : undefined } : undefined}
        initial={{ opacity: 0, x: wide ? 10 : 0, y: wide ? 0 : 8 }}
        animate={on ? { opacity: 1, x: 0, y: 0 } : { opacity: 0 }}
        transition={t(0.55 + 0.07 * j)}
      >
        <div
          className={`rounded-[12px] border px-3.5 py-[10px] transition-[opacity,background-color,border-color] duration-300 ${
            act ? 'border-blue/40 bg-blue-wash' : 'border-rule bg-surface-2'
          }`}
          style={{ opacity: litPool(p.key) ? 1 : 0.34 }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans text-[13px] font-semibold text-ink">{p.label}</span>
            <span className="num text-[10.5px] text-ink-3">×{p.arms.length}</span>
          </div>
          <div className="mt-[7px] flex flex-wrap gap-x-[10px] gap-y-[6px]">
            {p.arms.map((a) => {
              const isFixed = fixedArm === a;
              const lit = litArms.has(a);
              return (
                <span key={a} className="inline-flex items-center gap-[5px] whitespace-nowrap font-mono text-[10.5px] leading-none">
                  <span
                    className="inline-block shrink-0 rounded-full transition-all duration-300"
                    style={{ width: isFixed ? 7 : 5, height: isFixed ? 7 : 5, background: isFixed ? 'var(--amber)' : lit ? 'var(--blue)' : 'var(--line)' }}
                  />
                  <span className={`transition-colors duration-300 ${isFixed ? 'font-semibold text-ink' : lit ? 'text-ink' : act ? 'text-ink-4' : 'text-ink-2'}`}>
                    {a}
                    {a === ASTRA && <sup className="ml-px text-ink-3">†</sup>}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div ref={wrap} className="mt-9">
      {/* column heads */}
      <div className={`mb-2 grid font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3 ${wide ? COLS : 'grid-cols-1'}`}>
        <div className={wide ? 'grid grid-cols-[156px_minmax(0,1fr)] gap-x-4' : 'flex justify-between gap-3'}>
          <span>Input · group</span>
          <span>{MATRIX.benchmarks} benchmarks</span>
        </div>
        {wide && (
          <>
            <span />
            <span className="pl-1">Arm pools</span>
          </>
        )}
      </div>

      <div ref={box} className={`relative border-t border-rule-2 ${wide ? `grid ${COLS} items-start` : ''}`}>
        {wide && geom && (
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={geom.w} height={geom.h} aria-hidden>
            {geom.links.map((l, i) => {
              const act = active(l.group);
              return (
                <g key={l.group} style={{ transition: 'opacity .3s' }} opacity={litGroup(l.group) ? 1 : 0.25}>
                  <motion.path
                    d={l.d}
                    fill="none"
                    stroke={act ? 'var(--blue)' : 'var(--line)'}
                    strokeWidth={act ? 1.7 : 1.25}
                    strokeLinecap="round"
                    style={{ transition: 'stroke .3s, stroke-width .3s' }}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: on ? 1 : 0 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.9, delay: 0.55 + 0.07 * i, ease: EASE }}
                  />
                  <motion.circle
                    cx={l.a[0]}
                    cy={l.a[1]}
                    r={3.2}
                    fill="var(--surface)"
                    stroke={act ? 'var(--blue)' : 'var(--line)'}
                    strokeWidth={1.3}
                    style={{ transition: 'stroke .3s' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: on ? 1 : 0 }}
                    transition={t(0.45 + 0.06 * i, 0.4)}
                  />
                  {act && !reduced && <Packet pts={l.pts} s={((clock * 90 + i * 29) % (l.len + 24)) + 3} len={20} width={3} />}
                </g>
              );
            })}
            {/* one port per pool: the three links into the language models merge there */}
            {POOLS.map((p) => {
              const l = geom.links.find((x) => x.pool === p.key);
              if (!l) return null;
              const act = activePool(p.key);
              return (
                <g key={p.key} style={{ transition: 'opacity .3s' }} opacity={litPool(p.key) ? 1 : 0.25}>
                  <motion.circle
                    cx={l.b[0]}
                    cy={l.b[1]}
                    r={3.6}
                    fill={act ? 'var(--blue)' : 'var(--surface)'}
                    stroke={act ? 'var(--blue)' : 'var(--line)'}
                    strokeWidth={1.3}
                    style={{ transition: 'fill .3s, stroke .3s' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: on ? 1 : 0 }}
                    transition={t(1.25, 0.4)}
                  />
                </g>
              );
            })}
          </svg>
        )}

        <div>{ROWS.map(groupRow)}</div>
        {wide && <div />}
        {wide ? (
          <div ref={poolCol} className="relative" style={{ height: geom ? geom.h - geom.colTop : undefined }}>
            {POOLS.map(poolCard)}
          </div>
        ) : (
          <div className="mt-2 border-t border-rule-2 pt-4">
            <div className="mb-2.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3">Arm pools</div>
            <div className="grid grid-cols-1 gap-2 @[26rem]:grid-cols-2">{POOLS.map(poolCard)}</div>
          </div>
        )}

        {/* benchmark read-out */}
        {tip && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[250px] -translate-x-1/2 -translate-y-full rounded-[10px] border border-rule bg-surface px-3 py-2 shadow-[var(--shadow)]"
            style={{ left: Math.max(126, Math.min(tip.x, (box.current?.clientWidth ?? 400) - 126)), top: tip.y - 8 }}
          >
            {tipRow ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="num text-[14px] font-semibold text-ink">{fmt(tipRow.inputs)}</span>
                  <span className="font-sans text-[11.5px] text-ink-3">test {tip.group === 'robot' ? 'scenes' : 'inputs'}, every arm scored</span>
                </div>
                <div className="mt-1 font-sans text-[11.5px] leading-snug text-ink-2">
                  {tipRow.bench}
                  <span className="text-ink-3"> · fixed arm </span>
                  <span className="mx-[3px] inline-block h-[7px] w-[7px] rounded-full align-middle" style={{ background: 'var(--amber)' }} />
                  {tipRow.fixedArm}
                </div>
              </>
            ) : (
              <div className="font-sans text-[11.5px] leading-snug text-ink-2">
                <b className="font-semibold text-ink">{tip.bench}</b> is left out of the test panel: each model’s later steps contain its own earlier code, so
                arms rarely share an input.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-rule pt-3 font-sans text-[11.5px] text-ink-3">
        <span>
          <span className="text-ink-2">†</span> {POOL.lm.note}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[14px] w-[24px] rounded-full border border-dashed border-rule-2" />
          not in the test panel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: 'var(--amber)' }} />
          a benchmark’s fixed arm, on {wide ? 'hover' : 'tap'}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (c) Table 1: evaluation panels                                       */
/* ------------------------------------------------------------------ */

const f2 = (v: number) => v.toFixed(2);

function PanelsTable({ wide }: { wide: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const head = 'pb-2 font-mono text-[9.5px] font-normal uppercase tracking-[0.14em] text-ink-3';
  return (
    <div className="mt-10">
      <Kicker
        right={
          <span>
            fixed and oracle, 0–100, compare <em className="font-serif italic normal-case tracking-normal text-ink-2">within a row</em> only
          </span>
        }
      >
        Evaluation panels · Table 1
      </Kicker>
      {wide ? (
        <table className="mt-3 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule-2">
              <th className={head}>Study</th>
              <th className={head}>Policies compared</th>
              <th className={`${head} text-right`}>Bench.</th>
              <th className={`${head} text-right`}>Inputs</th>
              <th className={`${head} text-right`}>Seeds</th>
              <th className={`${head} pl-6 text-right`}>Fixed</th>
              <th className={`${head} w-7`} />
              <th className={`${head} text-left`}>Oracle</th>
            </tr>
          </thead>
          <tbody>
            {PANELS.map((p, i) => (
              <tr
                key={p.study}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="border-b border-rule transition-colors duration-200"
                style={{ background: hover === i ? 'var(--surface-2)' : undefined }}
              >
                <td className="py-[7px] pr-4">
                  <span className="font-sans text-[13px] font-semibold text-ink">{p.study}</span>
                  <span className="ml-2 font-mono text-[10.5px] text-ink-3">{p.where}</span>
                </td>
                <td className="py-[7px] pr-4 font-sans text-[12.5px] text-ink-2">{p.policies}</td>
                <td className="num py-[7px] text-right text-[12px] text-ink-2">{p.benchmarks}</td>
                <td className="num py-[7px] text-right text-[12px] text-ink-2">{fmt(p.inputs)}</td>
                <td className="num py-[7px] text-right text-[12px] text-ink-3">{p.seeds ?? '–'}</td>
                <td className="num py-[7px] pl-6 text-right text-[12.5px] text-ink-2">{f2(p.fixed)}</td>
                <td className="py-[7px] text-center">
                  <svg width="18" height="8" viewBox="0 0 18 8" className="inline-block" aria-label="to">
                    <path d="M1,4 H15 M11.5,1 L15,4 L11.5,7" fill="none" stroke={hover === i ? 'var(--ink-2)' : 'var(--ink-4)'} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </td>
                <td className="num py-[7px] text-left text-[12.5px] font-semibold text-ink">{f2(p.oracle)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-3 border-t border-rule-2">
          {PANELS.map((p) => (
            <div key={p.study} className="border-b border-rule py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span>
                  <span className="font-sans text-[13px] font-semibold text-ink">{p.study}</span>
                  <span className="ml-2 font-mono text-[10.5px] text-ink-3">{p.where}</span>
                </span>
                <span className="num whitespace-nowrap text-[12px] text-ink-2">
                  {f2(p.fixed)} <span className="text-ink-4">→</span> <b className="font-semibold text-ink">{f2(p.oracle)}</b>
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3 font-sans text-[12px] text-ink-3">
                <span className="text-ink-2">{p.policies}</span>
                <span className="num whitespace-nowrap text-[10.5px]">
                  {p.benchmarks} bench. · {fmt(p.inputs)}
                  {p.seeds ? ` · ${p.seeds} seed${p.seeds > 1 ? 's' : ''}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2.5 font-sans text-[11.5px] leading-snug text-ink-3">
        Each study is scored on the test inputs where all its compared policies have outcomes, so the fixed arm and the oracle differ from study to study.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (d) the priced testbeds for code and text                            */
/* ------------------------------------------------------------------ */

function Testbeds({ cols }: { cols: 1 | 2 }) {
  const crb = SETUP.coderouterbench;
  const rb = SETUP.routerbench;
  const items = [
    { name: crb.name, what: 'code', facts: [`${crb.models} models`, `${fmt(crb.tasks)} coding tasks`, `${crb.arms} arms per state`], ref: crb.reference },
    { name: rb.name, what: 'text', facts: [`${rb.models} models`, `${fmt(rb.prompts)} prompts`, 'split 70/30'], ref: rb.reference },
  ];
  return (
    <div className="mt-10">
      <Kicker right="outcomes with token-price costs">Priced testbeds for code and text</Kicker>
      <div className={`mt-3 grid rounded-[12px] border border-rule bg-surface-2 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {items.map((it, i) => (
          <div key={it.name} className={`flex min-w-0 items-center gap-3.5 px-4 py-[11px] ${i ? (cols === 2 ? 'border-l border-rule' : 'border-t border-rule') : ''}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rule-2 bg-surface font-mono text-[12.5px] text-ink-2">$</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[19px] font-semibold leading-tight text-ink">{it.name}</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3">{it.what}</span>
              </div>
              <div className="num mt-[2px] flex flex-wrap gap-x-1.5 text-[11px] leading-snug text-ink-2">
                {it.facts.map((f, k) => (
                  <span key={f} className="whitespace-nowrap">
                    {f}
                    {k < it.facts.length - 1 && <span className="ml-1.5 text-ink-4">·</span>}
                  </span>
                ))}
              </div>
              <div className="mt-[3px] flex items-center gap-1.5 font-mono text-[10.5px] text-ink-3">
                <span className="inline-block h-[7px] w-[7px] rounded-[2px]" style={{ background: 'var(--amber)' }} />
                reference {it.ref}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kicker({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3">
      <span className="text-ink-2">{children}</span>
      {right && <span className="normal-case tracking-normal font-sans text-[11.5px]">{right}</span>}
    </div>
  );
}

