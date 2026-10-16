import { useRef } from 'react';
import { motion } from 'motion/react';
import CursorGrid from '@/components/reactbits/CursorGrid/CursorGrid';
import VariableProximity from '@/components/reactbits/VariableProximity/VariableProximity';
import TrueFocus from '@/components/reactbits/TrueFocus/TrueFocus';
import StarBorder from '@/components/reactbits/StarBorder/StarBorder';
import Magnet from '@/components/reactbits/Magnet/Magnet';
import ShinyText from '@/components/reactbits/ShinyText/ShinyText';
import { DinkelbachFigure } from '@/components/viz/DinkelbachFigure';
import { InfRecLogo } from '@/components/ui/TopBar';
import { s, useSymDelegation } from '@/components/math/Sym';
import { tex } from '@/lib/tex';
import { paper } from '@/data/paper';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';
import { scrollToId } from '@/lib/scrollspy';

const EASE = [0.22, 1, 0.36, 1] as const;

const LEMMA = `\\eta-${s('etaB')} \\;=\\; \\frac{${s('Q')} + ${s('etaB')}\\,${s('S')}}{\\mathbb E[${s('D')}]}`;

export function Hero() {
  const { theme } = useTheme();
  const tk = useTokens();
  const titleRef = useRef<HTMLDivElement>(null);
  const formulaRef = useRef<HTMLDivElement>(null);
  useSymDelegation(formulaRef);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 1, delay, ease: EASE },
  });

  return (
    <section id="top" className="relative overflow-hidden pt-[64px]">
      {/* graph paper that lights up under the cursor */}
      <div className="pointer-events-none absolute inset-0">
        <CursorGrid
          key={theme}
          cellSize={44}
          color={tk.accent}
          gridColor={tk.ink}
          gridOpacity={theme === 'dark' ? 0.07 : 0.06}
          fillOpacity={theme === 'dark' ? 0.07 : 0.045}
          maxOpacity={0.9}
          radius={170}
          spotlight={0.5}
          edgeFade={0.28}
          lightMode={theme === 'light'}
          clickPulse
        />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 pb-10 pt-12 md:px-8 md:pt-16">
        {/* title page */}
        <div className="mx-auto flex max-w-[980px] flex-col items-center text-center">
          <motion.div {...rise(0.05)} className="flex items-center gap-3">
            <InfRecLogo className="h-7 w-auto md:h-8" />
            <span className="h-5 w-px bg-rule-2" />
            <span className="smallcaps text-[10.5px] text-ink-3">Technical report · {paper.date}</span>
          </motion.div>

          <motion.div {...rise(0.15)} ref={titleRef} className="mt-7 w-full md:mt-9">
            <h1 className="display text-[clamp(64px,11.5vw,156px)] font-medium leading-[0.92] tracking-[-0.025em] text-ink">
              <VariableProximity
                label={paper.title}
                containerRef={titleRef}
                fromFontVariationSettings="'wght' 480"
                toFontVariationSettings="'wght' 700"
                radius={190}
                falloff="gaussian"
                toColor={tk.accent}
                idleWave
                style={{ fontFamily: 'var(--font-display)' }}
              />
            </h1>
          </motion.div>

          <motion.p {...rise(0.3)} className="mt-5 font-serif text-[clamp(20px,2.3vw,28px)] italic leading-snug text-ink-2">
            {paper.subtitle}
          </motion.p>

          <motion.div {...rise(0.45)} className="mt-9 flex flex-col items-center gap-3">
            <div
              ref={formulaRef}
              className="math-block rounded-2xl border border-rule bg-surface/80 px-7 py-4 text-[clamp(17px,2vw,23px)] text-ink shadow-[var(--shadow)] backdrop-blur-sm"
              dangerouslySetInnerHTML={{ __html: tex(LEMMA, true) }}
            />
            <span className="smallcaps text-[10px] text-ink-3">
              Lemma 1 · the one identity behind every comparison<span data-og-hide> · hover a symbol</span>
            </span>
          </motion.div>

          <motion.div {...rise(0.6)} className="mt-9 flex flex-col items-center gap-3">
            <p className="font-serif text-[17px] text-ink-3">What should a router</p>
            <div className="font-display text-[clamp(30px,3.6vw,44px)] font-semibold italic leading-none text-ink">
              <TrueFocus
                sentence="combine · spend more · remember"
                separator=" · "
                focusStyle="brackets"
                borderColor={tk.accent}
                glowColor={theme === 'dark' ? 'rgba(255,107,107,0.45)' : 'rgba(194,26,43,0.25)'}
                blurAmount={3.5}
                animationDuration={0.55}
                pauseBetweenAnimations={1.6}
                cornerSize={12}
                borderWidth={2}
                unfocusedOpacity={0.5}
              />
            </div>
            <p className="mt-1 max-w-[560px] font-serif text-[17px] leading-relaxed text-ink-2">
              One reference-relative accounting answers all three, and fixes the price at which a router should trade
              quality for cost.
            </p>
          </motion.div>

          <motion.div {...rise(0.75)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnet padding={40} magnetStrength={4} maxOffset={8}>
              <StarBorder
                as="button"
                onClick={() => scrollToId('problem')}
                theme={theme}
                color={tk.accent}
                backgroundColor={tk.ink}
                textColor={tk.bg}
                borderColor={theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.2)'}
                radius={999}
                thickness={1.5}
                duration={5}
                className="!px-6 !py-3 text-[15px] font-sans font-medium"
              >
                <span className="flex items-center gap-2">
                  Read the overview
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M8 3v10M3.5 8.5L8 13l4.5-4.5" />
                  </svg>
                </span>
              </StarBorder>
            </Magnet>
            <LinkPill label="Paper (PDF)" href={paper.links.pdf} icon="pdf" />
            <LinkPill label="arXiv" href={paper.links.arxiv} icon="arxiv" />
            <LinkPill label="Code" href={paper.links.code} icon="code" />
            <button
              type="button"
              onClick={() => scrollToId('cite')}
              className="flex h-[46px] items-center gap-2 rounded-full border border-rule bg-surface px-5 text-[14px] font-medium text-ink-2 shadow-[var(--shadow)] transition-colors hover:border-accent hover:text-accent"
            >
              <span className="font-display text-[20px] leading-none">“</span>
              <span className="font-sans">Cite</span>
            </button>
          </motion.div>
        </div>

        {/* frontispiece */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.85, ease: EASE }}
          className="relative mx-auto mt-16 max-w-[1180px] md:mt-20"
        >
          <div className="plate grid grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="graph-paper-soft relative px-3 pb-3 pt-6 md:px-6">
              <DinkelbachFigure />
            </div>
            <figcaption className="flex flex-col gap-4 border-t border-rule bg-surface-2/70 p-6 font-serif text-[14.5px] leading-[1.62] text-ink-2 lg:border-l lg:border-t-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="smallcaps whitespace-nowrap text-[11px] font-semibold text-accent">Fig. 0</span>
                <span className="smallcaps whitespace-nowrap rounded-full border border-rule-2 bg-surface px-2 py-[3px] text-[9px] text-ink-3">Schematic · one state</span>
              </div>
              <p className="font-display text-[22px] font-semibold leading-tight text-ink">Every action is a line.</p>
              <p>
                At price <M t="\lambda" />, action <M t="u" /> is worth <M t="v-\lambda c" />. A router takes the highest line, so the best it can
                do is the upper envelope <M t="\Phi(\lambda)" />: convex, strictly decreasing, and zero exactly at the best efficiency{' '}
                <M t="\eta^\star" />.
              </p>
              <p>
                Dinkelbach&rsquo;s iteration starts at the reference&rsquo;s efficiency <M t="\eta_B" />, takes the best line, and moves to that
                line&rsquo;s own efficiency. It reaches <M t="\eta^\star" /> in finitely many steps (Theorem&nbsp;2).
              </p>
              <p className="smallcaps mt-auto flex items-center gap-2 text-[10px] text-ink-3">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M2 8h12M5 5L2 8l3 3M11 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sweep the figure to scan the price
              </p>
            </figcaption>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function M({ t }: { t: string }) {
  return <span dangerouslySetInnerHTML={{ __html: tex(t) }} />;
}

const ICONS = {
  pdf: 'M4 2h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM10 2v4h4',
  arxiv: 'M2.5 4.5h11v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1zM1.5 2.5h13v2h-13zM6.5 7.5h3',
  code: 'M6 4L2 8l4 4M10 4l4 4-4 4',
};

function LinkPill({ label, href, icon }: { label: string; href: string; icon: keyof typeof ICONS }) {
  const ready = Boolean(href);
  const body = (
    <>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={ICONS[icon]} />
      </svg>
      <span className="font-sans">{label}</span>
      {!ready && (
        <span className="smallcaps rounded-full bg-accent-wash px-1.5 py-[2px] text-[9px] text-accent-ink">
          <ShinyText text="soon" speed={2.6} color="var(--accent-ink)" shineColor="#ffffff" />
        </span>
      )}
    </>
  );
  const cls =
    'flex h-[46px] items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[14px] font-medium text-ink-2 shadow-[var(--shadow)] transition-colors';
  return ready ? (
    <a href={href} target="_blank" rel="noreferrer" className={`${cls} hover:border-accent hover:text-accent`}>
      {body}
    </a>
  ) : (
    <span className={`${cls} cursor-default opacity-80`} title={`${label}: coming soon`}>
      {body}
    </span>
  );
}
