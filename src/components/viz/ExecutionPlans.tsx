import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { hash01, length, type Pt } from '@/lib/polyline';
import { tex } from '@/lib/tex';
import { FigTag, FlowEdge, FlowNode, Packet, type Tone } from './flow';
import { TexLabel } from './svg';

// A candidate can be a whole execution plan: one call, a cascade that verifies a cheap primary and falls
// back to the reference, or a plan that retries after a failure and shows the retry the failing
// tests. Packets are tasks; the verifier accepts about three in five, the tests pass about half.

const W = 900;
const H = 440;
const R = 46;

type Mode = 'direct' | 'cascade' | 'retry';
type NodeId = 'task' | 'm1' | 'gate' | 'answer' | 'ref' | 'retry';

interface NodeSpec {
  x: number;
  y: number;
  label: string;
  caption: { text?: string; tex?: string; at?: 'below' | 'right' | 'left' | 'above' };
}

const LAYOUT: Record<Mode, Partial<Record<NodeId, NodeSpec>>> = {
  direct: {
    task: { x: 150, y: 215, label: 'Task', caption: { text: 'state', tex: 'x' } },
    m1: { x: 450, y: 215, label: 'Model', caption: { text: 'one call' } },
    answer: { x: 760, y: 215, label: 'Answer', caption: { text: 'value', tex: 'V' } },
  },
  cascade: {
    task: { x: 105, y: 245, label: 'Task', caption: { text: 'state', tex: 'x' } },
    m1: { x: 290, y: 245, label: 'Primary', caption: { text: 'cost', tex: 'A' } },
    gate: { x: 475, y: 245, label: 'Verify', caption: { tex: 'H\\in\\{0,1\\}' } },
    answer: { x: 770, y: 96, label: 'Answer', caption: { text: 'value', tex: 'V', at: 'right' } },
    ref: { x: 770, y: 360, label: 'Reference', caption: { text: 'pay', tex: 'C_B', at: 'right' } },
  },
  retry: {
    task: { x: 105, y: 245, label: 'Task', caption: { text: 'state', tex: 'x' } },
    m1: { x: 290, y: 245, label: 'Attempt', caption: { text: 'cost', tex: 'a_1' } },
    gate: { x: 475, y: 245, label: 'Tests', caption: { tex: 'H\\in\\{0,1\\}' } },
    answer: { x: 770, y: 96, label: 'Answer', caption: { text: 'value', tex: 'V', at: 'right' } },
    retry: { x: 770, y: 360, label: 'Retry', caption: { text: 'cost', tex: 'a_2', at: 'right' } },
  },
};

const MODES: { key: Mode; label: string }[] = [
  { key: 'direct', label: 'Direct dispatch' },
  { key: 'cascade', label: 'Verified cascade' },
  { key: 'retry', label: 'Retry with feedback' },
];

const C45 = Math.SQRT1_2;

/** polyline between two circles: straight, or leaving at 45 degrees and arriving level (or the reverse) */
function connect(a: NodeSpec, b: NodeSpec, kind: 'straight' | 'diag-flat' | 'flat-diag' | 'vertical'): Pt[] {
  const sx = Math.sign(b.x - a.x) || 1;
  const sy = Math.sign(b.y - a.y) || 1;
  if (kind === 'straight') {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    return [
      [a.x + (dx / L) * R, a.y + (dy / L) * R],
      [b.x - (dx / L) * R, b.y - (dy / L) * R],
    ];
  }
  if (kind === 'vertical') return [
    [a.x, a.y + sy * R],
    [b.x, b.y - sy * R],
  ];
  if (kind === 'diag-flat') {
    const s: Pt = [a.x + sx * R * C45, a.y + sy * R * C45];
    const cx = s[0] + sx * Math.abs(b.y - s[1]);
    return [s, [cx, b.y], [b.x - sx * R, b.y]];
  }
  const e: Pt = [b.x - sx * R * C45, b.y - sy * R * C45];
  const cx = e[0] - sx * Math.abs(e[1] - a.y);
  return [[a.x + sx * R, a.y], [cx, a.y], e];
}

type EdgeSpec = { id: string; from: NodeId; to: NodeId; kind: 'straight' | 'diag-flat' | 'flat-diag' | 'vertical'; label?: string };

const EDGES: Record<Mode, EdgeSpec[]> = {
  direct: [
    { id: 'task-m1', from: 'task', to: 'm1', kind: 'straight' },
    { id: 'm1-answer', from: 'm1', to: 'answer', kind: 'straight' },
  ],
  cascade: [
    { id: 'task-m1', from: 'task', to: 'm1', kind: 'straight' },
    { id: 'm1-gate', from: 'm1', to: 'gate', kind: 'straight' },
    { id: 'gate-answer', from: 'gate', to: 'answer', kind: 'straight', label: 'accept' },
    { id: 'gate-ref', from: 'gate', to: 'ref', kind: 'diag-flat', label: 'fall back' },
    { id: 'ref-answer', from: 'ref', to: 'answer', kind: 'vertical' },
  ],
  retry: [
    { id: 'task-m1', from: 'task', to: 'm1', kind: 'straight' },
    { id: 'm1-gate', from: 'm1', to: 'gate', kind: 'straight' },
    { id: 'gate-answer', from: 'gate', to: 'answer', kind: 'straight', label: 'accept' },
    { id: 'gate-retry', from: 'gate', to: 'retry', kind: 'diag-flat', label: 'retry' },
    { id: 'retry-answer', from: 'retry', to: 'answer', kind: 'vertical' },
  ],
};

const SPAWN: Record<Mode, number> = { direct: 1.05, cascade: 1.25, retry: 1.25 };
const HOLD = 0.24;
const ACCEPT = 0.6;
const PASS = 0.5;
const LEAD = 0.85; // edges draw in before the first packet

type Step = { edge: string; dur: number } | { hold: NodeId; dur: number; tone?: Tone };

function travel(L: number) {
  return Math.min(1.05, Math.max(0.42, L / 300));
}

export function ExecutionPlans() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '0px');
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>('cascade');
  const [hoverTab, setHoverTab] = useState<Mode | null>(null);
  const [t, reset] = useClock(inView && !reduced);
  const now = reduced ? 3.2 : t;

  const layout = LAYOUT[mode];
  const edges = useMemo(
    () =>
      EDGES[mode].map((e) => {
        const pts = connect(layout[e.from]!, layout[e.to]!, e.kind);
        return { ...e, pts, L: length(pts) };
      }),
    [mode, layout]
  );
  const edgeById = useMemo(() => Object.fromEntries(edges.map((e) => [e.id, e])), [edges]);

  // the steps one task takes, for task number j
  const tracks = (j: number): Step[][] => {
    const E = (id: string) => ({ edge: id, dur: travel(edgeById[id].L) });
    if (mode === 'direct') return [[E('task-m1'), { hold: 'm1', dur: HOLD }, E('m1-answer'), { hold: 'answer', dur: 0.1 }]];
    if (mode === 'cascade') {
      const ok = hash01(j, 7) < ACCEPT;
      return [
        ok
          ? [E('task-m1'), { hold: 'm1', dur: HOLD }, E('m1-gate'), { hold: 'gate', dur: HOLD, tone: 'teal' }, E('gate-answer'), { hold: 'answer', dur: 0.1 }]
          : [
              E('task-m1'),
              { hold: 'm1', dur: HOLD },
              E('m1-gate'),
              { hold: 'gate', dur: HOLD, tone: 'coral' },
              E('gate-ref'),
              { hold: 'ref', dur: HOLD, tone: 'amber' },
              E('ref-answer'),
              { hold: 'answer', dur: 0.1 },
            ],
      ];
    }
    // retry: a failed first attempt is tried again, and the retry sees the failing tests
    const pass = hash01(j, 11) < PASS;
    return [
      pass
        ? [E('task-m1'), { hold: 'm1', dur: HOLD }, E('m1-gate'), { hold: 'gate', dur: HOLD, tone: 'teal' }, E('gate-answer'), { hold: 'answer', dur: 0.1 }]
        : [
            E('task-m1'),
            { hold: 'm1', dur: HOLD },
            E('m1-gate'),
            { hold: 'gate', dur: HOLD, tone: 'coral' },
            E('gate-retry'),
            { hold: 'retry', dur: HOLD, tone: 'blue' },
            E('retry-answer'),
            { hold: 'answer', dur: 0.1 },
          ],
    ];
  };

  // walk every live task to find packets and node pulses
  const packets: { pts: Pt[]; s: number; color: string }[] = [];
  const pulses: Partial<Record<NodeId, { p: number; tone: Tone }>> = {};
  const badges: { node: NodeId; ok: boolean; p: number }[] = [];
  let delivered = 0;
  let fallbacks = 0;
  const local = now - LEAD;
  if (local > 0) {
    const first = Math.max(0, Math.floor((local - 7) / SPAWN[mode]));
    const last = Math.floor(local / SPAWN[mode]);
    for (let j = first; j <= last; j++) {
      const t0 = j * SPAWN[mode];
      for (const steps of tracks(j)) {
        let at = t0;
        for (const st of steps) {
          const end = at + st.dur;
          if ('edge' in st) {
            if (local >= at && local < end) {
              const e = edgeById[st.edge];
              const u = (local - at) / st.dur;
              const eased = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
              packets.push({ pts: e.pts, s: eased * e.L + 10, color: st.edge.startsWith('ref') || st.edge === 'gate-ref' ? 'var(--amber)' : st.edge === 'gate-retry' || st.edge === 'retry-answer' ? 'var(--teal)' : 'var(--blue)' });
            }
          } else if (local >= at && local < at + 0.75) {
            const p = 1 - (local - at) / 0.75;
            const prev = pulses[st.hold];
            if (!prev || prev.p < p) pulses[st.hold] = { p, tone: st.tone ?? 'blue' };
            if (st.hold === 'gate' && mode !== 'direct') badges.push({ node: 'gate', ok: st.tone === 'teal', p });
          }
          at = end;
        }
      }
    }
    // running tallies over the tasks that have finished
    const done = Math.max(0, Math.floor((local - 3.4) / SPAWN[mode]) + 1);
    delivered = done;
    if (mode === 'cascade') for (let j = 0; j < done; j++) if (hash01(j, 7) >= ACCEPT) fallbacks++;
    if (mode === 'retry') for (let j = 0; j < done; j++) if (hash01(j, 11) >= PASS) fallbacks++;
  }

  const select = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    reset(0);
  };

  const formula: Record<Mode, string> = {
    direct: 'V=Y_M,\\qquad D=C_M',
    cascade: 'V=H\\,Y_P+(1-H)\\,Y_B,\\qquad D=A+(1-H)\\,C_B',
    retry: 'V=H\\,Y_1+(1-H)\\,Y_2,\\qquad D=a_1+(1-H)\\,a_2',
  };
  const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
  const tally: Record<Mode, string> = {
    direct: `${n(delivered, 'task')} · ${n(delivered, 'call')}`,
    cascade: `${n(delivered, 'task')} · ${n(delivered, 'primary call')} · ${n(fallbacks, 'reference call')}`,
    retry: `${n(delivered, 'task')} · ${n(delivered, 'first attempt')} · ${n(fallbacks, 'retry', 'retries')}`,
  };
  const smearTarget = hoverTab ?? mode;

  return (
    <div ref={ref} className="overflow-hidden rounded-[18px] border border-rule bg-surface-2/50">
      {/* tabs */}
      <LayoutGroup id="plans">
        <div className="relative flex border-b border-rule" role="tablist" aria-label="Execution plan" onMouseLeave={() => setHoverTab(null)}>
          {MODES.map((m) => {
            const active = m.key === mode;
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => select(m.key)}
                onMouseEnter={() => setHoverTab(m.key)}
                className={`relative min-w-0 flex-1 border-r border-rule px-4 py-4 font-sans text-[15px] transition-colors sm:flex-none sm:px-8 ${active ? 'text-accent' : 'text-ink-3 hover:text-ink-2'}`}
              >
                {active && <motion.span layoutId="plan-tab-bg" className="absolute inset-0 bg-accent-wash/60" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
                {smearTarget === m.key && (
                  <motion.span
                    layoutId="plan-tab-smear"
                    className="pointer-events-none absolute bottom-[-3px] left-1/2 h-[9px] w-[70%] -translate-x-1/2 rounded-full opacity-50 blur-[6px]"
                    style={{ background: 'linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 55%, transparent), transparent)' }}
                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  />
                )}
                <span className="relative whitespace-nowrap">{m.label}</span>
                {active && <motion.span layoutId="plan-tab-underline" className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-accent" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
              </button>
            );
          })}
          <div className="hidden flex-1 sm:block" />
        </div>
      </LayoutGroup>

      {/* diagram */}
      <div className="relative px-2 pb-2 pt-4 md:px-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${MODES.find((m) => m.key === mode)!.label}: tasks flow from the task through the plan to an answer.`}>
          <AnimatePresence>
            {edges.map((e, i) => (
              <FlowEdge key={`${mode}-${e.id}`} pts={e.pts} delay={0.12 + i * 0.07} />
            ))}
          </AnimatePresence>
          {edges
            .filter((e) => e.label)
            .map((e) => {
              const p = e.pts.length === 2 ? [(e.pts[0][0] + e.pts[1][0]) / 2, (e.pts[0][1] + e.pts[1][1]) / 2] : e.pts[1];
              const up = e.id === 'gate-answer';
              return (
                <motion.g key={`${mode}-${e.id}-label`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                  <TexLabel
                    x={p[0] + (up ? -14 : mode === 'retry' ? -12 : 18)}
                    y={p[1] + (up ? -14 : 18)}
                    t={up ? 'H=1' : mode === 'retry' ? 'H=0,\\ \\text{with the failing tests}' : 'H=0'}
                    anchor={up || mode === 'retry' ? 'end' : 'start'}
                    size={14}
                    color={up ? 'var(--teal)' : mode === 'retry' ? 'var(--ink-2)' : 'var(--amber)'}
                    w={up ? 60 : 180}
                  />
                </motion.g>
              );
            })}

          {packets.map((p, i) => (
            <Packet key={i} pts={p.pts} s={p.s} len={24} color={p.color} />
          ))}

          <AnimatePresence>
            {(['task', 'm1', 'gate', 'answer', 'ref', 'retry'] as NodeId[]).map((id) => {
              const spec = layout[id];
              if (!spec) return null;
              const pulse = pulses[id];
              return (
                <motion.g
                  key={id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.18 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  <FlowNode
                    x={spec.x}
                    y={spec.y}
                    r={R}
                    label={spec.label}
                    caption={spec.caption}
                    size={id === 'ref' ? 17 : 19}
                    pulse={pulse?.p ?? 0}
                    pulseTone={pulse?.tone}
                    tone={pulse && pulse.p > 0.55 && pulse.tone !== 'blue' ? pulse.tone : 'idle'}
                  />
                </motion.g>
              );
            })}
          </AnimatePresence>

          {badges.map((b, i) => {
            const spec = layout[b.node]!;
            return (
              <g key={i} transform={`translate(${spec.x + R * 0.78} ${spec.y - R * 0.78}) scale(${0.6 + 0.4 * Math.min(1, (1 - b.p) * 5)})`} opacity={Math.min(1, b.p * 2.4)}>
                <circle r={11} fill={b.ok ? 'var(--teal)' : 'var(--coral)'} />
                <text y={4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff" style={{ fontFamily: 'var(--font-sans)' }}>
                  {b.ok ? '✓' : '✗'}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-3 pb-3 md:px-5">
          <FigTag>Conceptual execution plan</FigTag>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-mono text-[11.5px] tabular-nums text-ink-3">{tally[mode]}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="rounded-full border border-rule bg-surface px-4 py-1.5 text-[14px] text-ink"
                dangerouslySetInnerHTML={{ __html: tex(formula[mode]) }}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
