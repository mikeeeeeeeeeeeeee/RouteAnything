import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import VariableProximity from '@/components/reactbits/VariableProximity/VariableProximity';
import TrueFocus from '@/components/reactbits/TrueFocus/TrueFocus';
import StarBorder from '@/components/reactbits/StarBorder/StarBorder';
import Magnet from '@/components/reactbits/Magnet/Magnet';
import ShinyText from '@/components/reactbits/ShinyText/ShinyText';
import { CapabilityField, type FocusWord } from '@/components/viz/CapabilityField';
import { InfRecLogo } from '@/components/ui/TopBar';
import { affiliations, authors, live, paper } from '@/data/paper';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';
import { scrollToId } from '@/lib/scrollspy';

const EASE = [0.22, 1, 0.36, 1] as const;

const QUESTIONS = ['How much can routing gain?', 'What do learned routers recover?', 'When does routing pay through price?'];

export function Hero() {
  const { theme } = useTheme();
  const tk = useTokens();
  const titleRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<FocusWord>(0);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 1, delay, ease: EASE },
  });

  return (
    <section id="top" className="relative pt-[64px]">
      <div className="relative mx-auto max-w-[1340px] px-5 pb-14 pt-6 md:px-8 md:pt-8 lg:pb-20">
        <div className="grid grid-cols-1 items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          {/* title page */}
          <div className="relative z-[1] flex flex-col items-start">
            <motion.div {...rise(0.05)} className="flex items-center gap-3">
              <InfRecLogo className="h-7 w-auto md:h-8" />
              <span className="h-5 w-px bg-rule-2" />
              <span className="smallcaps text-[10.5px] text-ink-3">Technical report · {paper.date}</span>
            </motion.div>

            <motion.div {...rise(0.15)} ref={titleRef} className="mt-6 w-full md:mt-8">
              <h1 className="display text-[clamp(60px,7vw,106px)] font-medium leading-[0.9] tracking-[-0.025em] text-ink">
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

            <motion.p {...rise(0.28)} className="mt-5 font-serif text-[clamp(20px,2vw,26px)] italic leading-snug text-ink-2">
              {paper.subtitle.replace('omni-modal', 'omni\u2011modal')}
            </motion.p>

            <motion.div {...rise(0.34)} className="mt-4 max-w-[560px]">
              <p className="flex flex-wrap gap-x-3 gap-y-0.5 font-sans text-[14.5px] leading-[1.6] text-ink-2">
                {authors.map((a) => (
                  <span key={a.name} className="whitespace-nowrap">
                    {a.name}
                    <sup className="ml-[1px] font-mono text-[9.5px] text-ink-3">
                      {a.aff.join(',')}
                      {a.corresponding ? '‡' : ''}
                    </sup>
                  </span>
                ))}
              </p>
              <p className="mt-1 font-sans text-[11px] leading-[1.55] text-ink-3">
                {affiliations.map((a, i) => (
                  <span key={a} className="mr-3 inline-block">
                    <sup className="mr-[2px] font-mono text-[9px]">{i + 1}</sup>
                    {a}
                  </span>
                ))}
                <span className="inline-block">‡ corresponding</span>
              </p>
            </motion.div>

            <motion.p {...rise(0.42)} className="mt-4 max-w-[540px] font-serif text-[17px] leading-[1.62] text-ink-2">
              A router picks, for each input, which model, generator or robot policy should run. The paper measures where that choice
              pays, and why.
            </motion.p>

            <motion.div {...rise(0.52)} data-og-hide className="mt-5 flex flex-col items-start gap-1.5">
              <span className="font-serif text-[16px] text-ink-3">Three questions, one theory</span>
              <span className="font-display text-[clamp(26px,2.5vw,36px)] font-semibold italic leading-none text-ink">
                <TrueFocus
                  index={focus}
                  sentence="gain · recover · pay"
                  separator=" · "
                  focusStyle="brackets"
                  borderColor={tk.accent}
                  glowColor={theme === 'dark' ? 'rgba(255,107,107,0.45)' : 'rgba(194,26,43,0.25)'}
                  blurAmount={3}
                  animationDuration={0.55}
                  cornerSize={11}
                  borderWidth={2}
                  unfocusedOpacity={0.45}
                />
              </span>
              <span className="relative mt-1 block h-[1.6em] w-full overflow-hidden font-serif text-[15px] italic text-ink-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={focus}
                    className="absolute left-0 top-0 whitespace-nowrap"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    {QUESTIONS[focus]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.div>

            <motion.div {...rise(0.66)} data-og-hide className="mt-6 flex flex-wrap items-center gap-3">
              <Magnet padding={40} magnetStrength={4} maxOffset={8}>
                <StarBorder
                  as="button"
                  onClick={() => scrollToId('overview')}
                  theme={theme}
                  color={tk.accent}
                  backgroundColor={tk.ink}
                  textColor={tk.bg}
                  borderColor={theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.2)'}
                  radius={999}
                  thickness={1.5}
                  duration={5}
                  className="!px-6 !py-3 font-sans text-[15px] font-medium"
                >
                  <span className="flex items-center gap-2">
                    Read the overview
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M8 3v10M3.5 8.5L8 13l4.5-4.5" />
                    </svg>
                  </span>
                </StarBorder>
              </Magnet>
              <LinkGroup
                links={[
                  { label: 'Paper', href: live(paper.links.pdf), icon: 'pdf' },
                  { label: 'arXiv', href: live(paper.links.arxiv), icon: 'arxiv' },
                  { label: 'Code', href: live(paper.links.code), icon: 'code' },
                  { label: 'Data', href: live(paper.links.data), icon: 'data' },
                ]}
              />
            </motion.div>
          </div>

          {/* the capability field */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.25, ease: EASE }}
            className="relative"
          >
            <CapabilityField onFocus={setFocus} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const ICONS = {
  pdf: 'M4 2h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM10 2v4h4',
  arxiv: 'M2.5 4.5h11v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1zM1.5 2.5h13v2h-13zM6.5 7.5h3',
  code: 'M6 4L2 8l4 4M10 4l4 4-4 4',
  data: 'M3 4c0-1.1 2.2-2 5-2s5 .9 5 2-2.2 2-5 2-5-.9-5-2zM3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2',
};

type LinkSpec = { label: string; href: string; icon: keyof typeof ICONS };

/** Paper, arXiv and code as one segmented pill; links without a target yet say so. */
function LinkGroup({ links }: { links: LinkSpec[] }) {
  const pending = links.some((l) => !l.href);
  return (
    <div className="relative">
      <div className="flex h-[46px] items-stretch overflow-hidden rounded-full border border-rule bg-surface shadow-[var(--shadow)]">
        {links.map((l, i) => {
          const ready = Boolean(l.href);
          const cls = `flex items-center gap-2 px-4 font-sans text-[14px] font-medium transition-colors ${i ? 'border-l border-rule' : ''} ${
            ready ? 'text-ink-2 hover:bg-accent-wash hover:text-accent' : 'cursor-default text-ink-3'
          }`;
          const body = (
            <>
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={ICONS[l.icon]} />
              </svg>
              {l.label}
            </>
          );
          return ready ? (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={cls}>
              {body}
            </a>
          ) : (
            <span key={l.label} className={cls} title={`${l.label}: coming soon`}>
              {body}
            </span>
          );
        })}
      </div>
      {pending && (
        <span className="absolute -top-2.5 right-4 rounded-full border border-accent/30 bg-accent-wash px-2 py-[1px] font-mono text-[9.5px] uppercase tracking-[0.16em]">
          <ShinyText text="soon" speed={2.8} color="var(--accent-ink)" shineColor="var(--accent)" />
        </span>
      )}
    </div>
  );
}
