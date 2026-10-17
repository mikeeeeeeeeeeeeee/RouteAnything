import { useMemo, useRef } from 'react';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { length, type Pt } from '@/lib/polyline';
import { tex } from '@/lib/tex';
import { FigTag, FlowEdge, FlowNode, Packet, type Tone } from './flow';

// Fig. 1 of the paper as a live loop: a task and the prior records reach the router, the router
// commits to a plan, the plan runs, its feedback updates the records, and the next round reads them.

const W = 820;
const H = 420;

type Id = 'task' | 'records' | 'router' | 'execute' | 'feedback' | 'update';

// captions sit inside the loop, the three questions outside it
const N: Record<Id, { x: number; y: number; r: number; pad?: number; label?: string; labelTex?: string; caption: { text?: string; tex?: string; at?: 'below' | 'above' | 'right' | 'left' } }> = {
  task: { x: 96, y: 100, r: 42, label: 'Task', caption: { text: 'state', tex: 'x_n', at: 'above' } },
  records: { x: 96, y: 318, r: 42, pad: 15, label: 'Records', caption: { text: 'prior', tex: 'I_n' } },
  router: { x: 318, y: 209, r: 58, labelTex: 'g(x_n,I_n)', caption: { text: 'router' } },
  execute: { x: 548, y: 100, r: 42, label: 'Execute', caption: { text: 'plan', tex: 'u_n' } },
  feedback: { x: 728, y: 209, r: 42, label: 'Feedback', caption: { tex: 'f_n', at: 'left' } },
  update: { x: 548, y: 318, r: 42, label: 'Update', caption: { tex: '\\operatorname{Upd}(\\cdot)', at: 'above' } },
};

function link(a: Id, b: Id): Pt[] {
  const A = N[a];
  const B = N[b];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const L = Math.hypot(dx, dy);
  const ra = A.r + (A.pad ?? 6);
  const rb = B.r + (B.pad ?? 6);
  return [
    [A.x + (dx / L) * ra, A.y + (dy / L) * ra],
    [B.x - (dx / L) * rb, B.y - (dy / L) * rb],
  ];
}

// the record store as a ring of slots around its node, one per round written
const SLOTS = 8;
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => `${(cx + r * Math.cos((a * Math.PI) / 180)).toFixed(2)} ${(cy + r * Math.sin((a * Math.PI) / 180)).toFixed(2)}`;
  return `M${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}`;
}

const EDGES: { id: string; from: Id; to: Id }[] = [
  { id: 'task-router', from: 'task', to: 'router' },
  { id: 'records-router', from: 'records', to: 'router' },
  { id: 'router-execute', from: 'router', to: 'execute' },
  { id: 'execute-feedback', from: 'execute', to: 'feedback' },
  { id: 'feedback-update', from: 'feedback', to: 'update' },
  { id: 'update-records', from: 'update', to: 'records' },
];

// one round (seconds); the next round starts so that its task meets the records at the router
type Step = { edge: string; dur: number } | { hold: Id; dur: number };
const ROUND: Step[] = [
  { edge: 'task-router', dur: 0.9 },
  { hold: 'router', dur: 0.35 },
  { edge: 'router-execute', dur: 0.8 },
  { hold: 'execute', dur: 0.35 },
  { edge: 'execute-feedback', dur: 0.75 },
  { hold: 'feedback', dur: 0.3 },
  { edge: 'feedback-update', dur: 0.75 },
  { hold: 'update', dur: 0.35 },
  { edge: 'update-records', dur: 0.95 },
  { hold: 'records', dur: 0.3 },
  { edge: 'records-router', dur: 0.9 },
];
const ROUND_LEN = ROUND.reduce((s, x) => s + x.dur, 0);
const PERIOD = ROUND_LEN - 0.9; // records arrive at the router with the next task

const QUESTIONS: { at: Id; n: string; label: string; dx: number; dy: number }[] = [
  { at: 'execute', n: '1', label: 'combine', dx: 0, dy: -72 },
  { at: 'feedback', n: '2', label: 'spend more', dx: 0, dy: 72 },
  { at: 'update', n: '3', label: 'remember', dx: 0, dy: 72 },
];

export function RouterLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '0px');
  const reduced = useReducedMotion();
  const [clock] = useClock(inView && !reduced);
  const t = reduced ? 3.1 : clock;

  const edges = useMemo(
    () =>
      Object.fromEntries(
        EDGES.map((e) => {
          const pts = link(e.from, e.to);
          return [e.id, { pts, L: length(pts) }];
        })
      ),
    []
  );

  const packets: { pts: Pt[]; s: number; color: string }[] = [];
  const pulse: Partial<Record<Id, number>> = {};
  let stage: Id | 'idle' = 'idle';
  let rounds = 0;
  const last = Math.floor(t / PERIOD);
  for (let j = Math.max(0, last - 2); j <= last; j++) {
    let at = j * PERIOD;
    if (t >= at + ROUND_LEN - 0.9 - 0.3) rounds = Math.max(rounds, j + 1);
    for (const st of ROUND) {
      const end = at + st.dur;
      if ('edge' in st) {
        if (t >= at && t < end) {
          const e = edges[st.edge];
          const u = (t - at) / st.dur;
          const eased = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          const memory = st.edge === 'records-router' || st.edge === 'update-records';
          packets.push({ pts: e.pts, s: eased * e.L + 12, color: memory ? 'var(--teal)' : 'var(--blue)' });
          if (st.edge !== 'records-router') stage = st.edge.split('-')[1] as Id;
        }
      } else if (t >= at && t < at + 0.8) {
        pulse[st.hold] = Math.max(pulse[st.hold] ?? 0, 1 - (t - at) / 0.8);
        if (t < end) stage = st.hold;
      }
      at = end;
    }
  }

  const hl = (body: string, on: boolean) => (on ? `\\htmlClass{eq-hl}{${body}}` : body);
  const eqG = `${hl('u_n', stage === 'execute')}=${hl('g', stage === 'router')}(${hl('x_n', stage === 'router')},\\,${hl('I_n', stage === 'router')})`;
  const eqU = `I_{n+1}=${hl('\\operatorname{Upd}', stage === 'update' || stage === 'records')}(I_n,x_n,${hl('u_n', stage === 'execute')},${hl('f_n', stage === 'feedback')})`;

  const tones: Partial<Record<Id, Tone>> = { router: 'accent' };

  return (
    <div ref={ref} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="The routing loop: a task and the prior records reach the router, which commits to a plan; the plan runs, feedback updates the records, and the next round reads them.">
        {EDGES.map((e, i) => (
          <FlowEdge key={e.id} pts={edges[e.id].pts} delay={0.1 + i * 0.08} />
        ))}
        {packets.map((p, i) => (
          <Packet key={i} pts={p.pts} s={p.s} len={24} color={p.color} />
        ))}

        {/* the three questions, pinned where they live in the loop */}
        {QUESTIONS.map((q) => {
          const n = N[q.at];
          const on = stage === q.at;
          const w = q.label.length * 7.6 + 40;
          const cx = n.x + q.dx;
          const cy = n.y + q.dy;
          return (
            <g key={q.n} opacity={on ? 1 : 0.72} style={{ transition: 'opacity .3s' }}>
              <rect x={cx - w / 2} y={cy - 13} width={w} height={26} rx={13} fill={on ? 'var(--ink)' : 'var(--surface)'} stroke={on ? 'var(--ink)' : 'var(--rule-2)'} style={{ transition: 'fill .3s, stroke .3s' }} />
              <text x={cx - w / 2 + 14} y={cy + 4.2} fontSize={11.5} fontWeight={700} fill={on ? 'var(--bg)' : 'var(--accent)'} style={{ fontFamily: 'var(--font-mono)' }}>
                {q.n}
              </text>
              <text x={cx - w / 2 + 28} y={cy + 4.2} fontSize={12.5} fill={on ? 'var(--bg)' : 'var(--ink-2)'} style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
                {q.label}
              </text>
            </g>
          );
        })}

        {(Object.keys(N) as Id[]).map((id) => {
          const n = N[id];
          return (
            <FlowNode
              key={id}
              x={n.x}
              y={n.y}
              r={n.r}
              label={n.label}
              labelTex={n.labelTex}
              caption={n.caption}
              size={id === 'router' ? 21 : 16.5}
              tone={tones[id] ?? 'idle'}
              pulse={pulse[id] ?? 0}
              pulseTone={id === 'records' ? 'teal' : 'blue'}
            />
          );
        })}

        {/* records written so far */}
        {Array.from({ length: SLOTS }).map((_, i) => {
          // slots fill clockwise; once full, each new record overwrites the oldest
          const span = 360 / SLOTS;
          const a0 = -90 + i * span + 4;
          const filled = i < Math.min(rounds, SLOTS);
          const age = rounds > 0 ? (((rounds - 1 - i) % SLOTS) + SLOTS) % SLOTS : 0;
          return (
            <path
              key={i}
              d={arc(N.records.x, N.records.y, N.records.r + 8, a0, a0 + span - 8)}
              fill="none"
              strokeWidth={filled && age === 0 ? 4.5 : 3}
              strokeLinecap="round"
              stroke={filled ? 'var(--teal)' : 'var(--line-soft)'}
              opacity={filled ? 1 - age * 0.08 : 1}
              style={{ transition: 'stroke .45s, stroke-width .45s, opacity .45s' }}
            />
          );
        })}
      </svg>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <EqChip label="choose a plan" html={tex(eqG, true)} />
        <EqChip label="update the records" html={tex(eqU, true)} />
      </div>
      <div className="mt-4">
        <FigTag>The routing loop · round {Math.max(1, last + 1)}</FigTag>
      </div>
    </div>
  );
}

function EqChip({ label, html }: { label: string; html: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rule bg-surface px-4 py-2">
      <span className="w-[104px] shrink-0 font-mono text-[10px] uppercase leading-tight tracking-[0.16em] text-ink-3">{label}</span>
      <div className="min-w-0 flex-1 overflow-x-auto text-ink no-scrollbar [&_.katex-display]:my-0" dangerouslySetInnerHTML={{ __html: html }} />
      <span className="num text-[12px] text-ink-4">(1)</span>
    </div>
  );
}
