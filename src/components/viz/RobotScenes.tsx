import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { ROBOT } from '@/data/results';
import { clamp, useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { d, hash01, length, pointAt, trim, type Pt } from '@/lib/polyline';
import { FigTag, FlowEdge, FlowNode, Packet } from './flow';
import { mono, sans } from './svg';

// Finding 3, the paper's Fig. 4. On RoboTwin 2.0 the outcome router reads the instruction, three
// camera frames and the robot state, predicts each of seven policies' success and plays the highest.
// Top: an illustrative stream of test scenes whose long-run split is the paper's (929 of 1,000 clean
// scenes to PatchWAM; 842 and 141 of 1,000 randomized ones to ME-Dex and GigaBrain; the rest to other
// policies, split not reported). Bottom: success by scene condition and policy time, from ROBOT.

type Cond = 'clean' | 'rand';
type Dest = 'patch' | 'medex' | 'giga' | 'rest';
type Counts = Record<Cond, Record<Dest | 'n', number>>;

const [CLEAN, RAND] = ROBOT.conditions;
const sentTo = (c: typeof CLEAN, arm: string) => c.sentTo.find((s) => s.arm === arm)?.n ?? 0;
const N_PATCH = sentTo(CLEAN, 'PatchWAM');
const N_MEDEX = sentTo(RAND, 'ME-Dex');
const N_GIGA = sentTo(RAND, 'GigaBrain');
const P_PATCH = N_PATCH / CLEAN.scenes;
const P_MEDEX = N_MEDEX / RAND.scenes;
const P_GIGA = N_GIGA / RAND.scenes;

/** the paper's split over all 1,000 scenes of each condition */
const PAPER: Counts = {
  clean: { n: CLEAN.scenes, patch: N_PATCH, medex: 0, giga: 0, rest: CLEAN.scenes - N_PATCH },
  rand: { n: RAND.scenes, patch: 0, medex: N_MEDEX, giga: N_GIGA, rest: RAND.scenes - N_MEDEX - N_GIGA },
};

// one categorical mapping for the whole figure
const DEST: Record<Dest, { label: string; color: string }> = {
  patch: { label: 'PatchWAM', color: 'var(--teal)' },
  medex: { label: 'ME-Dex', color: 'var(--amber)' },
  giga: { label: 'GigaBrain', color: 'var(--slate)' },
  rest: { label: 'Others', color: 'var(--ink-4)' },
};
const COND_LABEL: Record<Cond, string> = { clean: 'Clean', rand: 'Randomized' };
const COND_DESTS: Record<Cond, Dest[]> = { clean: ['patch', 'rest'], rand: ['medex', 'giga', 'rest'] };

/* ------------------------------------------------------------------ */
/* the stream                                                          */
/* ------------------------------------------------------------------ */

// Scenes alternate between the two conditions, one every GAP seconds. Destinations come from a fixed
// pseudo-random sequence per condition (salts chosen so that early counts sit near the long-run split).
const GAP = 0.46;
const LANE_T = 2.05; // source to router, at constant speed
const HOLD = 0.14; // inside the router
const OUT_T: Record<Dest, number> = { patch: 1.0, medex: 1.0, giga: 1.18, rest: 0.9 };
const OUT_MAX = 1.18;
const PULSE = 0.7;
const SALT: Record<Cond, number> = { clean: 364, rand: 120 };

function sceneAt(i: number): { cond: Cond; dest: Dest } {
  const cond: Cond = i % 2 === 0 ? 'clean' : 'rand';
  const u = hash01(i >> 1, SALT[cond]);
  if (cond === 'clean') return { cond, dest: u < P_PATCH ? 'patch' : 'rest' };
  return { cond, dest: u < P_MEDEX ? 'medex' : u < P_MEDEX + P_GIGA ? 'giga' : 'rest' };
}
const arrival = (i: number, dest: Dest) => i * GAP + LANE_T + HOLD + OUT_T[dest];

const zero = (): Counts => ({
  clean: { n: 0, patch: 0, medex: 0, giga: 0, rest: 0 },
  rand: { n: 0, patch: 0, medex: 0, giga: 0, rest: 0 },
});
const copy = (c: Counts): Counts => ({ clean: { ...c.clean }, rand: { ...c.rand } });

/** CUM[n] = where scenes 0..n-1 went (grown on demand) */
const CUM: Counts[] = [zero()];
function prefix(n: number): Counts {
  while (CUM.length <= n) {
    const i = CUM.length - 1;
    const next = copy(CUM[i]);
    const { cond, dest } = sceneAt(i);
    next[cond][dest]++;
    next[cond].n++;
    CUM.push(next);
  }
  return CUM[n];
}

/** scenes that have reached their policy by time t */
function arrivedBy(t: number): Counts {
  const safe = Math.floor((t - LANE_T - HOLD - OUT_MAX) / GAP); // every scene up to here has arrived
  const out = copy(prefix(Math.max(0, safe + 1)));
  const last = Math.floor(t / GAP);
  for (let i = Math.max(0, safe + 1); i <= last; i++) {
    const { cond, dest } = sceneAt(i);
    if (arrival(i, dest) <= t) {
      out[cond][dest]++;
      out[cond].n++;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* two layouts: a left-to-right diagram, and a top-to-bottom one       */
/* ------------------------------------------------------------------ */

interface Circle {
  x: number;
  y: number;
  r: number;
}
interface Layout {
  key: 'wide' | 'narrow';
  W: number;
  H: number;
  src: Record<Cond, Circle>;
  router: Circle;
  dest: Record<Dest, Circle & { size: number }>;
  lane: Record<Cond, Pt[]>;
  out: Record<Dest, Pt[]>;
  laneLen: Record<Cond, number>;
  outLen: Record<Dest, number>;
  chip: number;
  glyph: number;
}

function finish(l: Omit<Layout, 'laneLen' | 'outLen'>): Layout {
  return {
    ...l,
    laneLen: { clean: length(l.lane.clean), rand: length(l.lane.rand) },
    outLen: { patch: length(l.out.patch), medex: length(l.out.medex), giga: length(l.out.giga), rest: length(l.out.rest) },
  };
}

// Wide: scenes merge into the router from the left; decisions fan out to a column of policies, with
// clean scenes level with PatchWAM and randomized ones level with ME-Dex.
const WIDE = finish({
  key: 'wide',
  W: 880,
  H: 372,
  src: { clean: { x: 86, y: 62, r: 40 }, rand: { x: 86, y: 238, r: 40 } },
  router: { x: 410, y: 150, r: 50 },
  dest: {
    patch: { x: 790, y: 62, r: 40, size: 13 },
    rest: { x: 790, y: 150, r: 26, size: 11.5 },
    medex: { x: 790, y: 238, r: 40, size: 13.5 },
    giga: { x: 790, y: 326, r: 37, size: 12.5 },
  },
  lane: {
    clean: [[131, 62], [180, 62], [268, 150], [355, 150]],
    rand: [[131, 238], [180, 238], [268, 150], [355, 150]],
  },
  out: {
    patch: [[465, 150], [520, 150], [608, 62], [745, 62]],
    medex: [[465, 150], [520, 150], [608, 238], [745, 238]],
    giga: [[465, 150], [520, 150], [696, 326], [748, 326]],
    rest: [[465, 150], [759, 150]],
  },
  chip: 1.1,
  glyph: 1.5,
});

const line = (a: Circle, b: Circle, pad = 5): Pt[] => trim([[a.x, a.y], [b.x, b.y]], a.r + pad, b.r + pad);
const N_SRC = { clean: { x: 84, y: 74, r: 36 }, rand: { x: 276, y: 74, r: 36 } };
const N_ROUTER = { x: 180, y: 232, r: 44 };
const N_DEST = {
  patch: { x: 46, y: 394, r: 33, size: 11.5 },
  rest: { x: 132, y: 394, r: 22, size: 10.5 },
  medex: { x: 222, y: 394, r: 33, size: 12 },
  giga: { x: 312, y: 394, r: 33, size: 11.5 },
};
const NARROW = finish({
  key: 'narrow',
  W: 360,
  H: 436,
  src: N_SRC,
  router: N_ROUTER,
  dest: N_DEST,
  lane: { clean: line(N_SRC.clean, N_ROUTER), rand: line(N_SRC.rand, N_ROUTER) },
  out: {
    patch: line(N_ROUTER, N_DEST.patch),
    rest: line(N_ROUTER, N_DEST.rest),
    medex: line(N_ROUTER, N_DEST.medex),
    giga: line(N_ROUTER, N_DEST.giga),
  },
  chip: 1,
  glyph: 1.35,
});

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

/* ------------------------------------------------------------------ */
/* a scene: three camera frames, plain for clean, textured for         */
/* randomized                                                          */
/* ------------------------------------------------------------------ */

function SceneGlyph({ cond, x, y, s = 1, opacity = 1, hatch }: { cond: Cond; x: number; y: number; s?: number; opacity?: number; hatch: string }) {
  const w = 20;
  const h = 15;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(3)})`} opacity={opacity}>
      <rect x={-w / 2 + 4} y={-h / 2 - 4} width={w} height={h} rx={2.5} fill="var(--surface)" stroke="var(--ink-4)" strokeWidth={1} />
      <rect x={-w / 2 + 2} y={-h / 2 - 2} width={w} height={h} rx={2.5} fill="var(--surface)" stroke="var(--ink-4)" strokeWidth={1} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2.5} fill={cond === 'rand' ? `url(#${hatch})` : 'var(--surface)'} stroke="var(--ink-2)" strokeWidth={1.25} />
      <line x1={-w / 2 + 2.5} x2={w / 2 - 2.5} y1={3.2} y2={3.2} stroke="var(--ink-3)" strokeWidth={1} />
      <rect x={-2.6} y={-2.4} width={5.2} height={5.6} rx={1.2} fill="var(--ink-2)" />
    </g>
  );
}

function HatchDef({ id }: { id: string }) {
  return (
    <pattern id={id} width={3.6} height={3.6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={3.6} height={3.6} fill="var(--surface)" />
      <line x1={0} y1={0} x2={0} y2={3.6} stroke="var(--ink-4)" strokeWidth={1.5} />
    </pattern>
  );
}

const useSafeId = () => `ra-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

/* ------------------------------------------------------------------ */
/* (a) the live diagram                                                */
/* ------------------------------------------------------------------ */

type NodeId = 'router' | Dest;
interface Frame {
  chips: { key: number; cond: Cond; x: number; y: number; s: number; o: number }[];
  packets: { key: number; dest: Dest; s: number }[];
  pulse: Partial<Record<NodeId, { p: number; color: string }>>;
}

function liveFrame(L: Layout, now: number): Frame {
  const chips: Frame['chips'] = [];
  const packets: Frame['packets'] = [];
  const pulse: Frame['pulse'] = {};
  const hit = (id: NodeId, at: number, color: string) => {
    if (now < at || now >= at + PULSE) return;
    const p = 1 - (now - at) / PULSE;
    if (!pulse[id] || pulse[id]!.p < p) pulse[id] = { p, color };
  };
  const last = Math.floor(now / GAP);
  const first = Math.max(0, Math.floor((now - LANE_T - HOLD - OUT_MAX - PULSE) / GAP));
  for (let i = first; i <= last; i++) {
    const t0 = i * GAP;
    const { cond, dest } = sceneAt(i);
    const u = (now - t0) / LANE_T;
    if (u >= 0 && u < 1) {
      const [x, y] = pointAt(L.lane[cond], u * L.laneLen[cond]);
      const appear = clamp(u / 0.09);
      const absorb = clamp((1 - u) / 0.16);
      chips.push({ key: i, cond, x, y, s: L.chip * (0.55 + 0.45 * appear) * (0.35 + 0.65 * absorb), o: Math.min(appear, absorb * 1.6, 1) });
    }
    const tr = t0 + LANE_T;
    hit('router', tr, DEST[dest].color);
    const tl = tr + HOLD;
    const v = (now - tl) / OUT_T[dest];
    if (v > 0 && v < 1) {
      const eased = v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
      packets.push({ key: i, dest, s: eased * L.outLen[dest] + 10 });
    }
    hit(dest, tl + OUT_T[dest], DEST[dest].color);
  }
  return { chips, packets, pulse };
}

/** reduced motion: one still moment, with every route in use */
function stillFrame(L: Layout): Frame {
  const at = (c: Cond, u: number) => pointAt(L.lane[c], u * L.laneLen[c]);
  const chip = (key: number, c: Cond, u: number) => {
    const [x, y] = at(c, u);
    return { key, cond: c, x, y, s: L.chip, o: 1 };
  };
  return {
    chips: [chip(0, 'clean', 0.2), chip(1, 'rand', 0.42), chip(2, 'clean', 0.66)],
    packets: [
      { key: 0, dest: 'patch', s: L.outLen.patch * 0.72 },
      { key: 1, dest: 'medex', s: L.outLen.medex * 0.5 },
      { key: 2, dest: 'giga', s: L.outLen.giga * 0.86 },
    ],
    pulse: {},
  };
}

function SceneStream({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const inView = useInView(ref, '0px');
  const [t] = useClock(inView && !reduced);
  const L = width > 0 && width < 640 ? NARROW : WIDE;
  const hatch = useSafeId();

  const frame = useMemo(() => (reduced ? stillFrame(L) : liveFrame(L, t)), [reduced, L, t]);
  const counts = useMemo(() => (reduced ? PAPER : arrivedBy(t)), [reduced, t]);
  const nodeAt = (id: NodeId) => (id === 'router' ? L.router : L.dest[id]);
  const narrow = L.key === 'narrow';

  return (
    <div ref={ref}>
      <div className={narrow ? 'mx-auto max-w-[440px]' : ''}>
        <svg
          key={L.key}
          viewBox={`0 0 ${L.W} ${L.H}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Test scenes, clean and domain-randomized, pass through the router, which plays PatchWAM on almost every clean scene and ME-Dex or GigaBrain on randomized ones."
        >
          <defs>
            <HatchDef id={hatch} />
          </defs>

          {(['clean', 'rand'] as Cond[]).map((c, i) => (
            <FlowEdge key={`lane-${c}`} pts={L.lane[c]} delay={0.1 + i * 0.08} />
          ))}
          {(['patch', 'medex', 'giga'] as Dest[]).map((dd, i) => (
            <FlowEdge key={`out-${dd}`} pts={L.out[dd]} delay={0.3 + i * 0.08} />
          ))}
          {/* the faint route to the other policies (FlowEdge's draw-in would override a dash pattern) */}
          <motion.path
            d={d(L.out.rest)}
            fill="none"
            stroke="var(--line)"
            strokeWidth={1.3}
            strokeDasharray="3 5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          />

          {/* rings of the nodes that something just reached */}
          {(Object.keys(frame.pulse) as NodeId[]).map((id) => {
            const n = nodeAt(id);
            const pl = frame.pulse[id]!;
            return <circle key={`ring-${id}`} cx={n.x} cy={n.y} r={n.r + 4 + (1 - pl.p) * 16} fill="none" stroke={pl.color} strokeWidth={1.6} opacity={pl.p * 0.75} />;
          })}

          {frame.packets.map((p) =>
            p.dest === 'rest' ? (
              <Packet key={`pk-${p.key}`} pts={L.out.rest} s={p.s} len={18} width={3} color={DEST.rest.color} glow={false} />
            ) : (
              <Packet key={`pk-${p.key}`} pts={L.out[p.dest]} s={p.s} len={22} width={4.5} color={DEST[p.dest].color} />
            )
          )}

          {/* scenes on their way in: drawn under the nodes, so they leave the source and sink into the router */}
          {frame.chips.map((c) => (
            <SceneGlyph key={`chip-${c.key}`} cond={c.cond} x={c.x} y={c.y} s={c.s} opacity={c.o} hatch={hatch} />
          ))}

          {/* sources */}
          {(['clean', 'rand'] as Cond[]).map((c) => (
            <g key={`src-${c}`}>
              <FlowNode x={L.src[c].x} y={L.src[c].y} r={L.src[c].r} caption={{ text: COND_LABEL[c], at: narrow ? 'above' : 'below' }} />
              <SceneGlyph cond={c} x={L.src[c].x - 2} y={L.src[c].y + 2} s={L.glyph} hatch={hatch} />
            </g>
          ))}

          {/* router */}
          <FlowNode
            x={L.router.x}
            y={L.router.y}
            r={L.router.r}
            labelTex="g(s)"
            size={narrow ? 19 : 21}
            tone="blue"
            caption={narrow ? undefined : { text: 'reads 3 frames + state' }}
          />
          {narrow && (
            <foreignObject x={L.router.x + L.router.r + 12} y={L.router.y - 20} width={130} height={40} style={{ overflow: 'visible' }}>
              <div className="font-mono text-[11px] uppercase leading-[18px] tracking-[0.14em] text-ink-3">
                reads 3 frames
                <br />+ state
              </div>
            </foreignObject>
          )}

          {/* policies */}
          {(['patch', 'medex', 'giga', 'rest'] as Dest[]).map((dd) => {
            const n = L.dest[dd];
            // FlowNode has no slate tone: GigaBrain gets the same wash-and-ring look, drawn here
            return dd === 'giga' ? (
              <g key={`dest-${dd}`}>
                <circle cx={n.x} cy={n.y} r={n.r} fill="color-mix(in oklab, var(--slate) 13%, var(--surface))" stroke="var(--slate)" strokeWidth={1.9} />
                <text x={n.x} y={n.y + n.size * 0.36} textAnchor="middle" fontSize={n.size} fill="var(--ink)" style={{ ...sans, fontWeight: 450, letterSpacing: '-0.01em' }}>
                  {DEST.giga.label}
                </text>
              </g>
            ) : (
              <FlowNode
                key={`dest-${dd}`}
                x={n.x}
                y={n.y}
                r={n.r}
                label={DEST[dd].label}
                size={n.size}
                tone={dd === 'patch' ? 'teal' : dd === 'medex' ? 'amber' : 'idle'}
                dim={dd === 'rest'}
              />
            );
          })}

          {/* a faint flash inside the node that something just reached */}
          {(Object.keys(frame.pulse) as NodeId[]).map((id) => {
            const n = nodeAt(id);
            const pl = frame.pulse[id]!;
            return <circle key={`flash-${id}`} cx={n.x} cy={n.y} r={n.r} fill={pl.color} opacity={pl.p * 0.12} pointerEvents="none" />;
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
        {(['clean', 'rand'] as Cond[]).map((c) => (
          <Tally key={c} cond={c} counts={counts[c]} final={reduced} hatch={hatch} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
        <FigTag>RoboTwin 2.0 · 2,000 test scenes · 10 unseen tasks</FigTag>
        <span className="font-sans text-[12px] text-ink-3">
          {reduced ? 'Counts: the router’s split of all 1,000 scenes in each condition.' : 'Illustrative stream; ticks mark the router’s split of all 1,000 scenes.'}
        </span>
      </div>
    </div>
  );
}

/** running tally for one condition: a 100% bar of where its scenes went, with the paper's split as ticks */
function Tally({ cond, counts, final, hatch }: { cond: Cond; counts: Record<Dest | 'n', number>; final: boolean; hatch: string }) {
  const dests = COND_DESTS[cond];
  const shown = dests.filter((k) => counts[k] > 0);
  const ticks = cond === 'clean' ? [P_PATCH] : [P_MEDEX, P_MEDEX + P_GIGA];
  const fmt = (n: number) => n.toLocaleString('en-US');
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <svg width={24} height={20} viewBox="-12 -11 24 20" aria-hidden className="shrink-0 overflow-visible">
            <defs>
              <HatchDef id={`${hatch}-${cond}`} />
            </defs>
            <SceneGlyph cond={cond} x={-1.5} y={1.5} s={0.82} hatch={`${hatch}-${cond}`} />
          </svg>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">{COND_LABEL[cond]}</span>
        </span>
        <span className="font-mono text-[11.5px] tabular-nums text-ink-3">
          {final ? `${fmt(counts.n)} scenes` : `${fmt(counts.n)} routed`}
        </span>
      </div>
      <div className="relative mt-2.5 h-[8px]">
        <div className="flex h-full gap-[2px] overflow-hidden rounded-[4px] bg-line-soft">
          {shown.map((k) => (
            <span
              key={k}
              className="h-full min-w-0"
              style={{ flexGrow: counts[k], flexBasis: 0, background: DEST[k].color, transition: 'flex-grow .45s cubic-bezier(.22,1,.36,1)' }}
            />
          ))}
        </div>
        {ticks.map((p) => (
          <span key={p} className="absolute top-[-4px] h-[16px] w-[1.5px] -translate-x-1/2 rounded-full bg-ink-2" style={{ left: `${p * 100}%` }} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[12px] text-ink-3">
        {dests.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-[4.5px] w-3.5 rounded-full" style={{ background: DEST[k].color }} />
            {k === 'rest' ? 'others' : DEST[k].label}
            <span className="font-mono tabular-nums text-ink">{fmt(counts[k])}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (b) the result                                                      */
/* ------------------------------------------------------------------ */

const SERIES = [
  { key: 'meDex', label: 'ME-Dex', legend: 'ME-Dex (fixed)', color: 'var(--amber)' },
  { key: 'patchWam', label: 'PatchWAM', legend: 'PatchWAM', color: 'var(--teal)' },
  { key: 'router', label: 'Router', legend: 'Router', color: 'var(--blue)' },
] as const;
type SeriesKey = (typeof SERIES)[number]['key'];

// success chart geometry; a narrower viewBox on phones keeps its text near its set size
const SH = 282;
const SB = 238;
const ST = 26;
const sy = (v: number) => SB - (v / 100) * (SB - ST);
function successGeom(narrow: boolean) {
  const W = narrow ? 340 : 470;
  const x0 = 40;
  const x1 = W - 8;
  const bw = narrow ? 24 : 28;
  const bg = narrow ? 4 : 5;
  const groups = [
    { key: 'clean' as Cond, c: CLEAN, cx: x0 + (x1 - x0) * 0.27 },
    { key: 'rand' as Cond, c: RAND, cx: x0 + (x1 - x0) * 0.74 },
  ];
  const barX = (cx: number, j: number) => cx - (3 * bw + 2 * bg) / 2 + j * (bw + bg);
  return { W, x0, x1, bw, bg, groups, barX };
}
const EASE = [0.22, 1, 0.36, 1] as const;

/** a column with a 4px rounded data end and a square base */
function columnPath(x: number, base: number, w: number, h: number, r = 4) {
  if (h <= 0.01) return `M${x},${base} H${x + w} Z`;
  const k = Math.min(r, h, w / 2);
  const top = base - h;
  return `M${x},${base} V${top + k} Q${x},${top} ${x + k},${top} H${x + w - k} Q${x + w},${top} ${x + w},${top + k} V${base} Z`;
}

function GrowColumn({ x, w, base, h, color, on, instant, delay, dim }: { x: number; w: number; base: number; h: number; color: string; on: boolean; instant: boolean; delay: number; dim: boolean }) {
  const mv = useMotionValue(instant && on ? h : 0);
  useEffect(() => {
    if (!on) return;
    if (instant) {
      mv.set(h);
      return;
    }
    const a = animate(mv, h, { duration: 1.05, delay, ease: EASE });
    return () => a.stop();
  }, [on, instant, h, delay, mv]);
  const path = useTransform(mv, (v) => columnPath(x, base, w, v));
  // hover dimming lives on a plain group: motion owns the path's own style
  return (
    <g style={{ opacity: dim ? 0.32 : 1, transition: 'opacity .25s' }}>
      <motion.path d={path} fill={color} />
    </g>
  );
}

function SuccessChart({ on, instant }: { on: boolean; instant: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const G = successGeom(width > 0 && width < 420);
  const [tip, setTip] = useState<{ g: number; j: number } | null>(null);
  const hatch = useSafeId();
  const toggle = (g: number, j: number) => setTip((cur) => (cur && cur.g === g && cur.j === j ? null : { g, j }));
  const isTip = (g: number, j: number) => tip !== null && tip.g === g && tip.j === j;

  const tipBody = (() => {
    if (!tip) return null;
    const grp = G.groups[tip.g];
    const s = SERIES[tip.j];
    const v = grp.c[s.key as SeriesKey];
    const note =
      s.key === 'router'
        ? grp.key === 'clean'
          ? `sends ${N_PATCH} of ${CLEAN.scenes.toLocaleString('en-US')} to PatchWAM`
          : `sends ${N_MEDEX} to ME-Dex, ${N_GIGA} to GigaBrain`
        : s.key === 'meDex'
          ? 'the fixed arm: best single policy'
          : null;
    return { grp, s, v, note, x: G.barX(grp.cx, tip.j) + G.bw / 2, y: sy(Math.max(v, grp.c.oracle)) - 8 };
  })();

  return (
    <div>
      <div className="mb-3">
        <span className="block font-mono text-[10.5px] uppercase leading-[16px] tracking-[0.16em] text-ink-3">Success by scene condition</span>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[12px] text-ink-3">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-[2.5px]" style={{ background: s.color }} />
              {s.legend}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <svg width={18} height={6} aria-hidden>
              <line x1={0} y1={3} x2={18} y2={3} stroke="var(--ink-3)" strokeWidth={1.4} strokeDasharray="4 3" />
            </svg>
            per-scene oracle
          </span>
        </div>
      </div>

      <div ref={box} className="relative mx-auto max-w-[560px] md:max-w-none">
        <svg
          viewBox={`0 0 ${G.W} ${SH}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Success by scene condition. Clean: ME-Dex 78.4, PatchWAM 81.7, router 81.6, oracle 93.3. Randomized: ME-Dex 62.5, PatchWAM 45.6, router 61.5, oracle 84.4 percent."
        >
          <defs>
            <HatchDef id={hatch} />
          </defs>
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={G.x0} x2={G.x1} y1={sy(v)} y2={sy(v)} stroke={v === 0 ? 'var(--ink-4)' : 'var(--rule)'} strokeWidth={1} />
              <text x={G.x0 - 9} y={sy(v) + 3.8} textAnchor="end" fontSize={10.5} fill="var(--ink-3)" style={mono}>
                {v}
              </text>
            </g>
          ))}
          <text x={G.x0 - 30} y={10} fontSize={11.5} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            success, %
          </text>

          {G.groups.map((grp, g) => {
            const left = G.barX(grp.cx, 0) - 10;
            const right = G.barX(grp.cx, 2) + G.bw + 10;
            const yo = sy(grp.c.oracle);
            return (
              <g key={grp.key}>
                {/* the per-scene oracle */}
                <motion.g initial={{ opacity: instant ? 1 : 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ delay: instant ? 0 : 1.05 + g * 0.1, duration: 0.5 }}>
                  <line x1={left} x2={right} y1={yo} y2={yo} stroke="var(--ink-3)" strokeWidth={1.4} strokeDasharray="5 4" />
                  <text x={right} y={yo - 5} textAnchor="end" fontSize={10.5} fill="var(--ink-3)" style={mono}>
                    {grp.c.oracle.toFixed(1)}
                  </text>
                </motion.g>

                {SERIES.map((s, j) => {
                  const v = grp.c[s.key as SeriesKey];
                  return (
                    <GrowColumn
                      key={s.key}
                      x={G.barX(grp.cx, j)}
                      w={G.bw}
                      base={SB}
                      h={SB - sy(v)}
                      color={s.color}
                      on={on}
                      instant={instant}
                      delay={0.12 + g * 0.22 + j * 0.08}
                      dim={tip !== null && !isTip(g, j)}
                    />
                  );
                })}
                {SERIES.map((s, j) => {
                  const v = grp.c[s.key as SeriesKey];
                  const strong = s.key === 'router';
                  return (
                    <g key={`v-${s.key}`} style={{ opacity: tip && !isTip(g, j) ? 0.35 : 1, transition: 'opacity .25s' }}>
                      <motion.text
                        x={G.barX(grp.cx, j) + G.bw / 2}
                        y={sy(v) - 6}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontWeight={strong ? 600 : 400}
                        fill={strong ? 'var(--ink)' : 'var(--ink-3)'}
                        style={mono}
                        initial={{ opacity: instant ? 1 : 0 }}
                        animate={{ opacity: on ? 1 : 0 }}
                        transition={{ delay: instant ? 0 : 0.85 + g * 0.22 + j * 0.08, duration: 0.3 }}
                      >
                        {v.toFixed(1)}
                      </motion.text>
                    </g>
                  );
                })}

                {/* condition label with its scene glyph */}
                <g transform={`translate(${grp.cx - (grp.key === 'clean' ? 23 : 39)} 0)`}>
                  <SceneGlyph cond={grp.key} x={-6} y={SB + 21} s={0.72} hatch={hatch} />
                  <text x={8} y={SB + 25.5} fontSize={12.5} fill="var(--ink-2)" style={sans}>
                    {COND_LABEL[grp.key]}
                  </text>
                </g>

                {/* hit targets, larger than the marks */}
                {SERIES.map((s, j) => (
                  <rect
                    key={`hit-${s.key}`}
                    x={G.barX(grp.cx, j) - G.bg / 2}
                    y={ST - 10}
                    width={G.bw + G.bg}
                    height={SB - ST + 10}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${s.label}, ${COND_LABEL[grp.key].toLowerCase()} scenes: ${grp.c[s.key as SeriesKey]}% success`}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setTip({ g, j })}
                    onPointerLeave={(e) => e.pointerType === 'mouse' && setTip(null)}
                    onClick={() => toggle(g, j)}
                    onFocus={() => setTip({ g, j })}
                    onBlur={() => setTip(null)}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {tipBody && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[230px] rounded-xl border border-rule bg-surface px-3 py-2 shadow-[var(--shadow)]"
            style={{
              left: `${Math.min(86, Math.max(14, (tipBody.x / G.W) * 100))}%`,
              top: `${(tipBody.y / SH) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[15px] font-semibold tabular-nums text-ink">{tipBody.v.toFixed(1)}%</span>
              <span className="font-sans text-[12px] text-ink-3">success</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-sans text-[12px] text-ink-2">
              <span className="inline-block h-[3px] w-3 rounded-full" style={{ background: tipBody.s.color }} />
              {tipBody.s.label} · {COND_LABEL[tipBody.grp.key].toLowerCase()} scenes
            </div>
            {tipBody.note && <div className="mt-0.5 font-sans text-[11.5px] text-ink-3">{tipBody.note}</div>}
            <div className="mt-0.5 font-sans text-[11.5px] text-ink-3">per-scene oracle {tipBody.grp.c.oracle.toFixed(1)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}

const TIME = [
  { key: 'router', label: 'Router', s: ROBOT.seconds.router, success: ROBOT.overall.router, color: 'var(--blue)' },
  { key: 'patchWam', label: 'PatchWAM', s: ROBOT.seconds.patchWam, success: ROBOT.overall.patchWam, color: 'var(--teal)' },
  { key: 'meDex', label: 'ME-Dex', s: ROBOT.seconds.meDex, success: ROBOT.overall.fixed, color: 'var(--amber)' },
];
const T_MAX = 16;

function TimeChart({ on, instant }: { on: boolean; instant: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  const pct = (s: number) => `${(s / T_MAX) * 100}%`;
  const meDex = ROBOT.seconds.meDex;
  const ov = ROBOT.overall;
  const sign = (v: number) => (v > 0 ? `+${v.toFixed(2)}` : `−${Math.abs(v).toFixed(2)}`);
  const active = TIME.find((r) => r.key === hover);
  return (
    <div>
      <span className="block font-mono text-[10.5px] uppercase leading-[16px] tracking-[0.16em] text-ink-3">Policy time per scene</span>
      <div className="relative mt-4 md:mt-[46px]" onPointerLeave={() => setHover(null)}>
        <div className="relative space-y-3">
          {/* recessive grid, over the track column only */}
          <div className="pointer-events-none absolute inset-y-[-6px] left-[80px] right-[66px]">
            {[0, 4, 8, 12, 16].map((v) => (
              <span key={v} className="absolute inset-y-0 w-px" style={{ left: pct(v), background: v === 0 ? 'var(--ink-4)' : 'var(--rule)' }} />
            ))}
          </div>
          {TIME.map((r, i) => {
            const dim = hover !== null && hover !== r.key;
            return (
              <div
                key={r.key}
                className="grid cursor-default grid-cols-[68px_minmax(0,1fr)_54px] items-center gap-x-3 rounded-[4px]"
                tabIndex={0}
                aria-label={`${r.label}: ${r.s.toFixed(2)} seconds of policy time per scene, ${r.success.toFixed(2)}% success`}
                onPointerEnter={() => setHover(r.key)}
                onFocus={() => setHover(r.key)}
                onBlur={() => setHover(null)}
                onClick={() => setHover((h) => (h === r.key ? null : r.key))}
                style={{ opacity: dim ? 0.4 : 1, transition: 'opacity .25s' }}
              >
                <span className="font-sans text-[12.5px] text-ink-2">{r.label}</span>
                <div className="relative h-[14px]">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-r-[4px]"
                    style={{ background: r.color }}
                    initial={{ width: instant && on ? pct(r.s) : 0 }}
                    animate={{ width: on ? pct(r.s) : 0 }}
                    transition={instant ? { duration: 0 } : { duration: 1.05, delay: 0.25 + i * 0.1, ease: EASE }}
                  />
                  {r.key === 'router' && (
                    <motion.div
                      className="absolute inset-y-0 flex items-center justify-center rounded-r-[4px] border border-dashed border-ink-4 bg-surface"
                      style={{ left: pct(r.s), width: pct(meDex - r.s) }}
                      initial={{ opacity: instant && on ? 1 : 0 }}
                      animate={{ opacity: on ? 1 : 0 }}
                      transition={{ delay: instant ? 0 : 1.4, duration: 0.5 }}
                    >
                      <span className="font-mono text-[10px] leading-none tabular-nums text-ink-3">−{Math.round(ROBOT.seconds.saving * 100)}%</span>
                    </motion.div>
                  )}
                </div>
                <span className="text-right font-mono text-[12px] tabular-nums text-ink">{r.s.toFixed(2)} s</span>
              </div>
            );
          })}
        </div>
        <div className="relative mt-2 h-4 font-mono text-[10.5px] text-ink-3" style={{ marginLeft: 80, marginRight: 66 }}>
          {[0, 4, 8, 12, 16].map((v) => (
            <span key={v} className="absolute -translate-x-1/2" style={{ left: pct(v) }}>
              {v}
            </span>
          ))}
          <span className="absolute left-full ml-2 whitespace-nowrap">s</span>
        </div>
      </div>
      <p className="mt-2 min-h-[18px] font-sans text-[12px] text-ink-3">
        {active ? (
          <>
            {active.label}: <span className="font-mono tabular-nums text-ink-2">{active.s.toFixed(2)} s</span> per scene,{' '}
            <span className="font-mono tabular-nums text-ink-2">{active.success.toFixed(2)}%</span> success over all 2,000
          </>
        ) : (
          <>Mean policy seconds per scene, all 2,000 scenes</>
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-rule bg-surface-2/60 px-3.5 py-3">
          <div className="font-display text-[32px] font-semibold leading-none text-ink">−{Math.round(ROBOT.seconds.saving * 100)}%</div>
          <div className="mt-1.5 font-sans text-[12px] leading-snug text-ink-3">policy time per scene, against ME-Dex</div>
        </div>
        <div className="rounded-xl border border-rule bg-surface-2/60 px-3.5 py-3">
          <div className="font-display text-[32px] font-semibold leading-none text-ink">{ROBOT.seconds.successPerSecond.toFixed(2)}×</div>
          <div className="mt-1.5 font-sans text-[12px] leading-snug text-ink-3">success per policy-second, against ME-Dex</div>
        </div>
      </div>
      <p className="mt-3 font-sans text-[12px] leading-snug text-ink-3">
        Overall success <span className="font-mono tabular-nums text-ink-2">{ov.router.toFixed(2)}%</span> against{' '}
        <span className="font-mono tabular-nums text-ink-2">{ov.fixed.toFixed(2)}%</span> for ME-Dex,{' '}
        <span className="whitespace-nowrap font-mono tabular-nums text-ink-2">
          {sign(ov.diff)} [{sign(ov.ci[0])}, {sign(ov.ci[1])}]
        </span>
      </p>
    </div>
  );
}

function Results({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, '-60px', true);
  const on = reduced || seen;
  return (
    <div ref={ref} className="grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <SuccessChart on={on} instant={reduced} />
      <TimeChart on={on} instant={reduced} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function RobotScenes() {
  const reduced = useReducedMotion();
  return (
    <div>
      <SceneStream reduced={reduced} />
      <div className="my-7 h-px bg-rule" />
      <Results reduced={reduced} />
    </div>
  );
}
