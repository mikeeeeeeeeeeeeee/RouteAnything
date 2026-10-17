import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ScrollReveal from '@/components/reactbits/ScrollReveal/ScrollReveal';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import fig1 from '@/assets/paper/fig1-unified-model.webp';
import { Section, Prose, WithMargin } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { RouterLoop } from '@/components/viz/RouterLoop';
import { ExecutionPlans } from '@/components/viz/ExecutionPlans';
import { Sym } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { paper } from '@/data/paper';
import { useTokens } from '@/theme/tokens';

export function Problem() {
  const tk = useTokens();
  const [view, setView] = useState<'live' | 'paper'>('live');
  return (
    <Section
      id="problem"
      n="0"
      kicker={<span>Overview · abstract and the question</span>}
      title="A router is judged by the whole policy it runs."
      lede="It may dispatch a task to a small model, combine proposals, or switch models after tool feedback. Its value depends on the answer finally delivered and on everything spent to obtain it."
    >
      <WithMargin note={<>The question the paper organises everything around</>}>
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
              An inference router decides which model or combination should handle a task, when to spend more computation, and what to
              remember from earlier outcomes. We study these coupled decisions with a <strong className="text-ink">reference-relative accounting</strong>:
              every policy is compared with a named reference policy on the same tasks, by its quality change and its saving in total
              resource cost, including routing, verification, and information costs, under an explicit tolerance for quality loss. For
              finite-menu routing with a quality floor, fractional programming shows that{' '}
              <strong className="text-ink">the reference and the tolerance fix the price</strong> at which a router should trade quality for
              cost; the resulting price path yields a finite-sample certificate for the floor, and the reference both sets this price and
              competes as an action at it.
            </p>
            <p className="mt-4 font-serif text-[16.5px] leading-[1.75] text-ink-2">
              On CodeRouterBench and RouterBench, the accounting yields concrete findings. Whether a router escalates to the reference at
              all is decided by the price structure, not by the ratio objective. Fitted quality floors often fail on held-out tasks, whereas
              certified floors hold in all 200 random splits. Adding a model changes which tasks reach the fallback, and comparing both
              portfolios on the same tasks raises best-candidate selection on CodeRouterBench from 86.3–94.3% to 96.4–97.1%. A failure
              makes further attempts less attractive, yet failing-test feedback nearly doubles retry recovery, from 0.165 to 0.304 across
              seven models. Finally, released routers mainly recover the task type, and router memory pays only relative to the prior it
              replaces.
            </p>
          </div>
        </WithMargin>
      </div>

      <div id="setting" className="mt-20 scroll-mt-24">
        <Prose>
          <p>
            Model routing and cascades formalise parts of this problem. But <em>direct dispatch</em> commits before observing an answer, a
            verified <em>cascade</em> can escalate afterwards, and a <em>portfolio</em> also chooses which capabilities to use together. Each
            decision changes the tasks that reach later stages and the information available to future decisions, so its value depends on
            the complete policy.
          </p>
          <p>
            At round <M>{'n'}</M>, the router sees the state <Sym k="x" /> (the task and its execution history) and its records{' '}
            <Sym k="I" />; it chooses a plan <Sym k="u">{'u_n'}</Sym>, the plan runs, and the feedback <Sym k="f" /> updates the records.
            The evaluation unit is the completed task, including every continuation cost.
          </p>
        </Prose>
        <div className="mt-10 md:ml-[190px]">
          <Plate
            fig="1"
            title="One loop, three coupled questions"
            source={view === 'live' ? { kind: 'schematic', note: 'after the paper’s Fig. 1a' } : { kind: 'data', ref: 'the paper’s Fig. 1' }}
            controls={
              <RubberSegment
                items={[
                  { value: 'live', label: 'Live loop' },
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
                A stateful router chooses an execution plan from the task state and its stored records; feedback updates the records, and the
                next round sees them. The three questions sit at three places in the loop: <em>what to combine</em> is the plan,{' '}
                <em>when to spend more</em> is what happens after feedback, and <em>what to remember</em> is the update.
              </>
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {view === 'live' ? (
                <motion.div key="live" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                  <RouterLoop />
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
                    src={fig1}
                    alt="The paper's Figure 1: (a) stateful routing, (b) execution policies, direct dispatch and a reference-fallback cascade, (c) the quality-cost gain plane."
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
            An <em>action</em> is a choice of models or tools together with an execution rule. The paper studies three rules:{' '}
            <strong>direct dispatch</strong> commits to one output before seeing it; a <strong>verified cascade</strong> tries a cheap
            primary and escalates to the reference only when a verifier rejects the answer; a <strong>portfolio</strong> calls several
            capabilities and keeps the best passing answer. Each changes which tasks reach the later stages, and what every task costs.
          </p>
        </Prose>
        <div className="mt-10 md:ml-[190px]">
          <Plate
            fig="2"
            title="Three ways to execute a plan"
            source={{ kind: 'schematic', note: 'after the paper’s Fig. 1b' }}
            caption={
              <>
                Each moving segment is one task. A direct call commits up front; a cascade pays the primary on every task and the reference
                only on the rejected ones (here the verifier accepts about three in five); a portfolio pays every member call and keeps the
                selected answer, falling back to <M>{'B'}</M> when none passes. Switch tabs to watch the plan re-route.
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
