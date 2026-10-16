import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { PORTFOLIO_EXAMPLE } from '@/data/results';
import { useInView } from '@/lib/hooks';
import { M } from '@/components/math/M';
import { TexLabel, sans } from './svg';

// Finding 3. Left: why residual coverage misprices a candidate. Adding m to S moves some tasks from
// "fall back to B" to "m passes", so the tasks that still reach B, and their value and cost, change.
// Right: the paper's example, Qwen3.5-Plus added to the pooled Qwen3-Max portfolio.

const VW = 470;
const VH = 250;
const X0 = 70;
const X1 = 450;
const SPASS = 0.46; // share of tasks some member of S passes (schematic)
const RM = 0.17; // residual coverage of m (schematic)

export function PortfolioShift() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-80px', true);
  const [added, setAdded] = useState(true);
  const on = inView && added;
  const w = X1 - X0;
  const sx = X0 + SPASS * w;
  const mx = sx + RM * w;

  return (
    <div ref={ref} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="smallcaps text-[10.5px] text-ink-3">who reaches the fallback</span>
          <button
            type="button"
            onClick={() => setAdded((a) => !a)}
            className="rounded-full border border-rule bg-surface px-3 py-1 font-sans text-[12px] text-ink-2 transition-colors hover:border-blue hover:text-blue"
          >
            {added ? 'Remove m' : 'Add m'}
          </button>
        </div>
        <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="Adding a model to a portfolio shrinks and changes the set of tasks that fall back to the reference">
          {/* row S */}
          <TexLabel x={X0 - 14} y={60} t="S" anchor="end" size={20} color="var(--ink)" w={40} />
          <rect x={X0} y={40} width={sx - X0} height={40} rx={6} fill="var(--blue)" />
          <text x={(X0 + sx) / 2} y={65} textAnchor="middle" fontSize={13} fill="#fff" fontWeight={600} style={sans}>
            S passes
          </text>
          <rect x={sx + 2} y={40} width={X1 - sx - 2} height={40} rx={6} fill="var(--amber-wash)" stroke="color-mix(in oklab, var(--amber) 45%, transparent)" />
          <TexLabel x={(sx + X1) / 2} y={60} t="\to B:\ v_{\rm miss},\ b" size={14} color="var(--ink-2)" w={200} />

          {/* row S+ */}
          <TexLabel x={X0 - 14} y={150} t="S^+" anchor="end" size={20} color="var(--ink)" w={40} />
          <rect x={X0} y={130} width={sx - X0} height={40} rx={6} fill="var(--blue)" />
          <text x={(X0 + sx) / 2} y={155} textAnchor="middle" fontSize={13} fill="#fff" fontWeight={600} style={sans}>
            S passes
          </text>
          <motion.rect
            x={sx + 2}
            y={130}
            height={40}
            rx={6}
            fill="var(--teal)"
            initial={{ width: 0 }}
            animate={{ width: on ? mx - sx - 2 : 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ delay: on ? 0.5 : 0 }}>
            <TexLabel x={(sx + mx) / 2} y={150} t="m" size={17} color="#fff" w={40} />
          </motion.g>
          <motion.rect
            y={130}
            height={40}
            rx={6}
            fill="var(--amber-wash)"
            stroke="color-mix(in oklab, var(--amber) 45%, transparent)"
            initial={{ x: sx + 2, width: X1 - sx - 2 }}
            animate={{ x: on ? mx + 2 : sx + 2, width: on ? X1 - mx - 2 : X1 - sx - 2 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.g animate={{ x: on ? (mx + X1) / 2 : (sx + X1) / 2 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <TexLabel x={0} y={150} t={on ? "\\to B:\\ v'_{\\rm miss},\\ b'" : '\\to B:\\ v_{\\rm miss},\\ b'} size={14} color={on ? 'var(--accent)' : 'var(--ink-2)'} w={200} />
          </motion.g>

          {/* residual coverage bracket */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ delay: on ? 0.7 : 0 }}>
            <path d={`M${sx + 2},${180} L${sx + 2},${188} L${mx},${188} L${mx},${180}`} fill="none" stroke="var(--teal)" strokeWidth={1.6} />
            <TexLabel x={(sx + mx) / 2 + 30} y={206} t="\text{residual coverage } r_m(S)" size={13.5} color="var(--teal)" w={220} />
          </motion.g>
          <line x1={sx + 1} y1={84} x2={sx + 1} y2={126} stroke="var(--ink-4)" strokeDasharray="3 3" />
          <text x={X1} y={238} textAnchor="end" fontSize={11} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            tasks, ordered by who passes first (schematic)
          </text>
        </svg>
        <p className="mt-2 font-serif text-[14.5px] leading-[1.6] text-ink-3">
          The fallback population changes, and with it its value <M>{'v_{\\rm miss}'}</M> and cost <M>{'b'}</M>. Residual coverage keeps
          the old ones fixed; the paired gain measures both portfolios on the same tasks.
        </p>
      </div>

      <div>
        <div className="smallcaps mb-3 text-[10.5px] text-ink-3">the paper’s example, score per dollar</div>
        <div className="rounded-2xl border border-rule bg-surface p-5">
          <p className="font-sans text-[13.5px] leading-snug text-ink-2">
            Add <b className="text-ink">{PORTFOLIO_EXAMPLE.add}</b> to the {PORTFOLIO_EXAMPLE.to}.
          </p>
          <Example inView={inView} />
          <p className="mt-4 font-sans text-[12.5px] leading-snug text-ink-3">
            The new model&rsquo;s failure set is cheaper to send to the fallback: its fallback cost falls by{' '}
            {Math.round(PORTFOLIO_EXAMPLE.fallbackCostDrop * 100)}%. Adding a model lowers the miss-conditional value in 97% of
            CodeRouterBench comparisons.
          </p>
        </div>
      </div>
    </div>
  );
}

function Example({ inView }: { inView: boolean }) {
  // axis -3 .. +11 score per dollar
  const X = (v: number) => ((v + 3) / 14) * 100;
  const zero = X(0);
  const rows = [
    { key: 'pred', label: 'Residual coverage predicts', v: PORTFOLIO_EXAMPLE.predicted, color: 'var(--slate)', ci: null as null | [number, number] },
    { key: 'real', label: 'Paired gain, realised on held-out tasks', v: PORTFOLIO_EXAMPLE.realized, color: 'var(--teal)', ci: PORTFOLIO_EXAMPLE.ci },
  ];
  return (
    <div className="mt-5 space-y-5">
      {rows.map((r, i) => (
        <div key={r.key}>
          <div className="mb-1.5 font-sans text-[12.5px] text-ink-3">{r.label}</div>
          <div className="relative h-8">
            <div className="absolute inset-y-[-4px] w-px bg-ink-3" style={{ left: `${zero}%` }} />
            <motion.div
              className="absolute top-1 h-6"
              style={{
                background: r.color,
                borderRadius: r.v < 0 ? '4px 0 0 4px' : '0 4px 4px 0',
                left: r.v < 0 ? undefined : `${zero}%`,
                right: r.v < 0 ? `${100 - zero}%` : undefined,
              }}
              initial={{ width: 0 }}
              animate={{ width: inView ? `${Math.abs(X(r.v) - zero)}%` : 0 }}
              transition={{ duration: 1, delay: 0.3 + i * 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
            {r.ci && (
              <motion.div
                className="absolute top-1/2 h-px bg-ink"
                style={{ left: `${X(r.ci[0])}%`, width: `${X(r.ci[1]) - X(r.ci[0])}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: inView ? 1 : 0 }}
                transition={{ delay: 1.4 }}
              >
                <span className="absolute -top-[6px] left-0 h-[13px] w-px bg-ink" />
                <span className="absolute -top-[6px] right-0 h-[13px] w-px bg-ink" />
              </motion.div>
            )}
            <motion.span
              className="absolute top-1/2 -translate-y-1/2 font-mono text-[14px] font-semibold text-ink"
              style={r.v < 0 ? { right: `${100 - X(r.v) + 2}%` } : { left: `calc(${X(r.ci ? r.ci[1] : r.v)}% + 10px)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: inView ? 1 : 0 }}
              transition={{ delay: 1.2 + i * 0.35 }}
            >
              {r.v > 0 ? '+' : ''}
              {r.v.toFixed(1)}
              {r.ci && <span className="ml-1 font-normal text-ink-3">[{r.ci[0]}, {r.ci[1]}]</span>}
            </motion.span>
          </div>
        </div>
      ))}
      <div className="relative h-4 font-mono text-[10.5px] text-ink-3">
        {[-2, 0, 2, 4, 6, 8].map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: `${X(t)}%` }}>
            {t > 0 ? `+${t}` : t}
          </span>
        ))}
      </div>
    </div>
  );
}
