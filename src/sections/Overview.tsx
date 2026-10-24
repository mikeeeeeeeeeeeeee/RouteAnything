import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ScrollReveal from '@/components/reactbits/ScrollReveal/ScrollReveal';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import teaser from '@/assets/paper/fig1-teaser.webp';
import { Section, Prose, WithMargin } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { OmniRouter } from '@/components/viz/OmniRouter';
import { ExecutionPlans } from '@/components/viz/ExecutionPlans';
import { paper } from '@/data/paper';
import { useTokens } from '@/theme/tokens';

export function Overview() {
  const tk = useTokens();
  const [view, setView] = useState<'live' | 'paper'>('live');
  return (
    <Section
      id="overview"
      n="0"
      kicker={<span>Overview · abstract and the three questions</span>}
      title="For each input, some arm is best."
      lede="A language model answers a question, an image or video generator renders a prompt, a speech model reads text aloud, and a learned policy controls a robot. The best arm changes from input to input, so a router that chooses well could match the strongest arm at a fraction of its price, or beat it."
    >
      <WithMargin note={<>The three questions the paper measures</>}>
        <ScrollReveal
          baseOpacity={0.12}
          enableBlur
          blurStrength={6}
          baseRotation={1.5}
          highlightColor={tk.accent}
          containerClassName="!my-0"
          textClassName="!font-display !font-medium !text-[clamp(30px,3.6vw,48px)] !leading-[1.18] !tracking-[-0.01em] text-ink"
        >
          {paper.question}
        </ScrollReveal>
      </WithMargin>

      <div className="mt-16">
        <WithMargin note={<>Abstract</>}>
          <div className="relative max-w-[760px] rounded-[22px] border border-rule bg-surface p-6 shadow-[var(--shadow)] md:p-8">
            <p className="font-serif text-[16.5px] leading-[1.75] text-ink-2 first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-display first-letter:text-[64px] first-letter:leading-[0.8] first-letter:text-accent">
              A router picks, for each input, which language model, image, video, or speech generator, or robot policy should run. We study
              routing across modalities on an <strong className="text-ink">outcome matrix</strong> that runs every arm of a pool on the same
              inputs: 25 benchmarks spanning text and image understanding, image, video, and speech generation, code and workplace agents,
              and robot manipulation, with 374,401 scored runs of 452 arm versions. We also develop a unified routing theory to organize the
              evidence. At a resource price, <strong className="text-ink">the best router plays, in each state it observes, the arm with the
              highest value minus priced cost</strong>, and a reference policy with a quality tolerance fixes that price. What a router
              observes bounds what it can reach, on a ladder from the best fixed arm through the best arm per task type to the per-input
              oracle.
            </p>
            <p className="mt-4 font-serif text-[16.5px] leading-[1.75] text-ink-2">
              On held-out inputs, the per-input oracle beats the best fixed arm per benchmark by 5.4 points, and by 18–19 points for video
              generation and robot manipulation. Most of this gap lies within task types: on 18 benchmarks with labeled capability types, the
              best arm per type, chosen in hindsight, closes only 8% of it. Learned routers follow this ladder: across 16 benchmarks they
              match the best fixed arm and capture 6% of the headroom, with gains on agents, video, and image generation; on robot
              manipulation, a router that reads the camera frames matches the better policy in each scene condition with 24% less policy
              time. Regressing each arm&rsquo;s outcome succeeds where predicting the winning arm fails (71.6% versus 42.8% robot success),
              and a fixed baseline that drops models with missing scores turns a router&rsquo;s 0.4-point loss into a 2.4-point gain.{' '}
              <strong className="text-ink">Routing pays most through price</strong>: at near-zero quality loss, it raises efficiency 25.5× on
              code, 7.1× on text QA, and 1.35× on image generation.
            </p>
          </div>
        </WithMargin>
      </div>

      <div id="setting" className="mt-20 scroll-mt-24">
        <Prose>
          <p>
            Routing research has mostly studied language models: cascades that escalate to a stronger model, routers learned from
            preferences, and quality–cost formulations that connect the two. Whether routing pays across output types, and where, has not
            been measured on a common footing. The paper builds one: an <em>outcome matrix</em> in which every arm of a pool runs on the
            same inputs, across text and image understanding, image, video and speech generation, code and workplace agents, and robot
            manipulation.
          </p>
          <p>
            A short theory frames the measurements. A router&rsquo;s value is the best expected outcome, net of priced cost, given what it
            observes. Its headroom is therefore a ladder from the best fixed arm to the per-input oracle, and a reference policy with a
            quality tolerance fixes the price at which to trade quality for cost. The matrix measures each rung; two code and text testbeds
            with recorded prices add the cost side.
          </p>
        </Prose>
        <div className="mt-10 md:ml-[190px]">
          <Plate
            fig="1"
            title="One router, every output type"
            source={view === 'live' ? { kind: 'schematic', note: 'after the paper’s Fig. 1a' } : { kind: 'data', ref: 'the paper’s Fig. 1' }}
            controls={
              <RubberSegment
                items={[
                  { value: 'live', label: 'Live' },
                  { value: 'paper', label: 'Paper figure' },
                ]}
                value={view}
                onChange={(v) => setView(v as 'live' | 'paper')}
                trackColor={tk.surface2}
                thumbColor={tk.ink}
                textColor={tk.ink2}
                activeTextColor={tk.bg}
                size="sm"
                className="font-sans"
                aria-label="Figure view"
              />
            }
            caption={
              <>
                For each input, the router picks one arm from the pool for its output type, scoring arms by value minus priced cost. Each
                moving segment is one input. Hover an input for its benchmarks, or a pool for its arms. The paper&rsquo;s figure adds the
                headroom per output type and the efficiency of near-zero-loss price routes, both redrawn later on this page.
              </>
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {view === 'live' ? (
                <motion.div key="live" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                  <OmniRouter />
                </motion.div>
              ) : (
                <motion.figure
                  key="paper"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="overflow-hidden rounded-2xl border border-rule bg-white p-3 md:p-5"
                >
                  <img
                    src={teaser}
                    alt="The paper's Figure 1: (a) one router, every output type; (b) per-input headroom on the test split; (c) efficiency at a near-zero loss."
                    className="h-auto w-full"
                    loading="lazy"
                    draggable={false}
                  />
                </motion.figure>
              )}
            </AnimatePresence>
          </Plate>
        </div>

        <Prose className="mt-16">
          <p>
            An <em>arm</em> need not be a single model. It can be a whole execution plan. <strong>Direct dispatch</strong> commits to one
            output before seeing it. A <strong>verified cascade</strong> tries a cheap primary and calls the reference only when a verifier
            rejects its output. A plan can also <strong>retry after a failure</strong> and show the retry the failing tests. Sequential
            choices within a task enter the theory as complete plans, each with the value it delivers and everything it costs.
          </p>
        </Prose>
        <div className="mt-10 md:ml-[190px]">
          <Plate
            fig="2"
            title="An arm can be a whole plan"
            source={{ kind: 'schematic', note: 'plans of §2 and §6' }}
            caption={
              <>
                Each moving segment is one task. A direct call commits up front. A cascade pays the primary on every task and the reference
                only on the rejected ones (here the verifier accepts about three in five). A retry pays for a second attempt only after a
                failure, and that attempt sees the failing tests. Switch tabs to watch the plan re-route.
              </>
            }
          >
            <ExecutionPlans />
          </Plate>
        </div>
      </div>
    </Section>
  );
}
