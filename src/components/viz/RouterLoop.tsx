import { useMemo, useRef } from 'react';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { tex } from '@/lib/tex';

// Fig. 1a of the paper as a live loop: a task arrives, the router picks a plan from the state and
// its records, the plan runs, feedback updates the records, and the next round sees them.

type Pt = [number, number];
const VW = 780;
const VH = 340;

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sym: string;
  strong?: boolean;
}

const BOXES: Box[] = [
  { id: 'task', x: 18, y: 36, w: 158, h: 70, title: 'Task + history', sym: 'x_n' },
  { id: 'rec', x: 18, y: 224, w: 158, h: 70, title: 'Prior records', sym: 'I_n' },
  { id: 'router', x: 272, y: 118, w: 170, h: 92, title: 'Router', sym: 'g(\\cdot,\\cdot)', strong: true },
  { id: 'exec', x: 548, y: 36, w: 210, h: 88, title: 'Execution', sym: '\\text{models / tools + rule}' },
  { id: 'fb', x: 588, y: 224, w: 170, h: 70, title: 'Feedback', sym: 'f_n' },
  { id: 'upd', x: 290, y: 224, w: 150, h: 70, title: 'Update', sym: '\\operatorname{Upd}(\\cdot)' },
];
const B = Object.fromEntries(BOXES.map((b) => [b.id, b])) as Record<string, Box>;
const right = (b: Box): Pt => [b.x + b.w, b.y + b.h / 2];
const left = (b: Box): Pt => [b.x, b.y + b.h / 2];
const top = (b: Box): Pt => [b.x + b.w / 2, b.y];

// the cycle the token follows (orthogonal polyline)
const CYCLE: { pts: Pt[]; stage: string }[] = [
  { pts: [right(B.router), [510, right(B.router)[1]], [510, left(B.exec)[1]], left(B.exec)], stage: 'plan' },
  { pts: [[B.fb.x + B.fb.w / 2, B.exec.y + B.exec.h], top(B.fb)], stage: 'run' },
  { pts: [left(B.fb), right(B.upd)], stage: 'feedback' },
  { pts: [left(B.upd), right(B.rec)], stage: 'update' },
  { pts: [top(B.rec), [top(B.rec)[0], 192], [B.router.x, 192]], stage: 'recall' },
];

const ARRIVAL: Pt[] = [right(B.task), [232, right(B.task)[1]], [232, 136], [B.router.x, 136]];

const segLen = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function along(pts: Pt[], f: number): Pt {
  const total = segLen(pts);
  let d = Math.max(0, Math.min(1, f)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= l) return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l];
    d -= l;
  }
  return pts[pts.length - 1];
}
const pathD = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');

// timeline of one round (seconds)
const T_ARRIVE = 0.9;
const T_THINK = 0.55;
const SEG = [1.0, 0.7, 0.85, 1.0, 0.95];
const ROUND = T_ARRIVE + T_THINK + SEG.reduce((a, b) => a + b, 0) + 0.25;

const QUESTIONS = [
  { at: 'exec', n: '1', label: 'combine', dx: 0, dy: -16 },
  { at: 'fb', n: '2', label: 'spend more', dx: 0, dy: 82 },
  { at: 'upd', n: '3', label: 'remember', dx: 0, dy: 82 },
];

export function RouterLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '0px');
  const reduced = useReducedMotion();
  const [t] = useClock(inView && !reduced);

  const round = Math.floor(t / ROUND);
  const local = reduced ? T_ARRIVE + T_THINK + 0.5 : t % ROUND;

  // where is the token, and which stage is live
  const { token, stage, arriving } = useMemo(() => {
    if (local < T_ARRIVE) return { token: along(ARRIVAL, local / T_ARRIVE), stage: 'arrive', arriving: true };
    if (local < T_ARRIVE + T_THINK) return { token: [B.router.x + B.router.w / 2, B.router.y + B.router.h / 2] as Pt, stage: 'think', arriving: false };
    let u = local - T_ARRIVE - T_THINK;
    for (let i = 0; i < CYCLE.length; i++) {
      if (u < SEG[i]) return { token: along(CYCLE[i].pts, u / SEG[i]), stage: CYCLE[i].stage, arriving: false };
      u -= SEG[i];
    }
    return { token: [B.router.x, 192] as Pt, stage: 'recall', arriving: false };
  }, [local]);

  const lit = (id: string) =>
    (id === 'task' && stage === 'arrive') ||
    (id === 'router' && (stage === 'think' || stage === 'recall')) ||
    (id === 'exec' && stage === 'plan') ||
    (id === 'fb' && stage === 'run') ||
    (id === 'upd' && stage === 'feedback') ||
    (id === 'rec' && (stage === 'update' || stage === 'recall'));

  const records = Math.min(4, round + (stage === 'update' || stage === 'recall' ? 1 : 0));

  const eqG = `u_n = ${hl('g', stage === 'think')}(${hl('x_n', stage === 'arrive' || stage === 'think')},\\, ${hl('I_n', stage === 'recall' || stage === 'think')})`;
  const eqU = `I_{n+1} = ${hl('\\operatorname{Upd}', stage === 'feedback' || stage === 'update')}(I_n, x_n, ${hl('u_n', stage === 'plan')}, ${hl('f_n', stage === 'run' || stage === 'feedback')})`;

  return (
    <div ref={ref} className="w-full">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="The router loop: a task and the prior records feed the router, which chooses an execution plan; execution returns feedback, which updates the records for the next round.">
        <defs>
          <marker id="rl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 z" fill="var(--ink-3)" />
          </marker>
          <radialGradient id="rl-token">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* edges */}
        <g fill="none" stroke="var(--ink-4)" strokeWidth={1.4}>
          <path d={pathD(ARRIVAL)} markerEnd="url(#rl-arrow)" />
          {CYCLE.map((c, i) => (
            <path key={i} d={pathD(c.pts)} markerEnd="url(#rl-arrow)" />
          ))}
        </g>
        {/* the live edge, drawn over */}
        {stage !== 'think' && (
          <path
            d={pathD(arriving ? ARRIVAL : CYCLE.find((c) => c.stage === stage)?.pts ?? [])}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={0.85}
          />
        )}

        {/* edge labels */}
        <EdgeLabel x={476} y={right(B.router)[1] - 12} t="u_n" on={stage === 'plan'} />
        <EdgeLabel x={B.fb.x + B.fb.w / 2 + 14} y={(B.exec.y + B.exec.h + B.fb.y) / 2 + 4} t="f_n" on={stage === 'run'} anchor="start" />
        <EdgeLabel x={(B.rec.x + B.rec.w + B.upd.x) / 2} y={left(B.upd)[1] - 14} t="I_{n+1}" on={stage === 'update'} />
        <EdgeLabel x={(B.upd.x + B.upd.w + B.fb.x) / 2} y={left(B.fb)[1] - 14} t="f_n" on={stage === 'feedback'} />

        {/* boxes */}
        {BOXES.map((b) => {
          const on = lit(b.id);
          return (
            <g key={b.id}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={14}
                fill={b.strong ? 'var(--accent-wash)' : 'var(--surface)'}
                stroke={on ? 'var(--accent)' : b.strong ? 'color-mix(in oklab, var(--accent) 45%, transparent)' : 'var(--rule-2)'}
                strokeWidth={on ? 2 : 1.2}
                style={{ transition: 'stroke .3s, stroke-width .3s' }}
              />
              <text x={b.x + b.w / 2} y={b.y + (b.id === 'exec' ? 32 : b.h / 2 - 4)} textAnchor="middle" fill="var(--ink)" fontSize={b.strong ? 18 : 15} fontWeight={b.strong ? 650 : 550} style={{ fontFamily: 'var(--font-sans)' }}>
                {b.title}
              </text>
              <foreignObject x={b.x} y={b.y + (b.id === 'exec' ? 40 : b.h / 2 + 2)} width={b.w} height={30}>
                <div className="text-center text-[15px] leading-none text-ink-2" dangerouslySetInnerHTML={{ __html: tex(b.sym) }} />
              </foreignObject>
            </g>
          );
        })}

        {/* records list grows round by round */}
        <g>
          {Array.from({ length: 4 }).map((_, i) => (
            <rect
              key={i}
              x={B.rec.x + 14 + i * 34}
              y={B.rec.y + B.rec.h + 10}
              width={28}
              height={6}
              rx={3}
              fill={i < records ? 'var(--teal)' : 'var(--rule)'}
              style={{ transition: 'fill .4s' }}
            />
          ))}
          <text x={B.rec.x + 14} y={B.rec.y + B.rec.h + 32} fill="var(--ink-3)" fontSize={11} style={{ fontFamily: 'var(--font-mono)' }}>
            records written: {records}
          </text>
        </g>

        {/* the three questions, pinned where they live in the loop */}
        {QUESTIONS.map((q) => {
          const b = B[q.at];
          const on = (q.at === 'exec' && stage === 'plan') || (q.at === 'fb' && stage === 'run') || (q.at === 'upd' && (stage === 'feedback' || stage === 'update'));
          const cx = b.x + b.w / 2 + q.dx;
          const cy = b.y + q.dy;
          const w = q.label.length * 7.4 + 34;
          return (
            <g key={q.n} style={{ transition: 'opacity .3s' }} opacity={on ? 1 : 0.62}>
              <rect x={cx - w / 2} y={cy - 12} width={w} height={22} rx={11} fill={on ? 'var(--ink)' : 'var(--surface)'} stroke={on ? 'var(--ink)' : 'var(--rule-2)'} />
              <text x={cx - w / 2 + 12} y={cy + 3.5} fill={on ? 'var(--bg)' : 'var(--accent)'} fontSize={11} fontWeight={700} style={{ fontFamily: 'var(--font-mono)' }}>
                {q.n}
              </text>
              <text x={cx - w / 2 + 24} y={cy + 3.5} fill={on ? 'var(--bg)' : 'var(--ink-2)'} fontSize={12} style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
                {q.label}
              </text>
            </g>
          );
        })}

        {/* token */}
        <g transform={`translate(${token[0]},${token[1]})`}>
          <circle r={16} fill="url(#rl-token)" />
          <circle r={5.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
        </g>

        {/* round counter */}
        <text x={B.router.x + B.router.w / 2} y={B.router.y - 14} textAnchor="middle" fill="var(--ink-3)" fontSize={11} style={{ fontFamily: 'var(--font-mono)' }}>
          round n = {round + 1}
        </text>
      </svg>

      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
        <EqChip label="choose a plan" html={tex(eqG, true)} n="1" />
        <EqChip label="update the records" html={tex(eqU, true)} n="1" />
      </div>
    </div>
  );
}

function hl(body: string, on: boolean) {
  return on ? `\\htmlClass{eq-hl}{${body}}` : body;
}

function EdgeLabel({ x, y, t, on, anchor = 'middle' }: { x: number; y: number; t: string; on: boolean; anchor?: 'start' | 'middle' }) {
  return (
    <foreignObject x={anchor === 'middle' ? x - 40 : x} y={y - 16} width={80} height={24}>
      <div
        className={`text-[15px] leading-none transition-colors duration-300 ${anchor === 'middle' ? 'text-center' : 'text-left'} ${on ? 'text-accent' : 'text-ink-3'}`}
        dangerouslySetInnerHTML={{ __html: tex(t) }}
      />
    </foreignObject>
  );
}

function EqChip({ label, html, n }: { label: string; html: string; n: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rule bg-surface-2 px-4 py-2">
      <span className="smallcaps w-[112px] shrink-0 text-[10px] leading-tight text-ink-3">{label}</span>
      <div className="min-w-0 flex-1 overflow-x-auto text-ink no-scrollbar [&_.katex-display]:my-0" dangerouslySetInnerHTML={{ __html: html }} />
      <span className="num text-[12px] text-ink-4">({n})</span>
    </div>
  );
}
