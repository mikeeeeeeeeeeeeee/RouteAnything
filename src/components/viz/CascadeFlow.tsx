import { useEffect, useMemo, useRef, useState } from 'react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import Counter from '@/components/reactbits/Counter/Counter';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { tex } from '@/lib/tex';
import { useTokens } from '@/theme/tokens';
import { TexLabel, mono, sans } from './svg';

// Eq. (5) acted out. Every task pays the primary's cost A; a rejected one also pays C_B and gets the
// reference's answer. V - Y_B = H (Y_P - Y_B), so quality is lost only through false accepts.
// Illustration: the reference is right on every task, the primary on 45%, A = 0.1 C_B.

type Pt = [number, number];
const VW = 760;
const VH = 300;
const P_RIGHT = 0.45;
const A = 0.1;
const INTERVAL = 0.42;
const TRAVEL = 2.6;

const VERIFIERS = {
  lenient: { tpr: 0.97, fpr: 0.35, label: 'Lenient' },
  balanced: { tpr: 0.9, fpr: 0.15, label: 'Balanced' },
  strict: { tpr: 0.7, fpr: 0.03, label: 'Strict' },
} as const;
type VKey = keyof typeof VERIFIERS;

// deterministic hash -> [0, 1)
const rnd = (i: number, salt: number) => {
  let x = (i * 374761393 + salt * 668265263) | 0;
  x = (x ^ (x >>> 13)) * 1274126177;
  x = x ^ (x >>> 16);
  return ((x >>> 0) % 100000) / 100000;
};

const IN: Pt = [10, 150];
const PRIM: [number, number, number, number] = [96, 118, 120, 64];
const VER: [number, number, number, number] = [292, 118, 112, 64];
const ACC: [number, number, number, number] = [520, 34, 150, 62];
const FB: [number, number, number, number] = [520, 204, 150, 62];

const ROUTE_UP: Pt[] = [IN, [PRIM[0] + PRIM[2] / 2, 150], [VER[0] + VER[2] / 2, 150], [460, 150], [460, 65], [ACC[0] + ACC[2] / 2, 65]];
const ROUTE_DOWN: Pt[] = [IN, [PRIM[0] + PRIM[2] / 2, 150], [VER[0] + VER[2] / 2, 150], [460, 150], [460, 235], [FB[0] + FB[2] / 2, 235]];

const lenOf = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function along(pts: Pt[], f: number): Pt {
  let d = Math.max(0, Math.min(1, f)) * lenOf(pts);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= l) return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l];
    d -= l;
  }
  return pts[pts.length - 1];
}
const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

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

  const box = (b: [number, number, number, number], title: string, sym: string, fill: string, stroke: string) => (
    <g>
      <rect x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx={12} fill={fill} stroke={stroke} strokeWidth={1.3} />
      <text x={b[0] + b[2] / 2} y={b[1] + 25} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)" style={sans}>
        {title}
      </text>
      <TexLabel x={b[0] + b[2] / 2} y={b[1] + 44} t={sym} size={14} color="var(--ink-2)" w={b[2]} />
    </g>
  );

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
        {/* rails */}
        <g fill="none" stroke="var(--rule-2)" strokeWidth={1.4}>
          <path d={`M${ROUTE_UP.map((p) => p.join(',')).join(' L')}`} />
          <path d={`M${ROUTE_DOWN.slice(3).map((p) => p.join(',')).join(' L')}`} />
        </g>

        {/* tasks travel under the boxes, so they enter and leave each stage */}
        {tasks.map((d) => {
          const f = d.age / TRAVEL;
          if (f < 0 || f > 1) return null;
          const p = along(d.acc ? ROUTE_UP : ROUTE_DOWN, easeInOutSine(f));
          const past = f > 0.55; // verdict known after the verifier
          const falseAcc = d.acc && !d.right;
          return (
            <g key={d.i} transform={`translate(${p[0]},${p[1]})`}>
              {past && falseAcc && <circle r={11} fill="none" stroke="var(--coral)" strokeWidth={2} />}
              <circle r={6} fill={d.right ? 'var(--ink)' : 'var(--surface)'} stroke="var(--ink)" strokeWidth={1.6} />
            </g>
          );
        })}

        {box(PRIM, 'Primary', 'P', 'var(--surface)', 'var(--rule-2)')}
        {box(VER, 'Verify', 'H_\\theta = \\mathbf 1\\{\\Sigma\\ge\\theta\\}', 'var(--surface)', 'var(--rule-2)')}
        {box(ACC, 'Accept', 'V = Y_P', 'var(--teal-wash)', 'color-mix(in oklab, var(--teal) 50%, transparent)')}
        {box(FB, 'Fall back to B', 'V = Y_B,\\ \\text{pay } C_B', 'var(--amber-wash)', 'color-mix(in oklab, var(--amber) 50%, transparent)')}
        <TexLabel x={472} y={100} t="H=1" anchor="start" size={13} color="var(--teal)" w={60} />
        <TexLabel x={472} y={200} t="H=0" anchor="start" size={13} color="var(--amber)" w={60} />
        <TexLabel x={PRIM[0] + PRIM[2] / 2} y={PRIM[1] - 16} t="\text{pay } A \text{ on every task}" size={12.5} color="var(--ink-3)" w={180} />

        {/* legend */}
        <g transform="translate(14, 282)" style={sans} fontSize={12} fill="var(--ink-3)">
          <circle cx={6} cy={0} r={5.5} fill="var(--ink)" />
          <text x={16} y={4}>primary right</text>
          <circle cx={124} cy={0} r={5.5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
          <text x={134} y={4}>primary wrong</text>
          <circle cx={252} cy={0} r={8} fill="none" stroke="var(--coral)" strokeWidth={2} />
          <text x={266} y={4}>false accept: the only way a cascade loses quality</text>
        </g>
      </svg>

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
      <p className="mt-3 font-sans text-[12.5px] text-ink-3">Stricter checks buy quality with fallbacks: the verifier is itself a point on a cost–quality menu (Finding 5).</p>
    </div>
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
