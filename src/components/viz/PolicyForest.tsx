import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { NINE_DIMS, POLICIES, type PolicyRow } from '@/data/results';
import { useInView } from '@/lib/hooks';
import { useTokens } from '@/theme/tokens';
import { TexLabel, logScale, mono, sans, scale } from './svg';

// The paper's Fig. 3 (Table 3), redrawn: three readings of the same ten policies on the 2,919-task
// CodeRouterBench test set. Points start at always-Opus and travel to their measured values.

const ROW_H = 34;
const TOP = 34;
const LABEL_W = 214;
const PANEL_GAP = 26;
const PANELS = [
  { key: 'eff', title: 'Dollar efficiency', unit: '\\eta/\\eta_B\\ \\text{(log)}', w: 250, scale: logScale(0.8, 45, 0, 250), ticks: [1, 3, 10, 30], ref: 1 },
  { key: 'cost', title: 'Cost per task', unit: '\\text{m\\$ per task (log)}', w: 190, scale: logScale(0.28, 15, 0, 190), ticks: [0.5, 1, 3, 10], ref: 11.655 },
  { key: 'dv', title: 'Quality change', unit: '\\Delta V\\ \\text{vs Opus}', w: 230, scale: scale(-0.065, 0.083, 0, 230), ticks: [-0.05, 0, 0.05], ref: 0 },
] as const;

const GROUP_COLOR: Record<PolicyRow['group'], string> = {
  ours: 'var(--blue)',
  inferred: 'var(--teal)',
  baseline: 'var(--slate)',
  oracle: 'var(--amber)',
  reference: 'var(--ink)',
};

type Partition = '21' | '9';


export function PolicyForest() {
  const tk = useTokens();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const [part, setPart] = useState<Partition>('21');
  const [hover, setHover] = useState<number | null>(null);

  // the 9-dimension partition reports only the unconstrained and zero-loss policies (Table 10)
  const rows = useMemo(
    () => (part === '9' ? POLICIES.filter((r) => r.group !== 'ours' || NINE_DIMS[r.label]).map((r) => NINE_DIMS[r.label] ?? r) : POLICIES),
    [part]
  );
  const W = LABEL_W + PANELS.reduce((s, p) => s + p.w + PANEL_GAP, 0);
  const H = TOP + rows.length * ROW_H + 46;
  let x0 = LABEL_W;
  const panelX = PANELS.map((p) => {
    const x = x0;
    x0 += p.w + PANEL_GAP;
    return x;
  });

  const value = (r: PolicyRow, key: string) => (key === 'eff' ? r.eff : key === 'cost' ? [r.cost, r.cost, r.cost] : r.dv);
  const fmt = (key: string, v: number) => (key === 'eff' ? `${v.toFixed(2)}×` : key === 'cost' ? `${v.toFixed(3)} m$` : `${v >= 0 ? '+' : ''}${v.toFixed(4)}`);

  return (
    <div ref={ref}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="smallcaps text-[10px] text-ink-3">states for our policies</span>
        <RubberSegment
          items={[
            { value: '21', label: '21 dimension × source cells' },
            { value: '9', label: '9 dimensions' },
          ]}
          value={part}
          onChange={(v) => setPart(v as Partition)}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="State partition"
        />
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[760px]" role="img" aria-label="Efficiency, cost and quality change of ten routing policies on the CodeRouterBench test set">
          {/* group bands */}
          <rect x={0} y={TOP} width={W} height={ROW_H * 3} fill="var(--blue-wash)" opacity={0.65} />
          <rect x={0} y={TOP + ROW_H * 3} width={W} height={ROW_H * 2} fill="var(--teal-wash)" opacity={0.65} />

          {PANELS.map((p, pi) => (
            <g key={p.key} transform={`translate(${panelX[pi]},0)`}>
              <text x={p.w / 2} y={16} textAnchor="middle" fontSize={13} fontWeight={650} fill="var(--ink)" style={sans}>
                {p.title}
              </text>
              {p.ticks.map((t) => (
                <g key={t}>
                  <line x1={p.scale(t)} y1={TOP} x2={p.scale(t)} y2={TOP + rows.length * ROW_H} stroke="var(--rule)" />
                  <text x={p.scale(t)} y={TOP + rows.length * ROW_H + 16} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
                    {p.key === 'dv' ? (t > 0 ? `+${t}` : t) : t}
                  </text>
                </g>
              ))}
              <line x1={p.scale(p.ref)} y1={TOP} x2={p.scale(p.ref)} y2={TOP + rows.length * ROW_H} stroke="var(--ink-3)" strokeDasharray="4 4" />
              <TexLabel x={p.w / 2} y={TOP + rows.length * ROW_H + 34} t={p.unit} size={12} color="var(--ink-3)" w={p.w} />

              {rows.map((r, i) => {
                const [v, lo, hi] = value(r, p.key);
                const cy = TOP + i * ROW_H + ROW_H / 2;
                const col = GROUP_COLOR[r.group];
                const startX = p.scale(p.ref);
                const dim = hover !== null && hover !== i;
                const diamond = r.group === 'oracle';
                const square = r.group === 'reference';
                return (
                  <g key={`${r.group}-${i}`} opacity={dim ? 0.3 : 1} style={{ transition: 'opacity .25s' }}>
                    {lo !== hi && (
                      <motion.line
                        y1={cy}
                        y2={cy}
                        stroke={col}
                        strokeWidth={1.6}
                        initial={{ x1: startX, x2: startX }}
                        animate={inView ? { x1: p.scale(lo), x2: p.scale(hi) } : {}}
                        transition={{ duration: 1.2, delay: 0.06 * i + 0.25 * pi, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                    <motion.g
                      initial={{ x: startX, y: cy }}
                      animate={inView ? { x: p.scale(v), y: cy } : {}}
                      transition={{ duration: 1.2, delay: 0.06 * i + 0.25 * pi, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {square ? (
                        <rect x={-5} y={-5} width={10} height={10} fill={col} stroke="var(--surface)" strokeWidth={2} />
                      ) : diamond ? (
                        <rect x={-5.5} y={-5.5} width={11} height={11} transform="rotate(45)" fill={col} stroke="var(--surface)" strokeWidth={2} />
                      ) : (
                        <circle r={5.2} fill={col} stroke="var(--surface)" strokeWidth={2} />
                      )}
                    </motion.g>
                    {hover === i && (
                      <text x={Math.min(p.w - 4, p.scale(v) + 10)} y={cy - 9} textAnchor={p.scale(v) > p.w - 70 ? 'end' : 'start'} fontSize={10.5} fill="var(--ink)" style={mono}>
                        {fmt(p.key, v)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* row labels + hover targets */}
          {rows.map((r, i) => {
            const cy = TOP + i * ROW_H + ROW_H / 2;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={0} y={cy - ROW_H / 2} width={W} height={ROW_H} fill="transparent" />
                <motion.text
                  key={r.label}
                  x={LABEL_W - 14}
                  y={cy + 4.5}
                  textAnchor="end"
                  fontSize={12.5}
                  fill={hover === i ? 'var(--ink)' : 'var(--ink-2)'}
                  fontWeight={r.note === 'zero-loss floor' ? 650 : 400}
                  style={sans}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {r.label}
                </motion.text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 font-sans text-[12px] text-ink-3">
        <Legend color="var(--blue)" label="cell policies (ours)" />
        <Legend color="var(--teal)" label="no oracle cell labels" />
        <Legend color="var(--slate)" label="baselines" />
        <Legend color="var(--amber)" label="per-task oracle (in-sample ceiling)" shape="diamond" />
        <Legend color="var(--ink)" label="always-Opus" shape="square" />
        <span>whiskers: paired 95% intervals · hover a row for values</span>
      </div>
    </div>
  );
}

function Legend({ color, label, shape = 'circle' }: { color: string; label: string; shape?: 'circle' | 'diamond' | 'square' }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block h-2.5 w-2.5 ${shape === 'circle' ? 'rounded-full' : ''} ${shape === 'diamond' ? 'rotate-45 scale-90' : ''}`}
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
