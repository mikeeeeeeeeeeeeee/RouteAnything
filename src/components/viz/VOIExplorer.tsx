import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { Slider } from '@/components/ui/Slider';
import { SIGNALS } from '@/data/results';
import { tex } from '@/lib/tex';
import { useTokens } from '@/theme/tokens';
import { BarList } from './BarList';
import { TexLabel, mono, scale } from './svg';

// Eq. (12), Proposition 9. Two actions, quality preserved: attempt the primary (cost a, then b on failure) or fall
// back directly (cost b). A binary signal Z moves the success probability s to s0 or s1; the cost
// with the signal is the chord of the no-signal curve between them. Perfect information bounds what
// any signal can save, and that bound never reaches a, so a signal that costs more than an attempt
// can never pay. Schematic: a = 0.3 b.

const A = 0.3;
const VW = 520;
const VH = 384;
const PL = 56;
const PR = 500;
const PT = 20;
const PB = 310;
const X = scale(0, 1, PL, PR);
const Y = scale(0.2, 1.36, PB, PT);
const cost = (s: number) => Math.min(A + (1 - s), 1);
const perfect = (s: number) => s * A + (1 - s);

export function VOIExplorer() {
  const tk = useTokens();
  const [sPct, setS] = useState(42);
  const [kPct, setK] = useState(60);
  const [pricePct, setPrice] = useState(10); // signal price, % of a
  const s = Math.min(0.97, Math.max(0.03, sPct / 100));
  const k = kPct / 100;
  const s0 = s * (1 - k);
  const s1 = s + (1 - s) * k;
  const p1 = s1 - s0 > 1e-9 ? (s - s0) / (s1 - s0) : 0;
  const withZ = (1 - p1) * cost(s0) + p1 * cost(s1);
  const none = cost(s);
  const saved = none - withZ;
  const bound = none - perfect(s);
  const capture = bound > 1e-9 ? saved / bound : 0;
  const price = (pricePct / 100) * A;
  const netv = saved - price;

  const curve = useMemo(() => [0, A, 1].map((x) => `${X(x)},${Y(cost(x))}`).join(' '), []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="Expected cost against the primary's success probability, with and without a routing signal">
        {/* axes */}
        <line x1={PL} y1={PB} x2={PR} y2={PB} stroke="var(--ink-4)" />
        <line x1={PL} y1={PT} x2={PL} y2={PB} stroke="var(--ink-4)" />
        <TexLabel x={PL - 10} y={Y(1)} t="b" anchor="end" size={14} color="var(--ink-2)" w={30} />
        <TexLabel x={PL - 10} y={Y(A)} t="a" anchor="end" size={14} color="var(--ink-2)" w={30} />
        <TexLabel x={X(A)} y={PB + 18} t="a/b" size={13} color="var(--ink-2)" w={40} />
        <text x={PL} y={PB + 18} textAnchor="middle" fontSize={11} fill="var(--ink-3)" style={mono}>
          0
        </text>
        <text x={PR} y={PB + 18} textAnchor="middle" fontSize={11} fill="var(--ink-3)" style={mono}>
          1
        </text>
        <text x={PR} y={VH - 6} textAnchor="end" fontSize={12} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          primary success probability s →
        </text>
        <text x={PL - 40} y={PT + 4} fontSize={12} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          expected cost
        </text>

        {/* attempt and fallback lines */}
        <line x1={X(0)} y1={Y(A + 1)} x2={X(1)} y2={Y(A)} stroke="var(--blue)" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.7} />
        <line x1={X(0)} y1={Y(1)} x2={X(1)} y2={Y(1)} stroke="var(--amber)" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.7} />
        <text x={X(0.06)} y={Y(A + 0.94) - 8} fontSize={11.5} fill="var(--blue)" style={{ fontFamily: 'var(--font-sans)' }}>
          attempt: a + (1 − s) b
        </text>
        <text x={X(0.98)} y={Y(1) - 8} textAnchor="end" fontSize={11.5} fill="var(--amber)" style={{ fontFamily: 'var(--font-sans)' }}>
          fall back: b
        </text>
        {/* perfect information */}
        <line x1={X(0)} y1={Y(perfect(0))} x2={X(1)} y2={Y(perfect(1))} stroke="var(--ink-3)" strokeWidth={1.3} strokeDasharray="1.5 4" />
        {/* no-signal cost */}
        <polyline points={curve} fill="none" stroke="var(--ink)" strokeWidth={2.6} strokeLinejoin="round" />

        {/* the signal's chord */}
        <motion.line
          animate={{ x1: X(s0), y1: Y(cost(s0)), x2: X(s1), y2: Y(cost(s1)) }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          stroke="var(--teal)"
          strokeWidth={2}
        />
        <motion.circle animate={{ cx: X(s0), cy: Y(cost(s0)) }} r={5.5} fill="var(--teal)" stroke="var(--surface)" strokeWidth={2} transition={{ type: 'spring', stiffness: 220, damping: 28 }} />
        <motion.circle animate={{ cx: X(s1), cy: Y(cost(s1)) }} r={5.5} fill="var(--teal)" stroke="var(--surface)" strokeWidth={2} transition={{ type: 'spring', stiffness: 220, damping: 28 }} />
        <motion.g animate={{ x: X(s0) }} transition={{ type: 'spring', stiffness: 220, damping: 28 }}>
          <TexLabel x={0} y={PB + 36} t="s_0" size={13} color="var(--teal)" w={30} />
        </motion.g>
        <motion.g animate={{ x: X(s1) }} transition={{ type: 'spring', stiffness: 220, damping: 28 }}>
          <TexLabel x={0} y={PB + 36} t="s_1" size={13} color="var(--teal)" w={30} />
        </motion.g>

        {/* saved by Z | rest of the perfect-information bound, at the prior s */}
        <motion.rect
          width={12}
          fill="var(--teal)"
          animate={{ x: X(s) - 6, y: Y(none), height: Math.max(0, Y(withZ) - Y(none)) }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          rx={2}
        />
        <motion.rect
          width={12}
          fill="var(--teal-wash)"
          stroke="color-mix(in oklab, var(--teal) 40%, transparent)"
          animate={{ x: X(s) - 6, y: Y(withZ), height: Math.max(0, Y(perfect(s)) - Y(withZ)) }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          rx={2}
        />
        <motion.line animate={{ x1: X(s), x2: X(s) }} y1={Y(perfect(s))} y2={PB} stroke="var(--ink-4)" strokeDasharray="2 3" transition={{ type: 'spring', stiffness: 220, damping: 28 }} />
        <motion.g animate={{ x: X(s) }} transition={{ type: 'spring', stiffness: 220, damping: 28 }}>
          <TexLabel x={0} y={PB + 18} t="s" size={14} color="var(--ink)" w={20} />
        </motion.g>

        {/* legend */}
        <g transform={`translate(${PL + 18}, ${Y(0.5)})`} style={{ fontFamily: 'var(--font-sans)' }} fontSize={11.5} fill="var(--ink-2)">
          <line x1={0} y1={0} x2={22} y2={0} stroke="var(--ink)" strokeWidth={2.6} />
          <text x={30} y={4}>no signal</text>
          <line x1={0} y1={20} x2={22} y2={20} stroke="var(--teal)" strokeWidth={2} />
          <text x={30} y={24}>with signal Z</text>
          <line x1={0} y1={40} x2={22} y2={40} stroke="var(--ink-3)" strokeWidth={1.3} strokeDasharray="1.5 4" />
          <text x={30} y={44}>perfect information</text>
        </g>
      </svg>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-rule bg-surface p-4">
          <div className="smallcaps text-[10px] text-ink-3">capture of the perfect-information value</div>
          <div className="mt-1 font-display text-[46px] font-semibold leading-none text-ink">{(capture * 100).toFixed(0)}%</div>
          <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11.5px] text-ink-2">
            <span>saved {(saved / A).toFixed(2)} a</span>
            <span>bound {(bound / A).toFixed(2)} a</span>
          </div>
        </div>
        <Ctl label="prior success s" value={s.toFixed(2)}>
          <Slider value={sPct} onChange={setS} max={97} color={tk.ink} ariaLabel="Prior success probability" />
        </Ctl>
        <Ctl label="signal strength" value={`${kPct}%`}>
          <Slider value={kPct} onChange={setK} max={100} color={tk.teal} ariaLabel="Signal strength" />
        </Ctl>
        <Ctl label="price of the signal" value={`${(pricePct / 100).toFixed(2)} a`}>
          <Slider value={pricePct} onChange={setPrice} max={150} color={tk.coral} ariaLabel="Signal price" />
        </Ctl>
        <div className={`rounded-xl px-3 py-2 font-sans text-[12.5px] leading-snug ${netv > 0 ? 'bg-teal-wash text-ink-2' : 'bg-coral-wash text-ink-2'}`}>
          Net value <span className="font-mono">{(netv / A).toFixed(2)} a</span>:{' '}
          {netv > 0 ? 'worth buying.' : pricePct >= 100 ? 'never worth it: the bound is below one attempt.' : 'not worth buying at this price.'}
        </div>
      </div>
    </div>
  );
}

function Ctl({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="smallcaps text-[10px] text-ink-3">{label}</span>
        <span className="font-mono text-[12px] text-ink">{value}</span>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Table 16: the released routers' capture with and without the task type. */
export function SignalCapture() {
  const tk = useTokens();
  const [mode, setMode] = useState<'unknown' | 'given'>('unknown');
  const THRESH = [0.555, 0.546, 0.417, 0.082, 0, 0, 0, 0, 0];
  const rows = SIGNALS.map((r, i) => {
    const v = mode === 'unknown' ? THRESH[i] : r.within;
    return {
      key: r.source,
      label: r.source,
      value: v,
      display: `${v >= 0 ? '' : '−'}${Math.abs(v * 100).toFixed(1)}%`,
      color: r.family === 'fine-tuned' ? 'var(--blue)' : 'var(--slate)',
      emphasis: i < 2,
    };
  });
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="font-sans text-[13px] text-ink-3">
          capture for Qwen3-Max at <span dangerouslySetInnerHTML={{ __html: tex('\\theta=1') }} />, threshold use, no signal charge
        </span>
        <RubberSegment
          items={[
            { value: 'unknown', label: 'task type unknown' },
            { value: 'given', label: 'task type given' },
          ]}
          value={mode}
          onChange={(v) => setMode(v as 'unknown' | 'given')}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="Task type"
        />
      </div>
      <BarList rows={rows} min={-0.05} max={0.62} labelWidth={180} barHeight={14} gap={10} ticks={[0, 0.2, 0.4, 0.6]} tickFormat={(v) => `${Math.round(v * 100)}%`} />
    </div>
  );
}
