import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Slider } from '@/components/ui/Slider';
import { MEMORY } from '@/data/results';
import { useInView } from '@/lib/hooks';
import { tex } from '@/lib/tex';
import { useTokens } from '@/theme/tokens';
import { TexLabel, mono, sans, scale } from './svg';

// Table 17: the same hidden-test-written record store against two priors. Bars: probing-predicted
// gain (Eq. 13, hollow) and realised gain on test with its interval (solid).

export function MemoryPriors() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const X = scale(-0.24, 0.66, 0, 100);
  const zero = X(0);
  return (
    <div ref={ref} className="space-y-7">
      {MEMORY.priors.map((p, i) => {
        const pos = p.predicted > 0;
        const color = pos ? 'var(--blue)' : 'var(--amber)';
        return (
          <div key={p.prior}>
            <div className="mb-2 flex items-baseline gap-3">
              <span className="font-sans text-[14px] font-semibold text-ink">vs. {p.prior}</span>
              <span className="font-sans text-[12px] text-ink-3">{pos ? 'memory gains' : 'memory loses'}</span>
            </div>
            {[
              { k: 'pred', v: p.predicted, label: 'predicted, Eq. (13)', solid: false, ci: null as null | [number, number] },
              { k: 'real', v: p.realized[0], label: 'realised on test', solid: true, ci: [p.realized[1], p.realized[2]] as [number, number] },
            ].map((r, j) => (
              <div key={r.k} className="grid grid-cols-[128px_minmax(0,1fr)] items-center gap-3 py-1">
                <span className="font-sans text-[12px] text-ink-3">{r.label}</span>
                <div className="relative h-7">
                  <div className="absolute inset-y-[-6px] w-px bg-ink-3" style={{ left: `${zero}%` }} />
                  <motion.div
                    className="absolute top-1 h-5"
                    style={{
                      background: r.solid ? color : 'transparent',
                      border: r.solid ? 'none' : `1.5px solid ${pos ? 'var(--blue)' : 'var(--amber)'}`,
                      borderRadius: r.v < 0 ? '4px 0 0 4px' : '0 4px 4px 0',
                      left: r.v < 0 ? undefined : `${zero}%`,
                      right: r.v < 0 ? `${100 - zero}%` : undefined,
                      opacity: r.solid ? 1 : 0.85,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: inView ? `${Math.abs(X(r.v) - zero)}%` : 0 }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.3 + j * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <motion.span
                    className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[12.5px] ${r.solid ? 'font-semibold text-ink' : 'text-ink-2'}`}
                    style={r.v < 0 ? { left: `calc(${zero}% + 8px)` } : { left: `calc(${X(r.v)}% + 8px)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 1 : 0 }}
                    transition={{ delay: 1 + i * 0.3 }}
                  >
                    {r.v > 0 ? '+' : '−'}
                    {Math.abs(r.v).toFixed(3)}
                    {r.ci && (
                      <span className="ml-1 font-normal text-ink-3">
                        [{r.ci[0] > 0 ? '+' : '−'}
                        {Math.abs(r.ci[0]).toFixed(3)}, {r.ci[1] > 0 ? '+' : '−'}
                        {Math.abs(r.ci[1]).toFixed(3)}]
                      </span>
                    )}
                  </motion.span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      <div className="grid grid-cols-[128px_minmax(0,1fr)] gap-3">
        <span />
        <div className="relative h-4 font-mono text-[10.5px] text-ink-3">
          {[-0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4].map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${X(t)}%` }}>
              {t > 0 ? `+${t}` : t}
            </span>
          ))}
        </div>
      </div>
      <p className="font-sans text-[12px] text-ink-3">per-round surplus over the prior, at each prior&rsquo;s own efficiency</p>
    </div>
  );
}

// A covered cell helps exactly when its erroneous write fraction is below g_I / (g_I - g_W).
const VW = 460;
const VH = 250;
const PL = 46;
const PR = 440;
const PT = 16;
const PB = 206;

export function WriteThreshold() {
  const tk = useTokens();
  const [gi, setGi] = useState(60); // g^I, in hundredths
  const [gw, setGw] = useState(45); // -g^W, in hundredths
  const [e, setE] = useState(30); // e_j in %
  const gI = gi / 100;
  const gW = -gw / 100;
  const ee = e / 100;
  const contrib = (x: number) => (1 - x) * gI + x * gW;
  const star = gI / (gI - gW);
  const X = scale(0, 1, PL, PR);
  const Y = scale(-1, 1, PB, PT);
  const helps = contrib(ee) > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="Contribution of a covered cell as a function of its erroneous write fraction">
        <rect x={X(0)} y={PT} width={X(Math.min(1, star)) - X(0)} height={PB - PT} fill="var(--teal-wash)" opacity={0.8} />
        <line x1={PL} y1={Y(0)} x2={PR} y2={Y(0)} stroke="var(--ink-3)" />
        <line x1={PL} y1={PT} x2={PL} y2={PB} stroke="var(--ink-4)" />
        <line x1={X(0)} y1={Y(contrib(0))} x2={X(1)} y2={Y(contrib(1))} stroke="var(--ink)" strokeWidth={2.2} />
        {star <= 1 && (
          <g>
            <line x1={X(star)} y1={PT} x2={X(star)} y2={PB} stroke="var(--teal)" strokeDasharray="4 4" />
            <TexLabel x={X(star) + 8} y={PT + 14} t={`e^\\star=${star.toFixed(2)}`} anchor="start" size={13.5} color="var(--teal)" w={120} />
          </g>
        )}
        <motion.circle animate={{ cx: X(ee), cy: Y(contrib(ee)) }} r={7} fill={helps ? 'var(--teal)' : 'var(--coral)'} stroke="var(--surface)" strokeWidth={2.2} transition={{ type: 'spring', stiffness: 260, damping: 26 }} />
        <TexLabel x={X(0) + 6} y={Y(contrib(0)) - 14} t="g^I" anchor="start" size={14} color="var(--ink-2)" w={40} />
        <TexLabel x={X(1) - 6} y={Y(contrib(1)) + 16} t="g^W" anchor="end" size={14} color="var(--ink-2)" w={40} />
        <text x={PR} y={VH - 4} textAnchor="end" fontSize={11.5} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          erroneous write fraction e →
        </text>
        <text x={PL - 8} y={Y(0) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" style={mono}>
          0
        </text>
        <text x={X(0.03)} y={PB - 10} fontSize={11.5} fill="var(--teal)" style={sans} fontWeight={600}>
          the cell helps
        </text>
      </svg>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-rule bg-surface p-4">
          <div className="smallcaps text-[10px] text-ink-3">this cell&rsquo;s contribution</div>
          <div className={`mt-1 font-display text-[40px] font-semibold leading-none ${helps ? 'text-teal' : 'text-coral'}`}>
            {contrib(ee) >= 0 ? '+' : '−'}
            {Math.abs(contrib(ee)).toFixed(2)}
          </div>
          <div className="mt-2 text-[13.5px] text-ink-2" dangerouslySetInnerHTML={{ __html: tex('(1-e_j)\\,g_j^I+e_j\\,g_j^W') }} />
        </div>
        <Row label="right record: gain" value={`g^I = +${gI.toFixed(2)}`}>
          <Slider value={gi} onChange={setGi} max={100} color={tk.blue} ariaLabel="gain when informative" />
        </Row>
        <Row label="wrong record: loss" value={`g^W = ${gW.toFixed(2)}`}>
          <Slider value={gw} onChange={setGw} max={100} color={tk.amber} ariaLabel="loss when erroneous" />
        </Row>
        <Row label="share of wrong records" value={`e = ${ee.toFixed(2)}`}>
          <Slider value={e} onChange={setE} max={100} color={helps ? tk.teal : tk.coral} ariaLabel="erroneous write fraction" />
        </Row>
      </div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="smallcaps text-[9.5px] text-ink-3">{label}</span>
        <span className="whitespace-nowrap text-[13px] text-ink" dangerouslySetInnerHTML={{ __html: tex(value) }} />
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function SignAgreement() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const rows = [
    { label: 'Eq. (13), predicted on probing', right: MEMORY.signAgreement.right, color: 'var(--blue)' },
    { label: 'always predict improvement', right: MEMORY.alwaysImprove.right, color: 'var(--slate)' },
  ];
  return (
    <div ref={ref} className="space-y-4">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="mb-1 flex items-baseline justify-between font-sans text-[12.5px]">
            <span className="text-ink-2">{r.label}</span>
            <span className="font-mono text-ink">
              {r.right}/{MEMORY.signAgreement.of} · {((r.right / MEMORY.signAgreement.of) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-rule">
            <motion.div
              className="h-full rounded-full"
              style={{ background: r.color }}
              initial={{ width: 0 }}
              animate={{ width: inView ? `${(r.right / MEMORY.signAgreement.of) * 100}%` : 0 }}
              transition={{ duration: 1.1, delay: 0.2 + i * 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
