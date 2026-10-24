import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { hash01, length, type Pt } from '@/lib/polyline';
import { GROUPS, MATRIX, POOLS, type PoolKey } from '@/data/results';
import { FigTag, FlowEdge, FlowNode, Packet } from './flow';
import { InputIcon, PoolIcon, type InputKind, type Pool } from './icons';

// The paper's Fig. 1a, live: for each input the router reads, it plays one arm from the pool for that
// output type, scoring arms by value minus priced cost. Packets are inputs; the mix of input kinds and
// the generation targets are schematic.

const W = 900;
const H = 470;
const R_IO = 34;
const R_ROUTER = 64;
const ROUTER: Pt = [445, 245];
const ROWS = [70, 157.5, 245, 332.5, 420];

const INPUTS: { key: InputKind; label: string; groups: string[] }[] = [
  { key: 'question', label: 'Question', groups: ['text'] },
  { key: 'image-question', label: 'Image + question', groups: ['imgqa'] },
  { key: 'task-files', label: 'Task + files', groups: ['agents'] },
  { key: 'prompt', label: 'Generation prompt', groups: ['imggen', 'video', 'speech'] },
  { key: 'cameras', label: 'Cameras + state', groups: ['robot'] },
];

const POOL_ICON: Record<PoolKey, Pool> = { lm: 'language', image: 'image', video: 'video', speech: 'speech', robot: 'robot' };
const POOL_ORDER: PoolKey[] = ['lm', 'image', 'video', 'speech', 'robot'];

const IN_X = 228;
const OUT_X = 662;
const inPos = (i: number): Pt => [IN_X, ROWS[i]];
const outPos = (i: number): Pt => [OUT_X, ROWS[i]];

function link(a: Pt, ra: number, b: Pt, rb: number): Pt[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  return [
    [a[0] + (dx / L) * (ra + 6), a[1] + (dy / L) * (ra + 6)],
    [b[0] - (dx / L) * (rb + 6), b[1] - (dy / L) * (rb + 6)],
  ];
}

const IN_EDGES = INPUTS.map((_, i) => link(inPos(i), R_IO, ROUTER, R_ROUTER));
const OUT_EDGES = POOL_ORDER.map((_, i) => link(ROUTER, R_ROUTER, outPos(i), R_IO));
const IN_L = IN_EDGES.map((e) => length(e));
const OUT_L = OUT_EDGES.map((e) => length(e));

// one input every SPAWN seconds: in, read, out
const SPAWN = 0.95;
const LEG_IN = 0.85;
const READ = 0.28;
const LEG_OUT = 0.85;

/** which input kind arrives j-th, and which pool it is sent to */
function job(j: number): { input: number; pool: number } {
  const u = hash01(j, 5);
  // roughly the matrix's mix: questions most often, robot scenes regularly
  const input = u < 0.26 ? 0 : u < 0.42 ? 1 : u < 0.58 ? 2 : u < 0.84 ? 3 : 4;
  if (input <= 2) return { input, pool: 0 };
  if (input === 4) return { input, pool: 4 };
  const g = hash01(j, 9);
  return { input, pool: g < 0.5 ? 1 : g < 0.78 ? 2 : 3 };
}

export function OmniRouter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '0px');
  const reduced = useReducedMotion();
  const [clock] = useClock(inView && !reduced);
  const t = reduced ? 3.3 : clock;
  const [hover, setHover] = useState<{ side: 'in' | 'out'; i: number } | null>(null);

  const poolArms = useMemo(() => Object.fromEntries(POOLS.map((p) => [p.key, p])), []);

  const packets: { pts: Pt[]; s: number; color: string }[] = [];
  const inPulse: number[] = INPUTS.map(() => 0);
  const outPulse: number[] = POOL_ORDER.map(() => 0);
  let routerPulse = 0;
  let routed = 0;
  const last = Math.floor(t / SPAWN);
  for (let j = Math.max(0, last - 4); j <= last; j++) {
    const t0 = j * SPAWN;
    const { input, pool } = job(j);
    const a = t - t0;
    if (a >= 0 && a < 0.5) inPulse[input] = Math.max(inPulse[input], 1 - a / 0.5);
    if (a >= 0 && a < LEG_IN) {
      const u = a / LEG_IN;
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      packets.push({ pts: IN_EDGES[input], s: e * IN_L[input] + 10, color: 'var(--blue)' });
    }
    const r = a - LEG_IN;
    if (r >= 0 && r < 0.7) routerPulse = Math.max(routerPulse, 1 - r / 0.7);
    const o = a - LEG_IN - READ;
    if (o >= 0 && o < LEG_OUT) {
      const u = o / LEG_OUT;
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      packets.push({ pts: OUT_EDGES[pool], s: e * OUT_L[pool] + 10, color: 'var(--blue)' });
    }
    const d = o - LEG_OUT;
    if (d >= 0 && d < 0.7) outPulse[pool] = Math.max(outPulse[pool], 1 - d / 0.7);
  }
  routed = Math.max(0, Math.floor((t - LEG_IN - READ - LEG_OUT) / SPAWN) + 1);

  const hoverCard = (() => {
    if (!hover) return null;
    if (hover.side === 'in') {
      const inp = INPUTS[hover.i];
      const groups = GROUPS.filter((g) => inp.groups.includes(g.key));
      return {
        at: inPos(hover.i),
        side: 'in' as const,
        title: inp.label,
        lines: groups.map((g) => `${g.label}: ${g.benchmarks.join(', ')}`),
      };
    }
    const p = poolArms[POOL_ORDER[hover.i]];
    return { at: outPos(hover.i), side: 'out' as const, title: `${p.label} · ${p.arms.length}`, lines: [p.arms.join(', '), ...(p.note ? [p.note] : [])] };
  })();

  return (
    <div ref={ref} className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="One router reads five kinds of input (a question, an image with a question, a task with files, a generation prompt, camera frames with a robot state) and sends each to one arm from the pool for its output type: language models, image, video or speech generators, or robot policies."
      >
        {IN_EDGES.map((e, i) => (
          <FlowEdge key={`in-${i}`} pts={e} delay={0.1 + i * 0.06} />
        ))}
        {OUT_EDGES.map((e, i) => (
          <FlowEdge key={`out-${i}`} pts={e} delay={0.45 + i * 0.06} />
        ))}
        {packets.map((p, i) => (
          <Packet key={i} pts={p.pts} s={p.s} len={22} color={p.color} />
        ))}

        {/* column heads */}
        <text x={IN_X} y={20} textAnchor="middle" fontSize={11} letterSpacing={2} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
          WHAT THE ROUTER READS
        </text>
        <text x={OUT_X} y={20} textAnchor="middle" fontSize={11} letterSpacing={2} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
          ARM POOLS
        </text>

        {INPUTS.map((inp, i) => {
          const [x, y] = inPos(i);
          const on = hover?.side === 'in' && hover.i === i;
          return (
            <g key={inp.key} onMouseEnter={() => setHover({ side: 'in', i })} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
              <circle cx={x} cy={y} r={R_IO + 12} fill="transparent" />
              <FlowNode x={x} y={y} r={R_IO} caption={{ text: inp.label, at: 'left' }} pulse={inPulse[i]} tone={on ? 'blue' : 'idle'} />
              <InputIcon kind={inp.key} x={x} y={y} color={on || inPulse[i] > 0.5 ? 'var(--blue)' : 'var(--ink-2)'} />
            </g>
          );
        })}

        <FlowNode x={ROUTER[0]} y={ROUTER[1]} r={R_ROUTER} labelTex="g(s)" size={27} tone="accent" pulse={routerPulse} pulseTone="blue" caption={{ text: 'plays', tex: '\\arg\\max_u v-\\lambda c' }} />

        {POOL_ORDER.map((k, i) => {
          const [x, y] = outPos(i);
          const p = poolArms[k];
          const on = hover?.side === 'out' && hover.i === i;
          return (
            <g key={k} onMouseEnter={() => setHover({ side: 'out', i })} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
              <circle cx={x} cy={y} r={R_IO + 12} fill="transparent" />
              <FlowNode x={x} y={y} r={R_IO} caption={{ text: `${p.label} ×${p.arms.length}`, at: 'right' }} pulse={outPulse[i]} pulseTone="teal" tone={on ? 'blue' : 'idle'} />
              <PoolIcon pool={POOL_ICON[k]} x={x} y={y} color={on || outPulse[i] > 0.5 ? 'var(--teal)' : 'var(--ink-2)'} />
            </g>
          );
        })}
      </svg>

      {hoverCard && (
        <div
          className="pointer-events-none absolute z-10 w-[min(300px,70%)]"
          style={{
            left: `${((hoverCard.side === 'in' ? hoverCard.at[0] + R_IO + 16 : hoverCard.at[0] - R_IO - 16) / W) * 100}%`,
            top: `${(hoverCard.at[1] / H) * 100}%`,
            transform: `translate(${hoverCard.side === 'in' ? '0' : '-100%'}, -50%)`,
          }}
        >
          <motion.div
            key={`${hover?.side}-${hover?.i}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="rounded-2xl border border-rule bg-surface/95 p-3.5 shadow-[var(--shadow-lg)] backdrop-blur-md"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{hoverCard.title}</div>
            {hoverCard.lines.map((l) => (
              <p key={l} className="mt-1.5 font-serif text-[13px] leading-snug text-ink-2">
                {l}
              </p>
            ))}
          </motion.div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <FigTag>One router · every output type</FigTag>
        <span className="font-mono text-[11.5px] tabular-nums text-ink-3">
          {MATRIX.benchmarks} benchmarks · {MATRIX.runs.toLocaleString('en-US')} scored runs · {MATRIX.armVersions} arm versions
          <span className="text-ink-4"> · {routed} routed here</span>
        </span>
      </div>
    </div>
  );
}
