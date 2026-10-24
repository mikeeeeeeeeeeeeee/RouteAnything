import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { JUDGE, VERIFIERS } from '@/data/results';
import { useInView } from '@/lib/hooks';
import { useTokens } from '@/theme/tokens';
import { logScale, mono, sans, scale } from './svg';

// Table 15: Qwen3-Max cascades with five verifiers, dollar efficiency including the
// verifier's cost (judge at the primary-price proxy), AUROC, and quality change at theta = 0.5.

const VW = 760;
const ROW = 46;
const TOP = 36;
const L = 186;
const EW = 300;
const X = logScale(0.5, 7, L, L + EW);
const AUC_X = L + EW + 48;
const QX0 = AUC_X + 62;
const QW = 150;
const QX = scale(-0.06, 0.06, QX0, QX0 + QW);

export function VerifierMenu() {
  const tk = useTokens();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const [theta, setTheta] = useState<'0.5' | '1'>('0.5');
  const VH = TOP + VERIFIERS.length * ROW + 40;

  return (
    <div ref={ref}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="font-sans text-[13px] text-ink-3">acceptance threshold on the verifier&rsquo;s score</span>
        <RubberSegment
          items={[
            { value: '0.5', label: 'θ = 0.5 · partial credit' },
            { value: '1', label: 'θ = 1 · full credit' },
          ]}
          value={theta}
          onChange={(v) => setTheta(v as '0.5' | '1')}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="Acceptance threshold"
        />
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full min-w-[680px]" role="img" aria-label="Verifier efficiency, AUROC and quality change">
          <text x={L + EW / 2} y={14} textAnchor="middle" fontSize={12.5} fontWeight={650} fill="var(--ink)" style={sans}>
            Dollar efficiency, verifier included
          </text>
          <text x={AUC_X} y={14} textAnchor="middle" fontSize={12.5} fontWeight={650} fill="var(--ink)" style={sans}>
            AUROC
          </text>
          <text x={QX0 + QW / 2} y={14} textAnchor="middle" fontSize={12.5} fontWeight={650} fill="var(--ink)" style={sans}>
            Quality change (θ = 0.5)
          </text>
          {[0.5, 1, 2, 5].map((t) => (
            <g key={t}>
              <line x1={X(t)} y1={TOP - 10} x2={X(t)} y2={TOP + VERIFIERS.length * ROW - 10} stroke={t === 1 ? 'var(--ink-3)' : 'var(--rule)'} strokeDasharray={t === 1 ? '4 4' : undefined} />
              <text x={X(t)} y={TOP + VERIFIERS.length * ROW + 8} textAnchor="middle" fontSize={11} fill="var(--ink-3)" style={mono}>
                {t}×
              </text>
            </g>
          ))}
          <line x1={QX(0)} y1={TOP - 10} x2={QX(0)} y2={TOP + VERIFIERS.length * ROW - 10} stroke="var(--ink-3)" strokeDasharray="4 4" />
          {[-0.05, 0.05].map((t) => (
            <text key={t} x={QX(t)} y={TOP + VERIFIERS.length * ROW + 8} textAnchor="middle" fontSize={11} fill="var(--ink-3)" style={mono}>
              {t > 0 ? `+${t}` : t}
            </text>
          ))}

          {VERIFIERS.map((v, i) => {
            const cy = TOP + i * ROW + ROW / 2 - 10;
            const [r, lo, hi] = theta === '0.5' ? v.r05 : v.r1;
            const good = r >= 1;
            const col = v.name.startsWith('LLM') ? 'var(--coral)' : v.name.startsWith('Compiler') ? 'var(--teal)' : 'var(--blue)';
            return (
              <g key={v.name}>
                <text x={L - 16} y={cy + 4} textAnchor="end" fontSize={13} fill="var(--ink)" fontWeight={v.name.startsWith('Compiler') ? 650 : 400} style={sans}>
                  {v.name}
                </text>
                <motion.line
                  y1={cy}
                  y2={cy}
                  stroke={col}
                  strokeWidth={1.8}
                  initial={{ x1: X(1), x2: X(1) }}
                  animate={inView ? { x1: X(lo), x2: X(hi) } : {}}
                  transition={{ duration: 0.9, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.circle
                  r={6}
                  cy={cy}
                  fill={col}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  initial={{ cx: X(1) }}
                  animate={inView ? { cx: X(r) } : {}}
                  transition={{ duration: 0.9, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.text
                  y={cy - 10}
                  fontSize={11}
                  fill={good ? 'var(--ink-2)' : 'var(--coral)'}
                  textAnchor="middle"
                  style={mono}
                  animate={inView ? { x: X(r), opacity: 1 } : { x: X(1), opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.08 * i }}
                >
                  {r.toFixed(2)}×
                </motion.text>
                {/* AUROC as a small bar */}
                <rect x={AUC_X - 26} y={cy - 4} width={52} height={8} rx={4} fill="var(--rule)" />
                <motion.rect
                  x={AUC_X - 26}
                  y={cy - 4}
                  height={8}
                  rx={4}
                  fill="var(--ink-3)"
                  initial={{ width: 0 }}
                  animate={{ width: inView ? 52 * v.auroc : 0 }}
                  transition={{ duration: 0.8, delay: 0.4 + 0.08 * i }}
                />
                <text x={AUC_X} y={cy - 9} textAnchor="middle" fontSize={10.5} fill="var(--ink-2)" style={mono}>
                  {v.auroc.toFixed(3)}
                </text>
                {/* quality change */}
                <motion.circle
                  cy={cy}
                  r={5.5}
                  fill={v.q05 >= 0 ? 'var(--teal)' : 'var(--coral)'}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  initial={{ cx: QX(0) }}
                  animate={inView ? { cx: QX(v.q05) } : {}}
                  transition={{ duration: 0.9, delay: 0.5 + 0.08 * i }}
                />
                <text x={QX(v.q05)} y={cy - 10} textAnchor="middle" fontSize={10.5} fill="var(--ink-2)" style={mono}>
                  {v.q05 > 0 ? '+' : ''}
                  {v.q05.toFixed(3)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/** The resource comes first: the same cascades in dollars and in sequential seconds. */
export function ResourceFlip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const [unit, setUnit] = useState<'usd' | 'sec'>('usd');
  const tk = useTokens();
  const X2 = logScale(0.05, 6, 0, 100);
  const rows =
    unit === 'usd'
      ? [
          { k: 'casc', label: 'Verified cascades (compile, tests, oracle)', lo: 1.98, hi: 4.09, color: 'var(--teal)' },
          { k: 'judge', label: 'LLM judge, list price · proxy price', lo: JUDGE.list, hi: JUDGE.proxy, color: 'var(--coral)' },
        ]
      : [
          { k: 'casc', label: 'Verified cascades (compile, tests, oracle)', lo: JUDGE.seconds.cascadesRange[0], hi: JUDGE.seconds.cascadesRange[1], color: 'var(--teal)' },
          { k: 'judge', label: 'LLM judge (a 39 s call)', lo: JUDGE.seconds.judgeRatio, hi: JUDGE.seconds.judgeRatio, color: 'var(--coral)' },
        ];
  return (
    <div ref={ref}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-sans text-[13px] text-ink-3">efficiency against always-Opus, measured in</span>
        <RubberSegment
          items={[
            { value: 'usd', label: 'dollars' },
            { value: 'sec', label: 'sequential seconds' },
          ]}
          value={unit}
          onChange={(v) => setUnit(v as 'usd' | 'sec')}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="Resource"
        />
      </div>
      <div className="relative mr-28 space-y-6 pb-6">
        <div className="absolute inset-y-0 w-px bg-ink-3" style={{ left: `calc(${X2(1)}% )` }} />
        <span className="absolute -top-1 -translate-x-1/2 font-mono text-[10px] text-ink-3" style={{ left: `${X2(1)}%` }}>
          Opus = 1×
        </span>
        {rows.map((r) => (
          <div key={r.k} className="pt-3">
            <div className="mb-1 font-sans text-[12.5px] text-ink-2">{r.label}</div>
            <div className="relative h-5">
              <motion.div
                className="absolute top-1 h-3 rounded-full"
                style={{ background: r.color }}
                initial={false}
                animate={{ left: `${X2(r.lo)}%`, width: `${Math.max(1.6, X2(r.hi) - X2(r.lo))}%`, opacity: inView ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              />
              <motion.span
                className="absolute top-0 whitespace-nowrap font-mono text-[11.5px] text-ink"
                initial={false}
                animate={{ left: `calc(${X2(r.hi)}% + 10px)` }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              >
                {r.lo === r.hi ? `${r.lo}×` : `${r.lo}–${r.hi}×`}
              </motion.span>
            </div>
          </div>
        ))}
        <div className="relative h-3 font-mono text-[10px] text-ink-4">
          {[0.1, 0.3, 1, 3].map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${X2(t)}%` }}>
              {t}×
            </span>
          ))}
        </div>
      </div>
      <p className="font-sans text-[12.5px] leading-snug text-ink-3">
        {unit === 'usd'
          ? 'In dollars a free compile check is the best verifier, and a judge pays only below $0.0033 per task.'
          : `In seconds the ranking reverses: Opus answers faster than the primary (${JUDGE.seconds.opus} s against ${JUDGE.seconds.qwen} s), so every verified cascade falls below 1×.`}
      </p>
    </div>
  );
}

