import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import TextType from '@/components/reactbits/TextType/TextType';
import { useInView, useReducedMotion } from '@/lib/hooks';
import { tex } from '@/lib/tex';
import { useTokens } from '@/theme/tokens';
import { TexLabel, mono, sans } from './svg';

// Proposition 3 acted out on a schematic price path. Routers g_1..g_K come from the fitted price
// path on sample A, ordered by price: value falls and efficiency rises along k. On a fresh sample B
// they are tested in that order and testing stops at the first failure; the last router that passed
// is certified (the reference if g_1 fails). The order fixes the testing sequence, so no
// multiplicity correction is needed.

const K = 6;
const TRUE_Q = [0.052, 0.034, 0.013, -0.003, -0.018, -0.04];
const EFF = [3.1, 7.4, 12.6, 19.4, 24.8, 28.2];
const N = 3540; // half of the probing tasks, as in the paper's splits
const SD = 0.26; // per-task spread of V - Y_B (illustrative)
const ALPHA = 0.05;
const SE = SD / Math.sqrt(N);
const THRESH = SD * Math.sqrt((2 * Math.log(1 / ALPHA)) / N);
const STEP_MS = 720;

// Box-Muller from a seeded generator
function gauss(seed: number) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1e9) / 1e9;
  };
  return () => {
    const u = Math.max(1e-9, next());
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

const pval = (q: number) => Math.exp((-N * Math.max(0, q) ** 2) / (2 * SD * SD));
const fmtP = (p: number) => (p < 1e-4 ? `${(p / 10 ** Math.floor(Math.log10(p))).toFixed(1)}\\times 10^{${Math.floor(Math.log10(p))}}` : p.toFixed(3));

const VW = 760;
const VH = 345;
const COL0 = 168;
const COLW = (VW - COL0 - 20) / K;
const colX = (k: number) => COL0 + COLW * k + COLW / 2;
const QMAX = 0.075;
const QMIN = -0.06;
const ZY = (q: number) => 162 + ((QMAX - q) / (QMAX - QMIN)) * 150;

export function CertificationRun() {
  const tk = useTokens();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-80px', true);
  const reduced = useReducedMotion();
  const [draw, setDraw] = useState(1);
  const [step, setStep] = useState(0); // routers tested so far
  const [history, setHistory] = useState<{ k: number; held: boolean }[]>([]);

  const qhat = useMemo(() => {
    const g = gauss(draw * 7919 + 17);
    return TRUE_Q.map((q) => q + SE * g());
  }, [draw]);
  const pass = qhat.map((q) => pval(q) <= ALPHA);
  const firstFail = pass.findIndex((p) => !p);
  const stopAt = firstFail === -1 ? K : firstFail + 1; // number of routers tested
  const certified = firstFail === -1 ? K - 1 : firstFail - 1; // -1 = reference
  const done = step >= stopAt;

  // run the test sequence
  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setStep(stopAt);
      return;
    }
    if (step >= stopAt) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 500 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [inView, step, stopAt, reduced]);

  // record the outcome once a draw finishes
  useEffect(() => {
    if (!done) return;
    setHistory((h) => (h.length >= draw ? h : [...h, { k: certified, held: certified < 0 || TRUE_Q[certified] >= 0 }]));
  }, [done, draw, certified]);

  const redraw = useCallback(() => {
    setDraw((d) => d + 1);
    setStep(0);
  }, []);

  const heldCount = history.filter((h) => h.held).length;

  return (
    <div ref={ref}>
      <div>
        <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full overflow-visible" role="img" aria-label="Fixed-sequence certification of six routers on a price path">
          {/* price axis */}
          <line x1={COL0 - 4} y1={118} x2={VW - 16} y2={118} stroke="var(--ink-4)" strokeWidth={1} markerEnd="url(#cr-arr)" />
          <defs>
            <marker id="cr-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,1 L9,5 L0,9 z" fill="var(--ink-3)" />
            </marker>
          </defs>
          <text x={VW - 16} y={134} textAnchor="end" fontSize={11.5} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            along the price path: fitted value falls, efficiency rises
          </text>

          {/* reference fallback */}
          <g>
            <rect x={14} y={38} width={124} height={56} rx={12} fill={certified < 0 && done ? 'var(--amber-wash)' : 'var(--surface)'} stroke="var(--amber)" strokeWidth={1.5} />
            <TexLabel x={76} y={58} t="g_B" size={17} color="var(--amber)" w={60} />
            <text x={76} y={84} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={sans}>
              returned if p₁ &gt; α
            </text>
          </g>

          {/* evidence panel: zero line and threshold */}
          <line x1={COL0 - 8} y1={ZY(0)} x2={VW - 16} y2={ZY(0)} stroke="var(--ink-4)" />
          <line x1={COL0 - 8} y1={ZY(THRESH)} x2={VW - 16} y2={ZY(THRESH)} stroke="var(--teal)" strokeDasharray="5 4" />
          <TexLabel x={COL0 - 12} y={ZY(THRESH) - 6} t="\text{pass: } p_k\le\alpha" anchor="end" size={12} color="var(--teal)" w={140} />
          <TexLabel x={COL0 - 12} y={ZY(0) + 14} t="\hat Q_k=0" anchor="end" size={12} color="var(--ink-3)" w={120} />
          <TexLabel x={76} y={ZY(-0.035)} t="\hat Q_k\ \text{on }\mathcal B" size={13} color="var(--ink-2)" w={130} />
          <text x={76} y={ZY(-0.035) + 20} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={sans}>
            n = 3,540 fresh tasks
          </text>

          {Array.from({ length: K }).map((_, k) => {
            const tested = k < step;
            const ok = pass[k];
            const isCert = done && k === certified;
            const untested = done && k >= stopAt;
            const color = !tested ? 'var(--rule-2)' : ok ? 'var(--teal)' : 'var(--coral)';
            const q = qhat[k];
            return (
              <g key={k}>
                {/* router chip */}
                <rect
                  x={colX(k) - 30}
                  y={44}
                  width={60}
                  height={44}
                  rx={11}
                  fill={isCert ? 'var(--teal)' : tested && ok ? 'var(--teal-wash)' : tested ? 'var(--coral-wash)' : 'var(--surface)'}
                  stroke={isCert ? 'var(--teal)' : color}
                  strokeWidth={isCert ? 2 : 1.4}
                  strokeDasharray={untested ? '4 3' : undefined}
                  style={{ transition: 'all .35s' }}
                />
                <TexLabel x={colX(k)} y={60} t={`g_${k + 1}`} size={16} color={isCert ? 'var(--surface)' : untested ? 'var(--ink-4)' : 'var(--ink)'} w={50} />
                <text x={colX(k)} y={80} textAnchor="middle" fontSize={10} fill={isCert ? 'var(--surface)' : 'var(--ink-3)'} style={mono}>
                  {EFF[k]}×
                </text>
                {/* verdict */}
                <AnimatePresence>
                  {tested && (
                    <motion.text
                      key={`${draw}-${k}`}
                      x={colX(k)}
                      y={30}
                      textAnchor="middle"
                      fontSize={17}
                      fontWeight={700}
                      fill={ok ? 'var(--teal)' : 'var(--coral)'}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                      style={sans}
                    >
                      {ok ? '✓' : '✗'}
                    </motion.text>
                  )}
                </AnimatePresence>
                {untested && (
                  <text x={colX(k)} y={30} textAnchor="middle" fontSize={14} fill="var(--ink-4)" style={sans}>
                    –
                  </text>
                )}
                {/* evidence bar */}
                <line x1={colX(k)} y1={ZY(QMAX)} x2={colX(k)} y2={ZY(QMIN)} stroke="var(--rule)" />
                <motion.rect
                  x={colX(k) - 9}
                  width={18}
                  rx={4}
                  fill={color}
                  initial={false}
                  animate={{
                    y: tested ? Math.min(ZY(q), ZY(0)) : ZY(0),
                    height: tested ? Math.abs(ZY(q) - ZY(0)) : 0,
                  }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
                {tested && (
                  <text x={colX(k)} y={q >= 0 ? ZY(q) - 8 : ZY(q) + 16} textAnchor="middle" fontSize={10.5} fill="var(--ink-2)" style={mono}>
                    {q >= 0 ? '+' : ''}
                    {q.toFixed(3)}
                  </text>
                )}
                {tested && (
                  <TexLabel x={colX(k)} y={ZY(QMIN) + 18} t={`p=${fmtP(pval(q))}`} size={11} color={ok ? 'var(--teal)' : 'var(--coral)'} w={COLW} />
                )}
              </g>
            );
          })}

          {/* certified bracket */}
          {done && certified >= 0 && (
            <motion.path
              key={`br-${draw}`}
              d={`M${colX(0) - 30},96 L${colX(0) - 30},104 L${colX(certified) + 30},104 L${colX(certified) + 30},96`}
              fill="none"
              stroke="var(--teal)"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </svg>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
        <button
          type="button"
          onClick={redraw}
          disabled={!done}
          className="group flex h-12 items-center justify-center gap-2 self-start rounded-full bg-ink px-4 font-sans text-[13.5px] font-medium text-bg transition-opacity disabled:opacity-40"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
            <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" />
          </svg>
          Draw a fresh sample <span dangerouslySetInnerHTML={{ __html: tex('\\mathcal B') }} />
        </button>
        <div className="min-h-[96px] rounded-xl border border-rule bg-surface p-3 font-mono text-[12px] leading-relaxed text-ink-2">
          <div className="smallcaps mb-1 text-[9.5px] text-ink-3">result · draw {draw}</div>
          {done ? (
            <TextType
              key={draw}
              text={
                certified < 0
                  ? 'g1 fails: return the reference, which meets the floor by definition.'
                  : `certified g${certified + 1}: ${EFF[certified]}× fitted efficiency; tested ${stopAt} of ${K}, stopped at the first failure.`
              }
              typingSpeed={16}
              loop={false}
              showCursor
              cursorCharacter="▍"
              cursorColor={tk.accent}
            />
          ) : (
            <span className="text-ink-3">testing g{Math.min(K, step + 1)} …</span>
          )}
        </div>
        <div className="rounded-xl border border-rule bg-surface p-3">
          <div className="smallcaps text-[9.5px] text-ink-3">certified router met the true floor</div>
          <div className="mt-1 font-display text-[30px] font-semibold leading-none text-ink">
            {heldCount}
            <span className="text-[18px] text-ink-3"> / {history.length}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-[3px]">
            {history.slice(-40).map((h, i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: h.held ? 'var(--teal)' : 'var(--coral)' }} title={h.k < 0 ? 'reference' : `g${h.k + 1}`} />
            ))}
          </div>
          <p className="mt-2 font-sans text-[11px] leading-snug text-ink-3">
            The guarantee: P(certified router breaks the floor) ≤ α = 0.05, for the law that generated <span dangerouslySetInnerHTML={{ __html: tex('\\mathcal B') }} />.
          </p>
        </div>
      </div>
    </div>
  );
}
