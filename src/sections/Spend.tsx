import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { MathBlock } from '@/components/math/MathBlock';
import { s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { RetrySlope } from '@/components/viz/RetrySlope';
import { VerifierMenu, ResourceFlip } from '@/components/viz/VerifierMenu';
import { VOIExplorer, SignalCapture } from '@/components/viz/VOIExplorer';
import { BarList } from '@/components/viz/BarList';
import { CHAINS, FORECAST, JUDGE, RETRY_POOLED } from '@/data/results';

function Sub({ id, n, title, kicker }: { id: string; n: string; title: string; kicker: string }) {
  return (
    <div id={id} className="scroll-mt-24 md:ml-[190px]">
      <div className="flex items-baseline gap-4 border-t border-rule pt-6">
        <span className="font-display text-[34px] font-semibold leading-none text-accent">{n}</span>
        <div>
          <div className="smallcaps text-[10.5px] text-ink-3">{kicker}</div>
          <h3 className="mt-1 font-display text-[30px] font-semibold leading-tight text-ink">{title}</h3>
        </div>
      </div>
    </div>
  );
}

export function Spend() {
  return (
    <Section
      id="spend"
      n="6"
      kicker={
        <>
          <span>Findings 4–6</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">When should a router spend more?</span>
        </>
      }
      title="Evaluate a continuation on the tasks that actually reach it."
      lede="Spending more means another attempt, a verifier, or a routing signal. Each acts on a selected set of tasks, and each must beat the prior it replaces at its real price."
    >
      {/* ---------- 6.1 retries ---------- */}
      <Sub id="escalation" n="6.1" kicker="Finding 4" title="What should happen after a failure?" />
      <Prose className="mt-6">
        <p>
          After a failure, the next action faces a selected subset of tasks. For a history <M>{'\\mathfrak h'}</M> of failed attempts and an
          action <M>{'u'}</M>, let <M>{'a'}</M> be its incremental cost, <M>{'p_\\theta'}</M> its acceptance probability and{' '}
          <M>{'v_{\\rm acc}'}</M> the accepted value, all conditional on <M>{'(\\mathfrak h,u)'}</M>. The optimal remaining return is
        </p>
        <MathBlock n="8">{`\\begin{aligned}${s('Pi')}=\\max\\Big\\{&J^{\\rm direct}(\\mathfrak h),\\\\ &\\max_u\\big[-\\lambda a+p_\\theta v_{\\rm acc}+(1-p_\\theta)\\,\\mathbb E[\\Pi(\\mathfrak h')\\mid \\mathfrak h,u,H_\\theta=0]\\big]\\Big\\},\\end{aligned}`}</MathBlock>
        <p>
          with <M>{'J^{\\rm direct}(\\mathfrak h)=\\mathbb E[Y_B-\\lambda C_B\\mid\\mathfrak h]'}</M>. At <M>{'\\lambda=\\eta^\\star'}</M> this is the
          ratio-optimal continuation, and at <M>{'\\lambda_\\epsilon'}</M> its quality-floor version. The paper fits 259 chains of one to three
          non-Opus models followed by Opus, at two thresholds and five prices, and compares planning on these post-failure states with planning
          from marginal success rates.
        </p>
      </Prose>

      <div className="mt-10 grid grid-cols-1 gap-6 md:ml-[190px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[22px] border border-rule bg-surface p-6 shadow-[var(--shadow)]">
          <div className="smallcaps text-[10.5px] text-accent">A failure is informative</div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-[56px] font-semibold leading-none text-ink">
              {CHAINS.orderedPairs}/{CHAINS.orderedPairs}
            </span>
          </div>
          <p className="mt-2 font-serif text-[15px] leading-[1.6] text-ink-2">
            ordered model pairs have lower second-model success after a failure at <M>{'\\theta=1'}</M>. The median ratio is{' '}
            <b className="text-ink">{CHAINS.medianRatio}</b>: success roughly halves, consistent with shared task difficulty.
          </p>
        </div>
        <div className="rounded-[22px] border border-rule bg-surface p-6 shadow-[var(--shadow)]">
          <div className="smallcaps text-[10.5px] text-accent">Gain-direction agreement</div>
          <p className="mt-2 font-sans text-[12.5px] text-ink-3">
            {CHAINS.decided.toLocaleString('en-US')} interval-decided (cell, chain, stage, price) decisions
          </p>
          <BarList
            className="mt-4"
            labelWidth={176}
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
          <p className="mt-4 font-sans text-[12px] leading-snug text-ink-3">
            Conditional planning chooses shorter chains in {CHAINS.shorterChains.settings} of {CHAINS.shorterChains.of} state–price settings;
            {` ${CHAINS.pairedFavor.conditional}`} paired intervals favour it, against {CHAINS.pairedFavor.marginal}.
          </p>
        </div>
      </div>

      <Prose className="mt-12">
        <p>
          <strong>What a retry sees matters as well.</strong> Across seven models, {RETRY_POOLED.failures} initial failures on{' '}
          {RETRY_POOLED.tasks} tasks each receive three fresh and three feedback retries, with feedback and scoring on <em>disjoint halves</em>{' '}
          of the tests. Mean per-retry recovery is {RETRY_POOLED.feedback} with feedback against {RETRY_POOLED.fresh} fresh, a paired gain of
          13.9 points [5.8, 22.3], positive for all seven models. Scoring on the feedback tests themselves would overstate repair.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="13"
          title="Failing-test feedback nearly doubles retry recovery"
          source={{ kind: 'data', ref: 'Table 6' }}
          caption={
            <>
              Mean per-retry recovery after a failed first attempt (not the chance that one of three retries succeeds). Feedback holds at
              most 800 characters of output from the feedback half of the tests; recovery is scored on the other half. When the first
              attempt passed every feedback test (52 failures), feedback carries no failing output and lowers recovery (0.064 against 0.173);
              in the other 211 failures the gain is +0.201 [+0.109, +0.290]. Hover a line for its numbers.
            </>
          }
        >
          <RetrySlope />
        </Plate>
      </div>

      {/* ---------- 6.2 verifiers ---------- */}
      <div className="mt-24">
        <Sub id="verifiers" n="6.2" kicker="Finding 5" title="Which verifier makes a cascade worthwhile?" />
      </div>
      <Prose className="mt-6">
        <p>
          Each verifier–threshold pair is an action with a delivered quality and a total cost, judged by Lemma 1 and the floor. On recorded
          responses of three primaries to 500 probing and 334 runnable test tasks, the paper compares a static <em>Compiler</em> gate (it
          compiles the extracted answer with the task harness, without running it), visible examples, hidden tests, the released-score
          oracle, and a grok-4.6 judge charged at a primary-price proxy and at list price.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="14"
          title="Verification is a cost–quality menu"
          source={{ kind: 'data', ref: 'Table 7 · Fig. 8' }}
          caption={
            <>
              Qwen3-Max cascades. Efficiency includes the verifier&rsquo;s cost, with paired 95% intervals; the judge is charged at the
              primary-price proxy. A free judge would reach {JUDGE.free}×; at the proxy {JUDGE.proxy}× and at list price {JUDGE.list}×. It
              breaks even at a mean charge of $0.00330 per task [$0.00285, $0.00379]. The Compiler gate is a zero-dollar check with AUROC
              0.766.
            </>
          }
        >
          <VerifierMenu />
          <div className="mt-8 border-t border-dashed border-rule pt-7">
            <div className="mb-3 font-sans text-[14px] font-semibold text-ink">The resource comes first</div>
            <ResourceFlip />
          </div>
        </Plate>
      </div>
      <Prose className="mt-10">
        <p>
          Inside the policy menu, rebuilt on the verifier sample, recorded verdicts at measured charges keep 97% of the oracle zero-loss
          efficiency with hidden-test cascades. Without the benchmark&rsquo;s own grader only Compiler cascades enter, at 2.33×, and the judge
          enters no fitted policy at either price. <strong>Screen with a compiler or tests, which are nearly free in dollars, and choose the
          resource before the verifier.</strong>
        </p>
      </Prose>

      {/* ---------- 6.3 signals ---------- */}
      <div className="mt-24">
        <Sub id="signals" n="6.3" kicker="Finding 6" title="Is routing information worth buying?" />
      </div>
      <Prose className="mt-6">
        <p>
          In the quality-preserving two-action model, attempting a primary that succeeds with probability <M>{'s'}</M> costs{' '}
          <M>{'a+(1-s)\\,b'}</M>, while falling back directly costs <M>{'b>a'}</M>. A signal that costs <M>{'k'}</M> and moves the posterior to{' '}
          <M>{'s_Z'}</M> has net value
        </p>
        <MathBlock n="9">{`\\min\\{a+(1-s)\\,b,\\ b\\}-\\mathbb E\\min\\{a+(1-s_Z)\\,b,\\ b\\}-${s('k')}.`}</MathBlock>
        <p>
          Gross savings are bounded by those of perfect information. The paper reports <em>capture</em>: gross savings divided by that bound,
          before subtracting the signal&rsquo;s price.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="15"
          title="What a signal can save, and what it may cost"
          source={{ kind: 'schematic', note: 'a = 0.3 b' }}
          caption={
            <>
              The no-signal cost is the lower of attempting and falling back, kinked at <M>{'s=a/b'}</M>. A signal splits the prior into{' '}
              <M>{'s_0'}</M> and <M>{'s_1'}</M>; its expected cost is the chord between them, and the dark bar is what it saves. Perfect
              information is the most any signal can save, and that bound stays below <M>{'a'}</M>: information can pay only if its price is
              below the attempt it could save, whatever its accuracy.
            </>
          }
        >
          <VOIExplorer />
        </Plate>
      </div>
      <Prose className="mt-12">
        <p>
          <strong>In the data.</strong> Nine released CodeRouterBench routers expose model choices, which the paper uses as binary signals with
          cross-fitted posteriors. Without task-type labels the two largest fine-tuned routers capture <strong>54.6–55.5%</strong> of the
          perfect-information bound. Given the benchmark dimension, they capture only <strong>6.2–7.8%</strong> of the dimension-conditioned
          bound. Inferring task structure is itself a major source of routing value.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="16"
          title="Released routers mainly recover the task type"
          source={{ kind: 'data', ref: 'Table 9' }}
          caption={
            <>
              Cross-fitted capture of all nine released routers as binary signals (chose Qwen3-Max or not), threshold use. Classical routers
              never pass the threshold without task types; used natively they capture less than nothing, because their rejected tasks still
              succeed often enough to be worth attempting (<M>{`\\mathbb P(H=1\\mid Z=0)>a/b=${FORECAST.aOverB}`}</M>). Prices separate signals
              further: a prompt-only TF-IDF router costs 0.06% of an attempt (AUROC {FORECAST.tfidfAuroc.qwen} for Qwen3-Max), a paid
              DeepSeek-v4-pro forecast {FORECAST.llmCostAttempts} attempts, which exceeds <M>{'a'}</M> in {FORECAST.statesAbove} of{' '}
              {FORECAST.states} states.
            </>
          }
        >
          <SignalCapture />
        </Plate>
      </div>
    </Section>
  );
}
