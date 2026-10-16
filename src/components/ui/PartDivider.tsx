import { useRef } from 'react';
import Topography from '@/components/reactbits/Topography/Topography';
import FoldText from '@/components/reactbits/FoldText/FoldText';
import { useInView } from '@/lib/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';

/**
 * A chapter opener: contour lines (level sets of an objective) drift behind a folded-open title.
 * The WebGL layer mounts only near the viewport.
 */
export function PartDivider({ part, title, sub, id }: { part: string; title: string; sub: string; id?: string }) {
  const { theme } = useTheme();
  const tk = useTokens();
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, '300px');
  return (
    <div ref={ref} id={id} className="relative h-[460px] overflow-hidden border-y border-rule md:h-[520px]">
      <div className="absolute inset-0">
        {near && (
          <Topography
            key={theme}
            color={tk.accent}
            lightMode={theme === 'light'}
            lineCount={26}
            lineWidth={1.1}
            elevation={1.1}
            speed={0.18}
            glow={theme === 'dark' ? 0.7 : 0.3}
            fog={0.5}
            tilt={36}
            opacity={theme === 'dark' ? 0.9 : 0.75}
            mouseInteraction
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--bg)_86%,transparent)_0%,color-mix(in_oklab,var(--bg)_55%,transparent)_45%,transparent_75%)]" />
      <div className="pointer-events-none relative flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="smallcaps text-[11px] text-accent">{part}</span>
        <div className="mt-4 text-ink">
          <FoldText
            text={title}
            splitBy="word"
            trigger="scroll"
            fontSize="clamp(48px, 7.4vw, 104px)"
            fontWeight={500}
            stagger={0.09}
            duration={0.9}
            className="font-display italic tracking-[-0.02em]"
          />
        </div>
        <p className="mt-5 max-w-[560px] font-serif text-[18px] leading-relaxed text-ink-2">{sub}</p>
      </div>
    </div>
  );
}
