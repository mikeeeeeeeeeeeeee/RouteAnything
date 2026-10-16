import { useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useInView } from '@/lib/hooks';

export interface BarRow {
  key: string;
  label: ReactNode;
  value: number;
  /** text at the bar tip */
  display: string;
  color?: string;
  /** optional CI whisker [lo, hi] in value units */
  ci?: [number, number];
  note?: ReactNode;
  emphasis?: boolean;
}

/**
 * Horizontal bars that grow from one baseline when scrolled into view. Thin bars, 4px rounded data
 * ends, value at the tip, label in text ink. Hover shows the note.
 */
export function BarList({
  rows,
  max,
  min = 0,
  labelWidth = 220,
  barHeight = 18,
  gap = 14,
  ticks,
  tickFormat = (v: number) => String(v),
  className = '',
}: {
  rows: BarRow[];
  max: number;
  min?: number;
  labelWidth?: number;
  barHeight?: number;
  gap?: number;
  ticks?: number[];
  tickFormat?: (v: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const [hover, setHover] = useState<string | null>(null);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const zero = pct(Math.max(min, 0));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="grid" style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr)`, rowGap: gap }}>
        {rows.map((r, i) => {
          const from = Math.min(zero, pct(r.value));
          const width = Math.abs(pct(r.value) - zero);
          const neg = r.value < 0;
          const on = hover === r.key;
          return (
            <div key={r.key} className="contents" onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}>
              <div className={`flex items-center pr-4 font-sans text-[13.5px] leading-tight ${r.emphasis ? 'font-semibold text-ink' : 'text-ink-2'}`}>
                {r.label}
              </div>
              <div className="relative" style={{ height: barHeight + 6 }}>
                <div className="absolute inset-y-0 w-px bg-rule-2" style={{ left: `${zero}%` }} />
                <motion.div
                  className="absolute top-[3px]"
                  style={{
                    left: `${from}%`,
                    height: barHeight,
                    background: r.color ?? 'var(--ink-3)',
                    borderRadius: neg ? '4px 0 0 4px' : '0 4px 4px 0',
                    transformOrigin: neg ? 'right center' : 'left center',
                    opacity: hover && !on ? 0.45 : 1,
                    transition: 'opacity .25s',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: inView ? `${width}%` : 0 }}
                  transition={{ duration: 1.1, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                />
                {r.ci && (
                  <motion.div
                    className="absolute top-1/2 h-px bg-ink"
                    style={{ left: `${pct(r.ci[0])}%`, width: `${pct(r.ci[1]) - pct(r.ci[0])}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 0.8 : 0 }}
                    transition={{ delay: 0.9 + 0.08 * i }}
                  >
                    <span className="absolute -top-[5px] left-0 h-[11px] w-px bg-ink" />
                    <span className="absolute -top-[5px] right-0 h-[11px] w-px bg-ink" />
                  </motion.div>
                )}
                <motion.span
                  className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[12.5px] tabular-nums ${r.emphasis ? 'font-semibold text-ink' : 'text-ink-2'}`}
                  style={
                    neg
                      ? { right: `${100 - from + 0.8}%` }
                      : { left: `calc(${Math.max(pct(r.value), r.ci ? pct(r.ci[1]) : 0)}% + 8px)` }
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inView ? 1 : 0 }}
                  transition={{ delay: 0.7 + 0.08 * i }}
                >
                  {r.display}
                </motion.span>
              </div>
              {r.note && on && (
                <div className="col-span-2 -mt-2 pl-[2px] font-sans text-[12px] text-ink-3" style={{ paddingLeft: labelWidth }}>
                  {r.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {ticks && (
        <div className="relative mt-2 h-5" style={{ marginLeft: labelWidth }}>
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 font-mono text-[11px] text-ink-3" style={{ left: `${pct(t)}%` }}>
              {tickFormat(t)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
