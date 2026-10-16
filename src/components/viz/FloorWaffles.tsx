import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import CountUp from '@/components/reactbits/CountUp/CountUp';
import { FLOOR_SPLITS } from '@/data/results';
import { useInView } from '@/lib/hooks';

// Finding 2 in the paper's own numbers: for 200 random halvings of the probing tasks, does the test
// set keep Delta V >= 0? One square per halving. (Which particular splits failed is not reported, so
// squares are filled in order; only the counts are data.)

const COLS = 20;
const ROWS = 10;

export function FloorWaffles() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-80px', true);
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div ref={ref} className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {FLOOR_SPLITS.map((f, fi) => {
        const share = f.held / f.of;
        const tone = f.key === 'certified' ? 'var(--teal)' : f.key === 'rounded' ? 'var(--amber)' : 'var(--coral)';
        return (
          <div
            key={f.key}
            onMouseEnter={() => setHover(f.key)}
            onMouseLeave={() => setHover(null)}
            className={`rounded-2xl border p-4 transition-colors ${hover === f.key ? 'border-rule-2 bg-surface' : 'border-transparent'}`}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[46px] font-semibold leading-none tabular-nums" style={{ color: tone }}>
                {inView ? <CountUp to={share * 100} decimals={share === 1 ? 0 : 1} duration={1.6} delay={0.25 * fi} /> : '0'}%
              </span>
            </div>
            <div className="mt-1 font-sans text-[14px] font-semibold text-ink">{f.label}</div>
            <div className="font-mono text-[11.5px] text-ink-3">
              {f.held} / {f.of} splits hold
            </div>
            <div
              className="mt-4 grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
              role="img"
              aria-label={`${f.held} of ${f.of} splits keep the floor`}
            >
              {Array.from({ length: COLS * ROWS }).map((_, i) => {
                const ok = i < f.held;
                return (
                  <motion.span
                    key={i}
                    className="aspect-square rounded-[2px]"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.25 * fi + (i % COLS) * 0.012 + Math.floor(i / COLS) * 0.03, duration: 0.3 }}
                    style={{ background: ok ? 'var(--teal)' : 'var(--coral-wash)', outline: ok ? 'none' : '1px solid color-mix(in oklab, var(--coral) 30%, transparent)', outlineOffset: -1 }}
                  />
                );
              })}
            </div>
            <p className="mt-3 font-sans text-[12px] leading-snug text-ink-3">{f.note}</p>
          </div>
        );
      })}
      <div className="col-span-full flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-[12px] text-ink-3">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[2px] bg-teal" /> test ΔV ≥ 0 (floor holds)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[2px] border border-coral/40 bg-coral-wash" /> floor violated
        </span>
        <span>one square = one random halving of the 7,080 probing tasks</span>
      </div>
    </div>
  );
}
