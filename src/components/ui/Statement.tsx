import { useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SpotlightCard from '@/components/reactbits/SpotlightCard/SpotlightCard';
import BorderGlow from '@/components/reactbits/BorderGlow/BorderGlow';
import DecryptedText from '@/components/reactbits/DecryptedText/DecryptedText';
import { useSymDelegation } from '@/components/math/Sym';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';

export type StatementKind = 'Lemma' | 'Theorem' | 'Proposition' | 'Corollary' | 'Definition';

interface Props {
  kind: StatementKind;
  n: string;
  name: string;
  /** where the full statement / proof lives in the paper */
  source?: string;
  id?: string;
  children: ReactNode;
  /** proof idea, revealed on demand */
  proof?: ReactNode;
  /** the paper's main theorem gets the glowing border */
  main?: boolean;
  className?: string;
}

/**
 * A formal result, set as a plate. The label decrypts in when it scrolls into view; the statement
 * keeps the paper's wording; the proof idea unfolds like a folded sheet.
 */
export function Statement({ kind, n, name, source, id, children, proof, main = false, className = '' }: Props) {
  const { theme } = useTheme();
  const tk = useTokens();
  const bodyRef = useRef<HTMLDivElement>(null);
  useSymDelegation(bodyRef);
  const [open, setOpen] = useState(false);

  const inner = (
    <div ref={bodyRef} className="relative">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-dashed border-rule-2 pb-4">
        <span className="smallcaps text-[12px] font-semibold text-accent">
          <DecryptedText text={`${kind} ${n}`} animateOn="view" sequential speed={38} characters="ΣΦΛΔΘΠΨΩαβγδεηκλμπστφ∂∇∞≤≥" />
        </span>
        <span className="font-display text-[23px] font-semibold italic leading-tight text-ink">{name}</span>
        {source && <span className="smallcaps ml-auto text-[10px] text-ink-3">{source}</span>}
      </div>
      <div className="statement-body pt-5 font-serif text-[17px] leading-[1.7] text-ink">{children}</div>
      {proof && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="group inline-flex items-center gap-2.5 rounded-full border border-rule bg-surface-2 px-3.5 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-accent hover:text-accent"
          >
            <span className={`grid h-4 w-4 place-items-center transition-transform duration-500 ${open ? 'rotate-45' : ''}`} aria-hidden>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M8 2.5v11M2.5 8h11" />
              </svg>
            </span>
            <span className="font-sans font-medium">{open ? 'Fold the proof idea' : 'Unfold the proof idea'}</span>
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="proof"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
                style={{ perspective: 900 }}
              >
                <motion.div
                  initial={{ rotateX: -78, y: -10 }}
                  animate={{ rotateX: 0, y: 0 }}
                  exit={{ rotateX: -60, y: -6 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: '50% 0%' }}
                  className="mt-4 rounded-2xl border border-rule bg-[repeating-linear-gradient(0deg,transparent_0,transparent_27px,var(--grid-strong)_27px,var(--grid-strong)_28px)] px-5 py-4 font-serif text-[15.5px] leading-[28px] text-ink-2"
                >
                  <span className="mr-2 font-display text-[18px] italic text-accent">Proof idea.</span>
                  {proof}
                  <span className="float-right mt-1 text-ink-3" aria-label="end of proof">∎</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  const cardStyle = {
    '--spotlight-card-surface': 'var(--surface)',
    '--spotlight-card-border': 'var(--rule)',
    '--spotlight-card-shadow': 'var(--shadow)',
  } as React.CSSProperties;

  if (main) {
    return (
      <div id={id} className={`scroll-mt-24 ${className}`}>
        <BorderGlow
          backgroundColor={tk.surface}
          borderRadius={22}
          glowRadius={36}
          glowIntensity={theme === 'dark' ? 1 : 0.8}
          edgeSensitivity={26}
          coneSpread={22}
          glowColor={theme === 'dark' ? '0 100 71' : '354 76 43'}
          colors={[tk.accent, tk.amber, tk.blue]}
          fillOpacity={theme === 'dark' ? 0.35 : 0.18}
          animated
        >
          <div className="p-6 md:p-8">{inner}</div>
        </BorderGlow>
      </div>
    );
  }

  return (
    <div id={id} className={`scroll-mt-24 ${className}`}>
      <SpotlightCard
        theme={theme}
        spotlightColor={tk.accent}
        intensity={theme === 'dark' ? 0.1 : 0.06}
        spotlightSize={420}
        borderGlow={0.5}
        className="!rounded-[22px] !p-6 md:!p-8"
        style={cardStyle}
      >
        {inner}
      </SpotlightCard>
    </div>
  );
}
