import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import SloshGauge from '@/components/reactbits/SloshGauge/SloshGauge';
import { RETRIES, RETRY_POOLED } from '@/data/results';
import { useInView } from '@/lib/hooks';
import { useTokens } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { mono, sans } from './svg';

// Table 6. Each failed first attempt gets three fresh retries and three retries that see output from
// a disjoint half of the tests; recovery is scored on the other half. Lines per model, pooled bold.

const VW = 470;
const VH = 330;
const XA = 70;
const XB = 250;
const Y = (v: number) => 290 - (v / 0.42) * 260;

export function RetrySlope() {
  const tk = useTokens();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const [hover, setHover] = useState<string | null>(null);
  // label positions on the right, nudged apart
  const sorted = [...RETRIES.map((r) => ({ model: r.model, feedback: r.feedback })), { model: 'Pooled', feedback: RETRY_POOLED.feedback }].sort(
    (a, b) => b.feedback - a.feedback
  );
  const labelY: Record<string, number> = {};
  let last = -Infinity;
  for (const r of sorted) {
    let y = Y(r.feedback);
    if (y - last < 17) y = last + 17;
    labelY[r.model] = y;
    last = y;
  }

  return (
    <div ref={ref} className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="flex items-end justify-center gap-6">
        <Gauge label="fresh retry" value={RETRY_POOLED.fresh} color={tk.slate} on={inView} />
        <Gauge label="with failing-test feedback" value={RETRY_POOLED.feedback} color={tk.teal} on={inView} />
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="Per-retry recovery of seven models, fresh against feedback retries">
        {[0, 0.1, 0.2, 0.3, 0.4].map((t) => (
          <g key={t}>
            <line x1={XA - 10} y1={Y(t)} x2={XB + 10} y2={Y(t)} stroke="var(--rule)" />
            <text x={XA - 18} y={Y(t) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" style={mono}>
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <line x1={XA} y1={Y(0)} x2={XA} y2={Y(0.42)} stroke="var(--ink-4)" />
        <line x1={XB} y1={Y(0)} x2={XB} y2={Y(0.42)} stroke="var(--ink-4)" />
        <text x={XA} y={VH - 14} textAnchor="middle" fontSize={12} fill="var(--ink-2)" style={sans}>
          fresh
        </text>
        <text x={XB} y={VH - 14} textAnchor="middle" fontSize={12} fill="var(--ink-2)" style={sans}>
          feedback
        </text>
        <text x={XA - 46} y={18} fontSize={11} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          per-retry recovery
        </text>

        {RETRIES.map((r, i) => {
          const on = hover === r.model;
          const dim = hover !== null && !on;
          return (
            <g key={r.model} onMouseEnter={() => setHover(r.model)} onMouseLeave={() => setHover(null)} opacity={dim ? 0.25 : 1} style={{ transition: 'opacity .25s' }}>
              <motion.line
                x1={XA}
                y1={Y(r.fresh)}
                stroke={on ? 'var(--teal)' : 'color-mix(in oklab, var(--blue) 55%, transparent)'}
                strokeWidth={on ? 2.4 : 1.4}
                initial={{ x2: XA, y2: Y(r.fresh) }}
                animate={inView ? { x2: XB, y2: Y(r.feedback) } : {}}
                transition={{ duration: 1, delay: 0.3 + 0.07 * i, ease: [0.22, 1, 0.36, 1] }}
              />
              <circle cx={XA} cy={Y(r.fresh)} r={3.6} fill="var(--surface)" stroke="var(--blue)" strokeWidth={1.4} />
              <motion.circle
                cx={XB}
                cy={Y(r.feedback)}
                r={3.6}
                fill="var(--blue)"
                initial={{ opacity: 0 }}
                animate={{ opacity: inView ? 1 : 0 }}
                transition={{ delay: 1.1 + 0.07 * i }}
              />
              <motion.text
                x={XB + 16}
                y={labelY[r.model] + 4}
                fontSize={11.5}
                fill={on ? 'var(--ink)' : 'var(--ink-2)'}
                style={sans}
                initial={{ opacity: 0 }}
                animate={{ opacity: inView ? 1 : 0 }}
                transition={{ delay: 1.2 + 0.07 * i }}
              >
                {r.model}
                {on && (
                  <tspan fill="var(--ink-3)" style={mono}>
                    {'  '}
                    {r.fresh.toFixed(3)} → {r.feedback.toFixed(3)} · n={r.failures}
                  </tspan>
                )}
              </motion.text>
              {Math.abs(labelY[r.model] - Y(r.feedback)) > 2 && (
                <line x1={XB + 5} y1={Y(r.feedback)} x2={XB + 13} y2={labelY[r.model]} stroke="var(--ink-4)" strokeWidth={0.8} />
              )}
            </g>
          );
        })}

        {/* pooled */}
        <motion.line
          x1={XA}
          y1={Y(RETRY_POOLED.fresh)}
          stroke="var(--ink)"
          strokeWidth={3.2}
          strokeLinecap="round"
          initial={{ x2: XA, y2: Y(RETRY_POOLED.fresh) }}
          animate={inView ? { x2: XB, y2: Y(RETRY_POOLED.feedback) } : {}}
          transition={{ duration: 1.2, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <circle cx={XA} cy={Y(RETRY_POOLED.fresh)} r={6} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} />
        <motion.circle cx={XB} cy={Y(RETRY_POOLED.feedback)} r={6} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: inView ? 1 : 0 }} transition={{ delay: 2 }} />
        <motion.text
          x={XB + 16}
          y={labelY.Pooled + 4}
          fontSize={12}
          fontWeight={700}
          fill="var(--ink)"
          style={sans}
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={{ delay: 2 }}
        >
          Pooled
          <tspan fontWeight={400} fill="var(--ink-2)" style={mono}>
            {'  '}
            {RETRY_POOLED.fresh} → {RETRY_POOLED.feedback}
          </tspan>
        </motion.text>
        {Math.abs(labelY.Pooled - Y(RETRY_POOLED.feedback)) > 2 && (
          <line x1={XB + 7} y1={Y(RETRY_POOLED.feedback)} x2={XB + 13} y2={labelY.Pooled} stroke="var(--ink-3)" strokeWidth={0.8} />
        )}
      </svg>
    </div>
  );
}

function Gauge({ label, value, color, on }: { label: string; value: number; color: string; on: boolean }) {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col items-center gap-2 text-ink">
      <SloshGauge
        value={on ? Math.round(value * 1000) / 10 : 0}
        interactive={false}
        showValue
        liquidColor={color}
        glassColor={theme === 'dark' ? '#1d262d' : '#ebe7de'}
        width={92}
        height={190}
        radius={22}
        ticks={4}
        unit="%"
        ariaLabel={label}
      />
      <span className="max-w-[110px] text-center font-sans text-[12px] leading-tight text-ink-3">{label}</span>
    </div>
  );
}
