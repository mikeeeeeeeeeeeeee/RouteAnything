import { useEffect, useMemo, useRef, useState } from 'react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import Counter from '@/components/reactbits/Counter/Counter';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { bend, hash01, length, trim, type Pt } from '@/lib/polyline';
import { tex } from '@/lib/tex';
import { useTokens } from '@/theme/tokens';
import { FigTag, FlowEdge, FlowNode, Packet, type Tone } from './flow';
import { mono } from './svg';

// Eq. (3) acted out. Every task pays the primary's cost A; a rejected one also pays C_B and gets the
// reference's answer. V - Y_B = H (Y_P - Y_B), so quality is lost only through false accepts.
// Illustration: the reference is right on every task, the primary on 45%, A = 0.1 C_B.

const VW = 840;
const VH = 330;
const R = 40;
const P_RIGHT = 0.45;
const A = 0.1;
const INTERVAL = 0.42;
const LEG = 0.62;
const TRAVEL = LEG * 3 + 0.2;

const VERIFIERS = {
  lenient: { tpr: 0.97, fpr: 0.35, label: 'Lenient' },
  balanced: { tpr: 0.9, fpr: 0.15, label: 'Balanced' },
  strict: { tpr: 0.7, fpr: 0.03, label: 'Strict' },
} as const;
type VKey = keyof typeof VERIFIERS;

const rnd = hash01;

type Id = 'tasks' | 'primary' | 'verify' | 'accept' | 'ref';
const N: Record<Id, { x: number; y: number; label: string; caption: { text?: string; tex?: string; at?: 'below' | 'above' | 'right' | 'left' } }> = {
  tasks: { x: 86, y: 166, label: 'Tasks', caption: { text: 'one per beat' } },
  primary: { x: 262, y: 166, label: 'Primary', caption: { text: 'pay', tex: 'A' } },
  verify: { x: 438, y: 166, label: 'Verify', caption: { tex: 'H_\\theta=\\mathbf 1\\{\\Sigma\\ge\\theta\\}' } },
  accept: { x: 690, y: 62, label: 'Accept', caption: { text: 'deliver', tex: 'Y_P', at: 'right' } },
  ref: { x: 690, y: 270, label: 'Reference', caption: { text: 'pay', tex: 'C_B', at: 'right' } },
};
const P = (id: Id): Pt => [N[id].x, N[id].y];
const straight = (a: Id, b: Id) => trim([P(a), P(b)], R + 5, R + 5);
const EDGES = {
  in: straight('tasks', 'primary'),
  check: straight('primary', 'verify'),
  up: straight('verify', 'accept'),
  down: trim(bend(P('verify'), P('ref'), 'diag'), R + 5, R + 5),
};
const LEN = Object.fromEntries(Object.entries(EDGES).map(([k, v]) => [k, length(v)])) as Record<keyof typeof EDGES, number>;

export function CascadeFlow() {
  const tk = useTokens();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '0px');
  const reduced = useReducedMotion();
  const [vk, setVk] = useState<VKey>('balanced');
  const [t, reset] = useClock(inView && !reduced);
  const v = VERIFIERS[vk];

  // restart the stream when the verifier changes
  useEffect(() => {
    reset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vk]);

  const tasks = useMemo(() => {
    const n = Math.floor(t / INTERVAL) + 1;
    const out: { i: number; right: boolean; acc: boolean; age: number }[] = [];
    for (let i = Math.max(0, n - 12); i < n; i++) {
      const right = rnd(i, 1) < P_RIGHT;
      const acc = right ? rnd(i, 2) < v.tpr : rnd(i, 2) < v.fpr;
      out.push({ i, right, acc, age: t - i * INTERVAL });
    }
    return out;
  }, [t, v]);

  // running tally over completed tasks
  const tally = useMemo(() => {
    const done = Math.max(0, Math.floor((t - TRAVEL) / INTERVAL) + 1);
    let acc = 0;
    let fa = 0;
    for (let i = 0; i < done; i++) {
      const right = rnd(i, 1) < P_RIGHT;
      const a = right ? rnd(i, 2) < v.tpr : rnd(i, 2) < v.fpr;
      if (a) acc++;
      if (a && !right) fa++;
    }
    return { done, acc, fa };
  }, [t, v]);

  // expectations (closed form)
  const pAcc = P_RIGHT * v.tpr + (1 - P_RIGHT) * v.fpr;
  const pFA = (1 - P_RIGHT) * v.fpr;
  const ED = A + (1 - pAcc);
  const EV = 1 - pFA;
  const run = tally.done
    ? { D: A + (tally.done - tally.acc) / tally.done, V: 1 - tally.fa / tally.done }
    : { D: ED, V: EV };

  // packets and pulses for the tasks in flight
  const packets: { pts: Pt[]; s: number; color: string; hollow: boolean }[] = [];
  const pulse: Partial<Record<Id, { p: number; tone: Tone }>> = {};
  const hit = (id: Id, at: number, tone: Tone) => {
    if (t >= at && t < at + 0.7) {
      const p = 1 - (t - at) / 0.7;
      if (!pulse[id] || pulse[id]!.p < p) pulse[id] = { p, tone };
    }
  };
  for (const d of tasks) {
    const age = d.age;
    // as in the paper's accounting: a right answer is filled, a wrong one hollow; a rejected task
    // is replaced by the reference's answer (amber), an accepted wrong one is a false accept (coral)
    const before = d.right ? 'var(--blue)' : 'var(--ink-3)';
    const after = !d.acc ? 'var(--amber)' : d.right ? 'var(--blue)' : 'var(--coral)';
    const legs: [keyof typeof EDGES, number, string, boolean][] = [
      ['in', 0, before, !d.right],
      ['check', LEG + 0.1, before, !d.right],
      [d.acc ? 'up' : 'down', 2 * LEG + 0.2, after, d.acc && !d.right],
    ];
    for (const [e, at, color, hollow] of legs) {
      const u = (age - at) / LEG;
      if (u > 0 && u < 1) {
        const eased = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        packets.push({ pts: EDGES[e], s: eased * LEN[e] + 10, color, hollow });
      }
    }
    const t0 = t - age;
    hit('primary', t0 + LEG, 'blue');
    hit('verify', t0 + 2 * LEG + 0.1, d.acc ? 'teal' : 'amber');
    if (d.acc) hit('accept', t0 + 3 * LEG + 0.2, d.right ? 'teal' : 'coral');
    else hit('ref', t0 + 3 * LEG + 0.2, 'amber');
  }

  return (
    <div ref={ref}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-[13px] text-ink-3">
          Verifier accepts <b className="font-semibold text-ink">{Math.round(v.tpr * 100)}%</b> of right answers and{' '}
          <b className="font-semibold text-ink">{Math.round(v.fpr * 100)}%</b> of wrong ones
        </p>
        <RubberSegment
          items={(Object.keys(VERIFIERS) as VKey[]).map((k) => ({ value: k, label: VERIFIERS[k].label }))}
          value={vk}
          onChange={(val) => setVk(val as VKey)}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="Verifier strictness"
        />
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="A reference-fallback cascade: each task is tried on a cheap primary, a verifier accepts or rejects it, and rejected tasks fall back to the reference.">
        {(Object.keys(EDGES) as (keyof typeof EDGES)[]).map((e, i) => (
          <FlowEdge key={e} pts={EDGES[e]} delay={0.1 + i * 0.08} />
        ))}
        <foreignObject x={(N.verify.x + N.accept.x) / 2 - 76} y={(N.verify.y + N.accept.y) / 2 - 30} width={80} height={24} style={{ overflow: 'visible' }}>
          <div className="text-right text-[14px] text-teal" dangerouslySetInnerHTML={{ __html: tex('H=1') }} />
        </foreignObject>
        <foreignObject x={N.verify.x + 112} y={N.ref.y - 32} width={80} height={24} style={{ overflow: 'visible' }}>
          <div className="text-[14px] text-amber" dangerouslySetInnerHTML={{ __html: tex('H=0') }} />
        </foreignObject>
        {packets.map((p, i) => (
          <Packet key={i} pts={p.pts} s={p.s} len={22} width={p.hollow ? 6 : 4.5} color={p.color} hollow={p.hollow} />
        ))}
        {(Object.keys(N) as Id[]).map((id) => (
          <FlowNode
            key={id}
            x={N[id].x}
            y={N[id].y}
            r={R}
            label={N[id].label}
            caption={N[id].caption}
            size={id === 'ref' ? 15 : 16.5}
            pulse={pulse[id]?.p ?? 0}
            pulseTone={pulse[id]?.tone}
            tone={pulse[id] && pulse[id]!.p > 0.5 && pulse[id]!.tone !== 'blue' ? pulse[id]!.tone : 'idle'}
          />
        ))}
      </svg>

      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-[12px] text-ink-3">
        <Swatch color="var(--blue)" label="primary right" />
        <Swatch color="var(--ink-3)" label="primary wrong" hollow />
        <Swatch color="var(--coral)" label="false accept: the only way a cascade loses quality" hollow />
        <Swatch color="var(--amber)" label="fallback to the reference" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-rule bg-surface px-3 py-2">
          <div className="font-sans text-[12px] text-ink-3">tasks through</div>
          <div className="mt-0.5 font-mono text-[18px] font-medium text-ink">
            <Counter value={tally.done} fontSize={18} intro={false} duration={0.45} />
          </div>
        </div>
        <Stat label="mean value delivered" value={run.V.toFixed(3)} sub={`expected ${EV.toFixed(3)}`} />
        <Stat label="mean cost, in reference calls" value={run.D.toFixed(3)} sub={`expected ${ED.toFixed(3)}`} />
        <div className="rounded-xl border border-rule bg-surface px-3 py-2">
          <div className="font-sans text-[12px] text-ink-3">expected efficiency</div>
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-[28px] font-semibold leading-none text-ink">{(EV / ED).toFixed(2)}×</span>
            <span className="font-mono text-[12px] text-coral">Q = −{pFA.toFixed(3)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="rounded-xl border border-rule bg-surface-2 px-4 py-1 text-center text-ink" dangerouslySetInnerHTML={{ __html: tex('V = H\\,Y_P + (1-H)\\,Y_B', true) }} />
        <div className="rounded-xl border border-rule bg-surface-2 px-4 py-1 text-center text-ink" dangerouslySetInnerHTML={{ __html: tex('D = A + (1-H)\\,C_B', true) }} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <FigTag>Reference-fallback cascade</FigTag>
        <p className="font-sans text-[12.5px] text-ink-3">Stricter checks buy quality with fallbacks: the verifier is itself a point on a cost–quality menu (Finding 7).</p>
      </div>
    </div>
  );
}

function Swatch({ color, label, hollow = false }: { color: string; label: string; hollow?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`inline-block w-[20px] ${hollow ? 'h-[7px] rounded-full border-[1.5px]' : 'h-[4.5px]'}`}
        style={hollow ? { borderColor: color } : { background: color }}
      />
      {label}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-rule bg-surface px-3 py-2">
      <div className="font-sans text-[12px] text-ink-3">{label}</div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="text-[18px] font-medium tabular-nums text-ink" style={mono}>
          {value}
        </span>
        {sub && <span className="font-sans text-[10.5px] text-ink-4">{sub}</span>}
      </div>
    </div>
  );
}
