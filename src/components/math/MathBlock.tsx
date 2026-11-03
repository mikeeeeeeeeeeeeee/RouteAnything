import { useState } from 'react';
import { motion } from 'motion/react';
import { tex } from '@/lib/tex';
import { toast } from '@/components/ui/toast';

interface Props {
  /** TeX source, rendered in display mode */
  children: string;
  /** equation number as printed in the paper, e.g. "3" */
  n?: string;
  id?: string;
  className?: string;
  /** smaller type, for dense figure captions */
  compact?: boolean;
}

/**
 * A numbered display equation. The number sits in the right margin as in the paper; hovering the
 * line offers its LaTeX source.
 */
export function MathBlock({ children, n, id, className = '', compact = false }: Props) {
  const [hover, setHover] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(children).then(
      () => toast(`Copied the LaTeX of ${n ? `Eq. (${n})` : 'this equation'}`),
      () => {}
    );
  };
  return (
    <motion.div
      id={id}
      className={`math-block group relative my-6 grid grid-cols-[1fr_auto] items-center gap-4 ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`overflow-x-auto no-scrollbar text-center text-ink ${compact ? '[&_.katex]:text-[1.02em]' : ''}`}
        dangerouslySetInnerHTML={{ __html: tex(children, true) }}
      />
      <div className="flex min-w-[30px] items-center justify-end gap-2 sm:min-w-[52px]">
        <button
          type="button"
          onClick={copy}
          aria-label="Copy LaTeX"
          className={`smallcaps rounded-full border border-rule px-2 py-1 text-[10px] text-ink-3 transition-all duration-200 hover:border-accent hover:text-accent ${hover ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          TeX
        </button>
        {n && <span className="num text-[13px] text-ink-3">({n})</span>}
      </div>
    </motion.div>
  );
}
