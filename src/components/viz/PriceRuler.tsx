import { motion } from 'motion/react';
import { PRICES } from '@/data/results';
import { TexLabel, logScale, mono, sans } from './svg';

// Corollary 6 on both testbeds, in the paper's numbers (Finding 6, App. C.2). Prices are in units of
// the reference efficiency. The admission price lambda^B caps what a fallback dollar can earn; if it
// lies below the floor price lambda_eps, the zero-loss router never calls the reference.

const VW = 760;
const VH = 330;
const L = 190;
const R = 730;
const X = logScale(0.7, 40, L, R);

/** a price in units of eta_B, as the paper states it */
const fmt = (v: number) => String(+v.toFixed(2));

const CRB = { lambdaB: PRICES.crb.lambdaBRel, lambdaEps: PRICES.crb.lambdaEpsRel, etaStar: PRICES.crb.etaStarRel };
const RB = { lambdaB: PRICES.rb.lambdaBRel, lambdaEps: PRICES.rb.lambdaEpsRel };

function Row({
  y,
  name,
  lambdaB,
  lambdaEps,
  etaStar,
  verdict,
}: {
  y: number;
  name: string;
  lambdaB: number;
  lambdaEps: number;
  etaStar?: number;
  verdict: 'free' | 'needed';
}) {
  const needed = verdict === 'needed';
  return (
    <g>
      <text x={20} y={y + 5} fontSize={15} fontWeight={650} fill="var(--ink)" style={sans}>
        {name}
      </text>
      <motion.text
        x={20}
        y={y + 26}
        fontSize={12}
        fontWeight={600}
        fill={needed ? 'var(--amber)' : 'var(--blue)'}
        style={sans}
        key={verdict}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 20 }}
      >
        {needed ? 'reference needed' : 'reference-free'}
      </motion.text>
      {/* the range of prices at which a reference-calling action can be bought */}
      <motion.rect
        x={X(0.7)}
        y={y - 16}
        height={32}
        rx={6}
        fill="var(--amber-wash)"
        animate={{ width: X(Math.min(40, lambdaB)) - X(0.7) }}
        transition={{ type: 'spring', stiffness: 160, damping: 24 }}
      />
      <line x1={X(0.7)} y1={y} x2={R} y2={y} stroke="var(--ink-4)" strokeWidth={1.2} />
      {/* eta_B */}
      <rect x={X(1) - 5} y={y - 5} width={10} height={10} fill="var(--ink-2)" rx={1.5} />
      <TexLabel x={X(1)} y={y + 30} t="\eta_B" size={12.5} color="var(--ink-3)" w={40} />
      {/* lambda^B */}
      <motion.g animate={{ x: X(Math.min(40, lambdaB)) }} transition={{ type: 'spring', stiffness: 160, damping: 24 }}>
        <line x1={0} y1={y - 22} x2={0} y2={y + 22} stroke="var(--amber)" strokeWidth={3} strokeLinecap="round" />
        <TexLabel x={0} y={y - 34} t={`\\lambda^B=${fmt(lambdaB)}`} size={13} color="var(--amber)" w={110} />
      </motion.g>
      {/* lambda_eps */}
      <g transform={`translate(${X(lambdaEps)}, ${y})`}>
        <rect x={-7} y={-7} width={14} height={14} transform="rotate(45)" fill="var(--blue)" stroke="var(--surface)" strokeWidth={2} />
      </g>
      <TexLabel x={X(lambdaEps)} y={y + 30} t={`\\lambda_\\epsilon=${fmt(lambdaEps)}`} size={12.5} color="var(--blue)" w={110} />
      {etaStar && (
        <g>
          <circle cx={X(etaStar)} cy={y} r={7} fill="var(--surface)" stroke="var(--ink-2)" strokeWidth={1.6} />
          <TexLabel x={X(etaStar)} y={y - 30} t={`\\eta^\\star=${etaStar}`} size={12.5} color="var(--ink-2)" w={90} />
        </g>
      )}
    </g>
  );
}

export function PriceRuler() {
  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="Admission price and floor price on two benchmarks">
        <Row y={92} name="CodeRouterBench" lambdaB={CRB.lambdaB} lambdaEps={CRB.lambdaEps} etaStar={CRB.etaStar} verdict="free" />
        <Row y={226} name="RouterBench" lambdaB={RB.lambdaB} lambdaEps={RB.lambdaEps} verdict="needed" />
        {/* axis */}
        {[1, 3, 10, 30].map((t) => (
          <g key={t}>
            <line x1={X(t)} y1={290} x2={X(t)} y2={296} stroke="var(--ink-4)" />
            <text x={X(t)} y={312} textAnchor="middle" fontSize={11.5} fill="var(--ink-3)" style={mono}>
              {t}
            </text>
          </g>
        ))}
        <line x1={L} y1={290} x2={R} y2={290} stroke="var(--ink-4)" />
        <TexLabel x={R} y={VH - 8} t="\text{price } \lambda \text{ in units of } \eta_B \text{ (log scale)}" anchor="end" size={13} color="var(--ink-3)" w={320} />
      </svg>
    </div>
  );
}
