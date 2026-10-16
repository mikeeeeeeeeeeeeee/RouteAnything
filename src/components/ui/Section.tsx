import type { ReactNode } from 'react';
import StrokeText from '@/components/reactbits/StrokeText/StrokeText';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import BlurText from '@/components/reactbits/BlurText/BlurText';
import { useTokens } from '@/theme/tokens';

interface SectionProps {
  id: string;
  /** numeral, e.g. "1" -> drawn as §1 */
  n?: string;
  kicker: ReactNode;
  title: string;
  lede?: string;
  children: ReactNode;
  className?: string;
}

/** A chapter: a drawn section numeral, a kicker that names the result, a title, a lede. */
export function Section({ id, n, kicker, title, lede, children, className = '' }: SectionProps) {
  const tk = useTokens();
  return (
    <section id={id} className={`relative scroll-mt-20 py-24 md:py-32 ${className}`}>
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <header className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-[150px_minmax(0,1fr)]">
          <div className="relative h-[86px] md:h-auto">
            {n && (
              <StrokeText
                text={`§${n}`}
                trigger="scroll"
                fontFamily="'Cormorant Garamond Variable', serif"
                fontSize={112}
                fontWeight={500}
                letterSpacing={-2}
                strokeColor={tk.accent}
                fillColor={tk.ink}
                strokeWidth={1.1}
                drawDuration={1.5}
                fillMode="wipe"
                wipeFrom="bottom"
                className="-ml-2 -mt-6 block origin-top-left scale-[0.72] [font-variant-numeric:lining-nums] md:scale-100"
                style={{ fontVariantNumeric: 'lining-nums' }}
              />
            )}
          </div>
          <div className="max-w-[760px]">
            <div className="smallcaps mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-accent">{kicker}</div>
            <SplitText
              text={title}
              tag="h2"
              splitType="words"
              effect="blur"
              delay={45}
              duration={0.9}
              textAlign="left"
              rootMargin="-60px"
              className="display text-[clamp(38px,5.4vw,66px)] text-ink"
            />
            {lede && (
              <BlurText
                text={lede}
                animateBy="words"
                delay={14}
                stepDuration={0.32}
                className="mt-6 max-w-[680px] font-serif text-[19px] leading-[1.62] text-ink-2"
              />
            )}
          </div>
        </header>
        <div className="mt-14 md:mt-16">{children}</div>
      </div>
    </section>
  );
}

/** The reading column: prose sits in the right-hand grid track, aligned with the title. */
export function Prose({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 gap-x-10 md:grid-cols-[150px_minmax(0,1fr)] ${className}`}>
      <div className="hidden md:block" />
      <div className="prose-ra max-w-[720px] text-[17.5px] leading-[1.72] text-ink-2">{children}</div>
    </div>
  );
}

/** A margin note in the left track (desktop) or an inline aside (mobile). */
export function WithMargin({ note, children }: { note: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-[150px_minmax(0,1fr)]">
      <div className="smallcaps pt-1 text-[10.5px] leading-[1.6] text-ink-3 md:text-right">{note}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
