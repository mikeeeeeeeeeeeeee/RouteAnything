import { useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSymDelegation } from '@/components/math/Sym';

/** Text that is not needed to follow the page, folded behind one button. */
export function Fold({ label = 'What the paper says', children, className = '' }: { label?: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  useSymDelegation(body);
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group inline-flex items-center gap-2.5 rounded-full border border-rule bg-surface px-3.5 py-1.5 font-sans text-[13px] font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent"
      >
        <span className={`grid h-4 w-4 place-items-center transition-transform duration-500 ${open ? 'rotate-45' : ''}`} aria-hidden>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 2.5v11M2.5 8h11" />
          </svg>
        </span>
        {label}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="fold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div ref={body} className="prose-ra pt-5 text-[16.5px] leading-[1.7] text-ink-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
