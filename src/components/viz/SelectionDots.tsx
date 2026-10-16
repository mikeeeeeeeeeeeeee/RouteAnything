import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { SELECTION, SELECTION_RULES } from '@/data/results';
import { useInView } from '@/lib/hooks';
import { mono, sans } from './svg';

// Table 1: share of comparisons in which each rule's fitted choice has the highest held-out
// efficiency among the candidates. Paired = blue, residual coverage = amber, the rest grey with
// distinct shapes (identity never by colour alone).

const VW = 760;
const ROW = 64;
const TOP = 30;
const L = 236;
const R = 690;
const X = (v: number) => L + (v / 100) * (R - L);

type RuleKey = (typeof SELECTION_RULES)[number]['key'];

const STYLE: Record<RuleKey, { color: string; shape: 'dot' | 'ring' | 'square' | 'tri'; r: number }> = {
  paired: { color: 'var(--blue)', shape: 'dot', r: 7.5 },
  residual: { color: 'var(--amber)', shape: 'dot', r: 6 },
  saving: { color: 'var(--ink-3)', shape: 'ring', r: 5.5 },
  indep: { color: 'var(--ink-3)', shape: 'square', r: 5 },
  marginal: { color: 'var(--ink-3)', shape: 'tri', r: 6 },
};

function Mark({ k }: { k: RuleKey }) {
  const s = STYLE[k];
  if (s.shape === 'ring') return <circle r={s.r} fill="var(--surface)" stroke={s.color} strokeWidth={2} />;
  if (s.shape === 'square') return <rect x={-s.r} y={-s.r} width={s.r * 2} height={s.r * 2} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} />;
  if (s.shape === 'tri') return <path d={`M0,${-s.r} L${s.r},${s.r * 0.8} L${-s.r},${s.r * 0.8} Z`} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} />;
  return <circle r={s.r} fill={s.color} stroke="var(--surface)" strokeWidth={2} />;
}

export function SelectionDots() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const [hover, setHover] = useState<number | null>(null);
  const VH = TOP + SELECTION.length * ROW + 40;

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="Best-candidate selection rate of five rules in four settings">
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={X(t)} y1={TOP - 8} x2={X(t)} y2={TOP + SELECTION.length * ROW - 8} stroke="var(--rule)" />
            <text x={X(t)} y={TOP + SELECTION.length * ROW + 10} textAnchor="middle" fontSize={11} fill="var(--ink-3)" style={mono}>
              {t}%
            </text>
          </g>
        ))}
        {SELECTION.map((row, i) => {
          const cy = TOP + i * ROW + ROW / 2 - 8;
          const vals = SELECTION_RULES.map((r) => row[r.key]);
          const lo = Math.min(...vals);
          const hi = Math.max(...vals);
          const dim = hover !== null && hover !== i;
          return (
            <g key={row.setting} opacity={dim ? 0.35 : 1} style={{ transition: 'opacity .25s' }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={0} y={cy - ROW / 2} width={VW} height={ROW} fill="transparent" />
              <text x={L - 18} y={cy - 3} textAnchor="end" fontSize={13.5} fontWeight={600} fill="var(--ink)" style={sans}>
                {row.bench}
              </text>
              <text x={L - 18} y={cy + 14} textAnchor="end" fontSize={11.5} fill="var(--ink-3)" style={mono}>
                θ = {row.theta} · {row.count.toLocaleString('en-US')} comparisons
              </text>
              <motion.line
                y1={cy}
                y2={cy}
                stroke="var(--rule-2)"
                strokeWidth={2}
                initial={{ x1: X(0), x2: X(0) }}
                animate={inView ? { x1: X(lo), x2: X(hi) } : {}}
                transition={{ duration: 1.1, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
              />
              {SELECTION_RULES.slice()
                .reverse()
                .map((r, j) => (
                  <motion.g
                    key={r.key}
                    initial={{ x: X(0), y: cy, opacity: 0 }}
                    animate={inView ? { x: X(row[r.key]), y: cy, opacity: 1 } : {}}
                    transition={{ duration: 1.1, delay: 0.12 * i + 0.05 * j, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Mark k={r.key} />
                  </motion.g>
                ))}
              <motion.text
                x={X(row.paired) + 12}
                y={cy - 10}
                fontSize={12}
                fontWeight={700}
                fill="var(--blue)"
                style={mono}
                initial={{ opacity: 0 }}
                animate={{ opacity: inView ? 1 : 0 }}
                transition={{ delay: 1 + 0.12 * i }}
              >
                {row.paired}%
              </motion.text>
              {hover === i && (
                <g>
                  {SELECTION_RULES.filter((r) => r.key !== 'paired').map((r) => (
                    <text key={r.key} x={X(row[r.key])} y={cy + 20} textAnchor="middle" fontSize={10.5} fill="var(--ink-2)" style={mono}>
                      {row[r.key]}
                    </text>
                  ))}
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2 font-sans text-[12px] text-ink-3">
        {SELECTION_RULES.map((r) => (
          <span key={r.key} className="flex items-center gap-2" title={r.desc}>
            <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden>
              <Mark k={r.key} />
            </svg>
            <span className={r.key === 'paired' ? 'font-semibold text-ink' : ''}>{r.label}</span>
          </span>
        ))}
        <span>· hover a row for every value</span>
      </div>
    </div>
  );
}
