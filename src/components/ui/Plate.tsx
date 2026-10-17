import { useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSymDelegation } from '@/components/math/Sym';

interface PlateProps {
  /** e.g. "2" -> "Fig. 2" */
  fig: string;
  title: ReactNode;
  /** right-aligned controls in the header (segmented controls, sliders) */
  controls?: ReactNode;
  caption?: ReactNode;
  /** provenance badge: the paper's own numbers, or an illustration */
  source?: { kind: 'data'; ref: string } | { kind: 'schematic'; note?: string };
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}

/** A figure plate: numbered title, the live figure, a caption that says where the numbers come from. */
export function Plate({ fig, title, controls, caption, source, children, className = '', bodyClassName = '', id }: PlateProps) {
  const capRef = useRef<HTMLDivElement>(null);
  useSymDelegation(capRef);
  return (
    <motion.figure
      id={id}
      className={`plate relative scroll-mt-24 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-rule px-5 py-4 md:px-7">
        <span className="smallcaps text-[11px] font-semibold text-accent">Fig. {fig}</span>
        <span className="font-display text-[21px] font-semibold leading-tight text-ink">{title}</span>
        {source && (
          <span
            className={`smallcaps rounded-full border px-2 py-[3px] text-[9.5px] ${
              source.kind === 'data' ? 'border-teal/40 bg-teal-wash text-ink-2' : 'border-rule-2 bg-surface-2 text-ink-3'
            }`}
          >
            {source.kind === 'data' ? `Paper data · ${source.ref}` : `Schematic${source.note ? ` · ${source.note}` : ''}`}
          </span>
        )}
        {controls && <div className="ml-auto flex flex-wrap items-center gap-3">{controls}</div>}
      </div>
      <div className={`relative px-4 py-5 md:px-7 md:py-7 ${bodyClassName}`}>{children}</div>
      {caption && (
        <figcaption ref={capRef} className="border-t border-rule bg-surface-2/60 px-5 py-4 font-serif text-[14.5px] leading-[1.62] text-ink-2 md:px-7">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}
