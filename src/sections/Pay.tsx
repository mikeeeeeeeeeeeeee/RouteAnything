import type { ReactNode } from 'react';
import { Section, Sub } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { Gather } from '@/components/ui/Gather';
import { Fold } from '@/components/ui/Fold';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { PriceRoutes } from '@/components/viz/PriceRoutes';
import { FloorWaffles } from '@/components/viz/FloorWaffles';
import { PriceRuler } from '@/components/viz/PriceRuler';
import { PolicyForest } from '@/components/viz/PolicyForest';
import { CascadeFlow } from '@/components/viz/CascadeFlow';
import { RetrySlope } from '@/components/viz/RetrySlope';
import { VerifierMenu, ResourceFlip } from '@/components/viz/VerifierMenu';
import { VOIExplorer, SignalCapture } from '@/components/viz/VOIExplorer';
import { MemoryPriors, SignAgreement } from '@/components/viz/MemoryFigure';
import { BarList } from '@/components/viz/BarList';
import { CERTIFICATION, CHAINS, JUDGE, MEMORY, PRICE_FACTS, PRICES, RETRY_POOLED } from '@/data/results';

function Pane({ lede, children, more }: { lede: ReactNode; children: ReactNode; more?: ReactNode }) {
  return (
    <div className="space-y-6">
      <p className="max-w-[760px] font-serif text-[17.5px] leading-[1.65] text-ink-2">{lede}</p>
      {children}
      {more && (
        <Fold>
          <div className="max-w-[720px]">{more}</div>
        </Fold>
      )}
    </div>
  );
}

export function Pay() {
  const P = PRICE_FACTS;
  return (
    <Section
      id="pay"
      n="5"
      kicker={
        <>
          <span>Findings 6–7</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">When does routing pay through price?</span>
        </>
      }
      title="Routing pays most through price."
      lede="When candidates are close in quality and far apart in cost, the reference and the quality tolerance fix the price, and a finite-sample test certifies the floor. Richer candidates and finer states pay only against what they replace."
    >
      {/* ---------- 5.1 ---------- */}
      <Sub id="price-route" n="5.1" kicker="Finding 6" title="The price of a route" />
      <div className="mt-6 md:ml-[190px]">
        <Fold label="How a route is priced">
          <div className="max-w-[720px]">
            <p>
              The matrix records prices for image and speech generation and time for robot policies; CodeRouterBench (eight models, 9,999 coding
              tasks, reference Opus 4.6) and RouterBench (eleven models, 36,497 prompts, reference gpt-4-1106-preview) add token prices for code
              and text. On CodeRouterBench, states are the 21 dimension×source cells, and each offers 22 candidates: direct dispatch to one of
              eight models, or one of seven primaries followed by Opus 4.6 when the primary&rsquo;s released score is below{' '}
              <M>{'\\theta\\in\\{1,0.5\\}'}</M>. Values, costs and state frequencies are fitted on probing tasks, the floor is imposed there, and
              policies are evaluated on test tasks; always-Opus scores {P.code.alwaysOpus.score} at {P.code.alwaysOpus.mUsd} m$ per task.
            </p>
          </div>
        </Fold>
      </div>
      <div className="mt-8 md:ml-[190px]">
        <Gather
          ariaLabel="Finding 6"
          items={[
            {
              key: 'routes',
              tag: 'Table 5',
              label: 'Price routes',
              stat: '25.5× on code',
              content: (
                <Pane
                  lede={
                    <>
                      At near-zero quality loss, routing raises efficiency 25.5× on code, {P.text.eff}× on text QA
                      and 1.35× on image generation. Certified on independent inputs, the code and text floors hold in all 200 splits.
                    </>
                  }
                  more={
                    <p>
                      Most of the 25.5× is Opus&rsquo;s price: always calling Qwen3-Max, the cheapest model, reaches {P.code.qwenAlways.eff}× at a{' '}
                      {P.code.qwenAlways.loss}-point loss, and routing by state recovers that loss while adding 27% efficiency. The states need not
                      be oracle labels: prompt-inferred cells reach {P.code.predictedCells}×, and learned quality–cost routers 22.7–24.2× at their
                      zero-loss points. Without states, every zero-loss policy calls Opus, which then runs on 28.7% of tasks. On RouterBench, the
                      best router that avoids the reference scores {P.text.refFreeGap} points below it, so the zero-loss router cascades cheap
                      primaries to the reference.
                    </p>
                  }
                >
                  <Plate
                    fig="5.1"
                    title="Price routes across testbeds"
                    source={{ kind: 'data', ref: 'Table 5' }}
                    caption={
                      <>
                        Test-set quality change <M>{'\\Delta V=\\mathbb E[V-Y_B]'}</M> in points with paired 95% intervals, and efficiency{' '}
                        <M>{'\\eta/\\eta_B'}</M> against each testbed&rsquo;s reference. Hover a route for what it does.
                      </>
                    }
                  >
                    <PriceRoutes parts={['routes']} />
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'images',
              tag: 'Table 9',
              label: 'Images',
              stat: '−26% cost',
              content: (
                <Pane
                  lede={
                    <>
                      GPT Image 2.5 costs $0.21 per image, 3.5–5.4× the other generators. The route that stays within half a point moves two of
                      five benchmarks to cheaper generators and cuts test cost by 26% at a 0.47-point loss.
                    </>
                  }
                  more={
                    <p>
                      A two-point tolerance halves cost. In speech generation the best generator is also among the cheapest, so there is nothing to
                      trade, and on robots the 24% time saving comes with no loss of success. A 4B router takes {P.overhead.routerSeconds} s per
                      decision on one H20 GPU, whereas generating an image takes 27–158 s and a video 211–314 s.
                    </p>
                  }
                >
                  <Plate
                    fig="5.2"
                    title="What the half-point image route moved"
                    source={{ kind: 'data', ref: 'Table 9 · §5.1' }}
                    caption={<>Three benchmarks keep their fixed generator; two switch to a cheaper one. Below, the router&rsquo;s own time next to the time an output takes.</>}
                  >
                    <PriceRoutes parts={['image', 'overhead']} />
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'floor',
              tag: 'Proposition 5',
              label: 'Certified floor',
              stat: '200 of 200 splits',
              content: (
                <Pane
                  lede={
                    <>
                      Refitted on half of the probing tasks, the zero-loss floor holds on test in only 12.5% of 200 splits. Certified on the other
                      half by Proposition 5, it holds in all 200, at a median {CERTIFICATION.medianEff}× the reference&rsquo;s efficiency.
                    </>
                  }
                  more={
                    <p>
                      The guarantee is an aggregate one: the certified router loses quality in a median {CERTIFICATION.negCellsMedian} of{' '}
                      {CERTIFICATION.cells} test cells. In {CERTIFICATION.nestedResplits.of} nested 70/30 resplits of all 9,999 tasks the refined
                      procedure holds the floor in {CERTIFICATION.nestedResplits.held}, at a median {CERTIFICATION.nestedResplits.median}×.
                      Certification needs every path action and the reference on the certification sample, at $0.0158 per task against $0.0124 for
                      Opus alone.
                    </p>
                  }
                >
                  <Plate
                    fig="5.3"
                    title="200 random splits, two ways to set the floor"
                    source={{ kind: 'data', ref: 'Table 5 · App. C.2' }}
                    caption={<>CodeRouterBench, zero-loss floor, evaluated on the 2,919 test tasks. Below, the order of the price path buys efficiency that a Bonferroni correction gives away.</>}
                  >
                    <FloorWaffles />
                    <div className="mt-8 border-t border-dashed border-rule pt-6">
                      <BarList
                        labelWidth={230}
                        max={21}
                        rows={CERTIFICATION.byMethod.map((m) => ({
                          key: m.label,
                          label: m.label,
                          value: m.eff,
                          display: `${m.eff.toFixed(2)}×`,
                          color: m.ordered ? 'var(--teal)' : 'var(--slate)',
                          emphasis: m.eff > 19,
                        }))}
                        ticks={[0, 5, 10, 15, 20]}
                        tickFormat={(v) => `${v}×`}
                      />
                    </div>
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'admission',
              tag: 'Corollary 6',
              label: 'Admission price',
              stat: 'λᴮ below λε',
              content: (
                <div className="space-y-6">
                  <Statement
                    compact
                    kind="Corollary"
                    n="6"
                    name="Admission price"
                    source="Paper §5.1 · proof in App. A.6"
                    proof={
                      <>
                        By Theorem 2(i), an efficiency-optimal router plays only maximizers of <M>{'v-\\eta^\\star c'}</M>, none of which calls the
                        reference when <M>{'\\eta^\\star>\\lambda^B'}</M>; by part (ii) the same holds for a floor-optimal router whose price exceeds{' '}
                        <M>{'\\lambda^B'}</M>. Against direct dispatch to its own primary, a cascade adds value only on the inputs it sends on,
                        and pays at least their reference cost.
                      </>
                    }
                  >
                    <p>
                      Let <Sym k="lambdaB" /> be the largest price at which some candidate that calls the reference maximizes{' '}
                      <M>{'v(s,\\cdot)-\\lambda c(s,\\cdot)'}</M> in some state. If <M>{'\\lambda^B<\\eta^\\star'}</M>, the efficiency-optimal
                      router never calls the reference, and neither does a floor-optimal router whose price <M>{'\\lambda_\\epsilon'}</M> exceeds{' '}
                      <M>{'\\lambda^B'}</M>.
                    </p>
                  </Statement>
                  <Plate
                    fig="5.4"
                    title="Admission price against floor price"
                    source={{ kind: 'data', ref: 'Fig. 7 · App. C.2' }}
                    caption={
                      <>
                        On CodeRouterBench, <M>{'\\lambda^B=100'}</M> score per dollar (2.9<M>{'\\,\\eta_B'}</M>) lies below the zero-loss floor
                        price 144 and far below <M>{'\\eta^\\star=1022'}</M>, so the zero-loss router never calls Opus. On RouterBench the order is
                        reversed, and the router calls the reference.
                      </>
                    }
                  >
                    <PriceRuler />
                  </Plate>
                </div>
              ),
            },
            {
              key: 'code',
              tag: 'Table 10',
              label: 'Code policies',
              stat: 'λε = 4.16 ηB',
              content: (
                <Pane
                  lede={
                    <>
                      The zero-loss policy has multiplier <M>{`\\kappa=${PRICES.crb.kappa}`}</M> and constrained optimum{' '}
                      <M>{`\\eta^\\star_\\epsilon=${PRICES.crb.etaStarEps}`}</M>, so <M>{'\\lambda_\\epsilon=144.3=4.16\\,\\eta_B'}</M>, as Theorem
                      2(ii) predicts. Hand-picked operating points land elsewhere: <M>{'\\lambda=\\eta_B'}</M> gives {PRICES.handPicked.atEtaB}×,
                      and a budget equal to Opus&rsquo;s cost {PRICES.handPicked.budgetOpus}×.
                    </>
                  }
                  more={
                    <p>
                      Against a per-cell best-model yardstick, which scores above Opus, the refitted zero-loss policy reaches 3.18× its efficiency: a
                      floor certifies quality only relative to the reference it names.
                    </p>
                  }
                >
                  <Plate
                    fig="5.5"
                    title="Efficiency, cost and quality favor different policies"
                    source={{ kind: 'data', ref: 'Table 10 · Table 11' }}
                    caption={<>The 2,919-task test set with paired 95% intervals; dashed lines mark always-Opus. Teal rows use no oracle cell labels. The per-task oracle is an in-sample ceiling.</>}
                  >
                    <PolicyForest />
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'cascade',
              tag: 'Eq. (3)',
              label: 'Cascades',
              stat: 'pays twice',
              content: (
                <Pane
                  lede={
                    <>
                      A reference-fallback cascade with verifier decision <Sym k="H" /> and primary-plus-verification cost <Sym k="A" /> pays the
                      primary on every task and the reference on the rejected ones. Since <M>{'V-Y_B=H\\,(Y_P-Y_B)'}</M>, it loses quality only
                      through false accepts.
                    </>
                  }
                >
                  <MathBlock n="3">{`V=${s('H')}\\,Y_P+(1-H)\\,Y_B,\\qquad D=${s('A')}+(1-H)\\,C_B.`}</MathBlock>
                  <Plate
                    fig="5.6"
                    title="A cascade pays twice on the tasks it rejects"
                    source={{ kind: 'schematic', note: 'illustrative rates' }}
                    caption={<>Blue: the primary is right. Hollow: it is wrong. Amber: rejected, sent to the reference. Coral: a wrong answer accepted. Switch the verifier to trade them off.</>}
                  >
                    <CascadeFlow />
                  </Plate>
                </Pane>
              ),
            },
          ]}
        />
      </div>

      {/* ---------- 5.2 ---------- */}
      <div className="mt-20">
        <Sub id="spend-more" n="5.2" kicker="Finding 7" title="Spending more within a task" />
      </div>
      <div className="mt-6 md:ml-[190px]">
        <p className="max-w-[760px] font-serif text-[17.5px] leading-[1.65] text-ink-2">
          A richer candidate is worth playing only if its value net of its full cost beats what it replaces, computed on the inputs that reach
          each step; a finer state can only help, but pays only if the help exceeds its price.
        </p>
      </div>
      <div className="mt-8 md:ml-[190px]">
        <Gather
          ariaLabel="Finding 7"
          items={[
            {
              key: 'retries',
              tag: 'Table 14',
              label: 'Retries',
              stat: '.165 → .304',
              content: (
                <Pane
                  lede={
                    <>
                      A failure leaves harder tasks: in all {CHAINS.orderedPairs} ordered model pairs, the second model succeeds less often after the
                      first fails. Yet a retry that sees the failing tests raises per-retry recovery from {RETRY_POOLED.fresh} to{' '}
                      {RETRY_POOLED.feedback} across seven models.
                    </>
                  }
                  more={
                    <p>
                      Planning on post-failure states (Proposition 8) gets 93.2% of {CHAINS.decided.toLocaleString('en-US')} decided gain signs right,
                      against 77.2% from marginal success rates. Feedback and scoring use disjoint halves of the tests; when the first attempt passes
                      every feedback test, feedback holds no failing output and lowers recovery.
                    </p>
                  }
                >
                  <Plate fig="5.7" title="Seeing the failing tests nearly doubles recovery" source={{ kind: 'data', ref: 'Table 14 · App. C.4' }} caption={<>Mean per-retry recovery after a failed first attempt. Hover a line for its numbers.</>}>
                    <RetrySlope />
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'verifiers',
              tag: 'Table 15',
              label: 'Verifiers',
              stat: '4.09× compiler gate',
              content: (
                <Pane
                  lede={
                    <>
                      For Qwen3-Max, a free compiler gate gives 4.09× dollar efficiency at −2.4 points, and an LLM judge {JUDGE.free}× if free but{' '}
                      {JUDGE.list}× at its list price. In seconds, always-Opus beats every verified cascade.
                    </>
                  }
                >
                  <Plate fig="5.8" title="Verification is a cost–quality menu" source={{ kind: 'data', ref: 'Table 15 · App. C.5' }} caption={<>Qwen3-Max cascades; efficiency includes the verifier&rsquo;s cost. Below, the same cascades in seconds.</>}>
                    <VerifierMenu />
                    <div className="mt-8 border-t border-dashed border-rule pt-7">
                      <ResourceFlip />
                    </div>
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'signals',
              tag: 'Proposition 9',
              label: 'Signals',
              stat: 'saves ≤ one attempt',
              content: (
                <Pane
                  lede={
                    <>
                      A forecast can save at most the attempt it replaces: a DeepSeek-v4-pro forecast costs 2.4 attempts at list price, a prompt-only
                      TF-IDF router 0.06% of one.
                    </>
                  }
                >
                  <Plate fig="5.9" title="What a signal can save, and what it may cost" source={{ kind: 'data', ref: 'Prop. 9 · Table 16' }} caption={<>The saving of any signal is at most <M>{'\\min\\{s(b-a),\\,a(1-s)\\}'}</M>. Right: released routers used as signals.</>}>
                    <VOIExplorer />
                    <div className="mt-8 border-t border-dashed border-rule pt-7">
                      <SignalCapture />
                    </div>
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'memory',
              tag: 'Table 17',
              label: 'Memory',
              stat: '+0.275 / −0.120',
              content: (
                <Pane
                  lede={
                    <>
                      A record store that sends each cell&rsquo;s tasks to the last model that passed verification gains 0.275 per round over
                      always-Opus, but loses 0.120 against a per-dimension best-model prior. Memory pays only against what it replaces.
                    </>
                  }
                >
                  <Plate fig="5.10" title="One record store, two priors" source={{ kind: 'data', ref: 'Table 17 · App. C.7' }} caption={<>Semi-synthetic streams; probing estimates through Proposition 10 predict {((MEMORY.signAgreement.right / MEMORY.signAgreement.of) * 100).toFixed(1)}% of the cell-level signs.</>}>
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                      <MemoryPriors />
                      <div className="lg:border-l lg:border-dashed lg:border-rule lg:pl-8">
                        <div className="mb-1 font-sans text-[14px] font-semibold text-ink">Cell-level sign agreement</div>
                        <p className="mb-5 font-sans text-[12.5px] leading-snug text-ink-3">Does the probing prediction of Eq. (13) get each cell&rsquo;s sign right?</p>
                        <SignAgreement />
                      </div>
                    </div>
                  </Plate>
                </Pane>
              ),
            },
          ]}
        />
      </div>
    </Section>
  );
}
