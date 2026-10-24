import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { Section, Prose, Sub } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { CascadeFlow } from '@/components/viz/CascadeFlow';
import { PriceRuler } from '@/components/viz/PriceRuler';
import { PriceRoutes } from '@/components/viz/PriceRoutes';
import { PolicyForest } from '@/components/viz/PolicyForest';
import { RetrySlope } from '@/components/viz/RetrySlope';
import { VerifierMenu, ResourceFlip } from '@/components/viz/VerifierMenu';
import { VOIExplorer, SignalCapture } from '@/components/viz/VOIExplorer';
import { MemoryPriors, SignAgreement } from '@/components/viz/MemoryFigure';
import { BarList } from '@/components/viz/BarList';
import { CHAINS, JUDGE, MEMORY, PRICE_FACTS, RETRY_POOLED } from '@/data/results';
import { useTokens } from '@/theme/tokens';

export function Price() {
  const P = PRICE_FACTS;
  return (
    <Section
      id="price"
      n="9"
      kicker={
        <>
          <span>Findings 6–7</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">When does routing pay through price?</span>
        </>
      }
      title="Routing pays most through price."
      lede="A route trades quality for cost where arms differ more in price than in value. The reference and the tolerance fix the price, and a certified floor keeps the trade safe on new inputs."
    >
      {/* ---------- 9.1 the price of a route ---------- */}
      <Sub id="price-route" n="9.1" kicker="Finding 6" title="The price of a route" />
      <Prose className="mt-6">
        <p>
          The matrix records prices for image and speech generation and time for robot policies; CodeRouterBench and RouterBench add token
          prices for code and text. On CodeRouterBench, states are the 21 dimension×source cells, and each state offers 22 arms: direct
          dispatch to one of eight models, or one of seven primaries followed by Opus 4.6 when the primary&rsquo;s released score, an oracle
          verifier, is below <M>{'\\theta\\in\\{1,0.5\\}'}</M>. Such a reference-fallback cascade, with verifier decision{' '}
          <Sym k="H" children="H\in\{0,1\}" /> and primary-plus-verification cost <Sym k="A" />, delivers
        </p>
        <MathBlock n="3">{`V=${s('H')}\\,Y_P+(1-H)\\,Y_B,\\qquad D=${s('A')}+(1-H)\\,C_B.`}</MathBlock>
        <p>
          Values, costs and state frequencies are fitted on probing tasks, the floor <M>{'Q\\ge-\\epsilon'}</M> is imposed there, and policies
          are evaluated on test tasks; always-Opus scores {P.code.alwaysOpus.score} at {P.code.alwaysOpus.mUsd} m$ per task. RouterBench uses
          source-family states and the same construction. For image generation, states are the five benchmarks, arms are the generators, and
          the reference plays the best generator per benchmark.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="17"
          title="A cascade pays twice on the tasks it rejects"
          source={{ kind: 'schematic', note: 'illustrative rates' }}
          caption={
            <>
              Each moving segment is a task: blue when the primary gets it right, hollow when it does not. Every task pays <M>{'A'}</M>; the
              ones the verifier rejects turn amber, also pay <M>{'C_B'}</M>, and receive the reference&rsquo;s answer. A wrong answer that is
              accepted turns coral, the only way the cascade loses quality, since <M>{'V-Y_B=H\\,(Y_P-Y_B)'}</M>. Switch the verifier to trade
              the two off. Illustration only: the primary is right on 45% of tasks, costs a tenth of the reference, and the reference is
              always right.
            </>
          }
        >
          <CascadeFlow />
        </Plate>
      </div>

      <Prose className="mt-14">
        <p>
          <strong>When the reference is worth calling.</strong> An arm that calls the reference is worth its price only while the reference
          earns enough on the inputs it receives.
        </p>
      </Prose>
      <div className="mt-8 md:ml-[190px]">
        <Statement
          kind="Corollary"
          n="6"
          name="Admission price"
          source="Paper §6.1 · proof in App. A.6"
          proof={
            <>
              By Theorem 2(i), an efficiency-optimal router plays in every state only maximisers of <M>{'v-\\eta^\\star c'}</M>, and none of
              them calls the reference when <M>{'\\eta^\\star>\\lambda^B'}</M>; by part (ii) the same holds for a floor-optimal router whose
              price exceeds <M>{'\\lambda^B'}</M>. Against direct dispatch to its own primary, a cascade adds value{' '}
              <M>{'\\mathbb E[(Y_B-Y_P)\\mathbf 1_{H=0}\\mid s]'}</M> and at least the cost <M>{'\\mathbb E[C_B\\mathbf 1_{H=0}\\mid s]'}</M>,
              because the primary is paid either way, which bounds the prices at which it can win.
            </>
          }
        >
          <p>
            In the setting of Theorem 2, let <Sym k="lambdaB" /> be the largest price at which some arm that calls the reference maximises{' '}
            <M>{'v(s,\\cdot)-\\lambda c(s,\\cdot)'}</M> in some state. If <M>{'\\lambda^B<\\eta^\\star'}</M>, the efficiency-optimal router
            never calls the reference, and neither does a floor-optimal router whose price <M>{'\\lambda_\\epsilon'}</M> exceeds{' '}
            <M>{'\\lambda^B'}</M>. A cascade (3) whose primary is also available by direct dispatch maximises only at prices up to
          </p>
          <MathBlock compact>{'\\frac{\\mathbb E[(Y_B-Y_P)\\,\\mathbf 1_{H=0}\\mid s]}{\\mathbb E[C_B\\,\\mathbf 1_{H=0}\\mid s]},'}</MathBlock>
          <p>the reference&rsquo;s added value per dollar on the inputs it receives.</p>
        </Statement>
      </div>

      <div className="mt-12 md:ml-[190px]">
        <Plate
          fig="18"
          title="Admission price against floor price"
          source={{ kind: 'data', ref: 'Finding 6 · App. C.2' }}
          caption={
            <>
              Shaded: prices at which some reference-calling arm can still be optimal (<M>{'\\lambda\\le\\lambda^B'}</M>). On CodeRouterBench,{' '}
              <M>{'\\lambda^B=100'}</M> score per dollar (2.9<M>{'\\,\\eta_B'}</M>) lies below the zero-loss floor price 144 and far below{' '}
              <M>{'\\eta^\\star=1022'}</M>, so by Corollary 6 the zero-loss router never calls Opus. On RouterBench the admission price{' '}
              5.85<M>{'\\,\\eta_B'}</M> exceeds the floor price 1.60<M>{'\\,\\eta_B'}</M>, and the best router that avoids the reference scores
              9.7 points below it, so the zero-loss router calls it.
            </>
          }
        >
          <PriceRuler />
        </Plate>
      </div>

      <Prose className="mt-14">
        <p>
          <strong>Code.</strong> The zero-loss router dispatches every task to a cheaper model and reaches 25.5× Opus&rsquo;s efficiency at a
          0.44-point loss. Most of this factor is Opus&rsquo;s price: always calling Qwen3-Max, the cheapest model, reaches{' '}
          {P.code.qwenAlways.eff}× at a {P.code.qwenAlways.loss}-point loss, and routing by state recovers that loss while adding 27%
          efficiency. The states need not be oracle labels: prompt-inferred cells reach {P.code.predictedCells}×, and learned quality–cost
          routers 22.7–24.2× at their zero-loss points. Without states, every zero-loss policy calls Opus, which then runs on 28.7% of tasks.
          On RouterBench, the zero-loss router cascades cheap primaries to the reference and reaches {P.text.eff}×.
        </p>
        <p>
          <strong>Images, speech, robots.</strong> GPT Image 2.5 costs $0.21 per image, 3.5–5.4× the other generators, and is the best arm on
          two of the five benchmarks. The route that stays within half a point on training prompts moves Qwen-Image-Bench to Grok Imagine
          2.0 and OneIG to Qwen-Image 3, cutting test cost by 26% at a 0.47-point loss, and a two-point tolerance halves cost. In speech
          generation the best generator is also among the cheapest, so there is nothing to trade, and on robots the time saving of §8.2 comes
          with no loss of success. Router overhead is small next to these prices: a 4B router takes {P.overhead.routerSeconds} s per decision
          on one H20 GPU, whereas generating an image takes 27–158 s and a video 211–314 s.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="19"
          title="Price routes across testbeds"
          source={{ kind: 'data', ref: 'Table 5 · Table 9' }}
          caption={
            <>
              Test-set quality change <M>{'\\Delta V=\\mathbb E[V-Y_B]'}</M> in points with paired 95% intervals, and efficiency{' '}
              <M>{'\\eta/\\eta_B'}</M> against each testbed&rsquo;s reference; resources are dollars, or policy seconds for robots. Below,
              the two generator swaps behind the half-point image route, and the router&rsquo;s own overhead next to the time it takes to
              generate an output.
            </>
          }
        >
          <PriceRoutes />
        </Plate>
      </div>

      <div className="mt-12 md:ml-[190px]">
        <Plate
          fig="20"
          title="On code, efficiency, cost and quality favour different policies"
          source={{ kind: 'data', ref: 'Table 10 · Table 11' }}
          caption={
            <>
              The 2,919-task CodeRouterBench test set, with paired 95% intervals; dashed lines mark always-Opus (0.4383 at 11.655 m$ per
              task). Floors are fitted on probing. Teal rows use no oracle cell labels: cells predicted from the prompt, and a direct
              quality–cost router at its probing zero-loss point (Table 11, separate bootstrap seed). The per-task oracle is an in-sample
              ceiling. Against a per-cell best-model yardstick, the refitted zero-loss policy reaches 3.18×: a floor certifies quality only
              relative to the reference it names.
            </>
          }
        >
          <PolicyForest />
        </Plate>
      </div>

      {/* ---------- 9.2 spending more ---------- */}
      <div className="mt-24">
        <Sub id="spend-more" n="9.2" kicker="Finding 7" title="Spending more within a task" />
      </div>
      <Prose className="mt-6">
        <p>
          An arm can spend more inside a task: a plan that retries after a failure, or that verifies an output and escalates on rejection. A
          router can also pay for a finer state: a forecast of an arm&rsquo;s success, or a record of past outcomes. By Theorem 2, a richer
          arm is worth playing only if its value net of its full cost beats the arms it replaces, and that value must be computed on the
          inputs that reach each step. By Proposition 3, a finer state can only help an optimal router, but it pays only if the help exceeds
          its price. CodeRouterBench records the retries, verdicts and costs needed to test both.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <SpendMore />
      </div>
    </Section>
  );
}

type Tab = 'retries' | 'verifiers' | 'signals' | 'memory';

/** Finding 7 as one plate: four studies, one claim. */
function SpendMore() {
  const tk = useTokens();
  const [tab, setTab] = useState<Tab>('retries');

  const panes: Record<Tab, { title: string; source: { kind: 'data'; ref: string }; caption: ReactNode; body: ReactNode }> = {
    retries: {
      title: 'A failure lowers the odds; seeing the failing tests raises them',
      source: { kind: 'data', ref: 'Table 14 · App. C.4' },
      caption: (
        <>
          Mean per-retry recovery after a failed first attempt, with feedback and scoring on disjoint halves of the tests. When the first
          attempt passes every feedback test (52 failures), feedback holds no failing output and lowers recovery (0.064 against 0.173 fresh);
          on the other 211 failures it adds +0.201 [+0.109, +0.290]. Hover a line for its numbers.
        </>
      ),
      body: (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div>
              <div className="smallcaps text-[10.5px] text-accent">A failure leaves harder tasks</div>
              <div className="mt-3 font-display text-[48px] font-semibold leading-none text-ink">
                {CHAINS.orderedPairs}/{CHAINS.orderedPairs}
              </div>
              <p className="mt-2 font-serif text-[15px] leading-[1.6] text-ink-2">
                ordered model pairs: the second model succeeds less often after the first fails (median ratio{' '}
                <b className="text-ink">{CHAINS.medianRatio}</b> at <M>{'\\theta=1'}</M>).
              </p>
            </div>
            <div>
              <div className="smallcaps text-[10.5px] text-accent">Plan on the state that reaches the step</div>
              <p className="mt-2 font-sans text-[12.5px] text-ink-3">
                {CHAINS.decided.toLocaleString('en-US')} decided gain signs over {CHAINS.chains} chains, Proposition 8
              </p>
              <BarList
                className="mt-4"
                labelWidth={196}
                max={100}
                barHeight={14}
                gap={10}
                rows={CHAINS.agreement.map((a) => ({
                  key: a.label,
                  label: a.label,
                  value: a.value,
                  display: `${a.value}%`,
                  color: a.ours ? 'var(--blue)' : 'var(--slate)',
                  emphasis: a.ours,
                }))}
              />
            </div>
          </div>
          <div className="mb-2 font-sans text-[14px] font-semibold text-ink">
            Recovery per retry: {RETRY_POOLED.fresh} fresh, {RETRY_POOLED.feedback} with failing-test feedback
          </div>
          <RetrySlope />
        </>
      ),
    },
    verifiers: {
      title: 'Verification is a cost–quality menu, and the resource comes first',
      source: { kind: 'data', ref: 'Table 15 · App. C.5' },
      caption: (
        <>
          Qwen3-Max cascades, efficiency including the verifier&rsquo;s cost, with paired 95% intervals. A free compiler gate gives 4.09× at
          −2.4 points [−6.3, +0.9]; an LLM judge gives {JUDGE.free}× if free, {JUDGE.proxy}× charged at the primary&rsquo;s token price and{' '}
          {JUDGE.list}× at its list price, and breaks even at $0.00330 per task. In seconds, always-Opus beats every verified cascade, because
          Opus answers faster than the primaries.
        </>
      ),
      body: (
        <>
          <VerifierMenu />
          <div className="mt-8 border-t border-dashed border-rule pt-7">
            <div className="mb-3 font-sans text-[14px] font-semibold text-ink">The resource comes first</div>
            <ResourceFlip />
          </div>
        </>
      ),
    },
    signals: {
      title: 'A forecast can save at most the attempt it replaces',
      source: { kind: 'data', ref: 'Prop. 9 · Table 16' },
      caption: (
        <>
          Left, Proposition 9: a signal&rsquo;s saving is at most <M>{'\\min\\{s(b-a),\\,a(1-s)\\}'}</M>, which perfect information attains,
          so a signal priced at <M>{'k'}</M> pays only if <M>{'k<a(1-s)\\le a'}</M>, whatever its accuracy. Right: released CodeRouterBench
          routers used as signals capture up to 55.5% of the perfect-information value when the task type is unknown, and at most 7.8% within
          it. A DeepSeek-v4-pro forecast costs 2.4 attempts at list price; a prompt-only TF-IDF router, 0.06% of one.
        </>
      ),
      body: (
        <>
          <VOIExplorer />
          <div className="mt-8 border-t border-dashed border-rule pt-7">
            <SignalCapture />
          </div>
        </>
      ),
    },
    memory: {
      title: 'Memory pays only relative to the prior it replaces',
      source: { kind: 'data', ref: 'Table 17 · App. C.7' },
      caption: (
        <>
          A semi-synthetic record store that sends each cell&rsquo;s tasks to the last model that passed verification there. It reaches{' '}
          {MEMORY.storeEff} score per dollar but scores 3.4 points below always-Opus; in value minus priced cost it gains 0.275 [0.272, 0.279]
          per round over always-Opus and loses 0.120 [0.113, 0.126] against a per-dimension best-model prior. Probing estimates through
          Proposition 10 predict {((MEMORY.signAgreement.right / MEMORY.signAgreement.of) * 100).toFixed(1)}% of the cell-level signs.
        </>
      ),
      body: (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <MemoryPriors />
          <div className="lg:border-l lg:border-dashed lg:border-rule lg:pl-8">
            <div className="mb-1 font-sans text-[14px] font-semibold text-ink">Cell-level sign agreement</div>
            <p className="mb-5 font-sans text-[12.5px] leading-snug text-ink-3">
              Does the probing prediction of Eq. (13) get the sign of each cell&rsquo;s realised gain right?
            </p>
            <SignAgreement />
          </div>
        </div>
      ),
    },
  };
  const pane = panes[tab];

  return (
    <Plate
      fig="21"
      title={pane.title}
      source={pane.source}
      controls={
        <RubberSegment
          items={[
            { value: 'retries', label: 'Retries' },
            { value: 'verifiers', label: 'Verifiers' },
            { value: 'signals', label: 'Signals' },
            { value: 'memory', label: 'Memory' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="font-sans"
          aria-label="Study"
        />
      }
      caption={pane.caption}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          {pane.body}
        </motion.div>
      </AnimatePresence>
    </Plate>
  );
}
