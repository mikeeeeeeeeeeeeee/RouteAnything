import type { ReactNode } from 'react';
import { Section } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Gather } from '@/components/ui/Gather';
import { Fold } from '@/components/ui/Fold';
import { MathBlock } from '@/components/math/MathBlock';
import { s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { RouterShare } from '@/components/viz/RouterShare';
import { RobotScenes } from '@/components/viz/RobotScenes';
import { TargetsCompare } from '@/components/viz/TargetsCompare';
import { BaselineArtifact } from '@/components/viz/BaselineArtifact';
import { SelectionDots } from '@/components/viz/SelectionDots';
import { MATCHED, OBJECTIVES, ONE_ROUTER, PORTFOLIO_EXAMPLE, ROBOT, ROUTERS_ALL } from '@/data/results';

/** one finding inside a tab: a sentence or two, the figure, the rest folded */
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

export function Recover() {
  return (
    <Section
      id="recover"
      n="4"
      kicker={
        <>
          <span>Findings 2–5</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">What do learned routers recover?</span>
        </>
      }
      title="Learned routers recover the coarse rungs, and little more."
      lede="Across 16 benchmarks one router matches the best fixed candidate and captures about 6% of the headroom. Where the input shows which candidate will win, as camera frames do for robot policies, a router trained on per-candidate outcomes follows it."
    >
      <div className="md:ml-[190px]">
        <Fold label="How the routers are built">
          <p className="max-w-[720px]">
            The routers fine-tune Qwen3.5-4B on the task text and the output requirement, and for robots also on three camera frames and the
            robot state. An <em>outcome router</em> scores each pair of input and candidate with a sigmoid head, trained by cross-entropy against
            the candidate&rsquo;s normalized outcome, and plays the highest score. A <em>type router</em> classifies the input into a capability
            type and plays that type&rsquo;s best candidate. A <em>winner-label router</em> is trained to name the best candidate. Each study is
            scored on the test inputs where all its compared policies have outcomes, so fixed and oracle scores are comparable only within a
            study.
          </p>
        </Fold>
      </div>

      <div className="mt-8 md:ml-[190px]">
        <Gather
          ariaLabel="Findings 2 to 5"
          items={[
            {
              key: 'one',
              tag: '§4.1 · Finding 2',
              label: 'One router across modalities',
              stat: '6% of the headroom',
              content: (
                <Pane
                  lede={
                    <>
                      One capability-tree router over {ROUTERS_ALL.benchmarks} benchmarks scores {ROUTERS_ALL.router}, against {ROUTERS_ALL.fixed} for
                      the fixed candidate and {ROUTERS_ALL.oracle.toFixed(2)} for the oracle. It departs from the fixed candidate only where
                      candidates complement each other input by input.
                    </>
                  }
                  more={
                    <p>
                      The types are the {ONE_ROUTER.leaves} leaves of a tree over input modality, task and capability. The leaf classifier is
                      86–89% accurate, yet 83–86% of inputs still go to the fixed candidate, because within a benchmark one candidate wins almost
                      every type. Gains come on Terminal-Bench (+8.3 points on 36 inputs), VBench-2.0 (+2.1), OneIG (+1.1) and GDP.pdf (+1.0); the
                      largest loss is AA-LCR (−2.4). Across 31 router designs and 124 configurations on GenEval2 and Qwen-Image-Bench, none beats
                      the fixed generator with an interval above zero.
                    </p>
                  }
                >
                  <Plate
                    fig="4.1"
                    title="Learned routers land next to the fixed candidate"
                    source={{ kind: 'data', ref: 'Table 3 · Table 7' }}
                    caption={<>Each track runs from the best fixed candidate (0% of the headroom) to the per-input oracle (100%); the marker is the router. Test inputs, one training seed.</>}
                  >
                    <RouterShare />
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'robots',
              tag: '§4.2 · Finding 3',
              label: 'Routers that read the scene',
              stat: '24% less policy time',
              content: (
                <Pane
                  lede={
                    <>
                      From three camera frames, the router sends clean scenes to PatchWAM and randomized ones to ME-Dex, matching the better policy
                      in each condition: {ROBOT.overall.router}% success against {ROBOT.overall.fixed}% for the best single policy, at{' '}
                      {ROBOT.seconds.router} instead of {ROBOT.seconds.meDex} seconds per scene.
                    </>
                  }
                  more={
                    <p>
                      The outcome router reads the instruction, three 240×320 camera frames and the robot state, and predicts the success of each of
                      seven vision-language-action policies; no task identity enters the input, and the {ROBOT.scenes.toLocaleString('en-US')} test
                      scenes come from {ROBOT.unseenTasks} tasks it never sees. It sends 929 of 1,000 clean scenes to PatchWAM and 842 of 1,000
                      randomized scenes to ME-Dex. This is the coarse rung of Proposition 3 learned from pixels, since the condition-level choice
                      alone would score {ROBOT.conditionChoice}%; the remaining 17 points to the oracle require predicting which policy succeeds on a
                      given scene.
                    </p>
                  }
                >
                  <Plate
                    fig="4.2"
                    title="The router follows the better policy in each scene"
                    source={{ kind: 'data', ref: 'Fig. 4' }}
                    caption={<>Each chip is a RoboTwin 2.0 test scene; the stream is illustrative, its long-run split is the paper&rsquo;s. Dashed lines mark the per-scene oracle.</>}
                  >
                    <RobotScenes />
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'targets',
              tag: '§4.3 · Finding 4',
              label: 'What a router should learn',
              stat: '71.6% vs 42.8%',
              content: (
                <Pane
                  lede={
                    <>
                      With the same inputs, backbone and training scenes, regressing each policy&rsquo;s success reaches 71.6% robot success and
                      classifying the winner 42.8%, because a latency tie-break decides {Math.round(OBJECTIVES.labels.tieBreakShare * 100)}% of the
                      winner labels.
                    </>
                  }
                  more={
                    <p>
                      Several policies succeed on most training scenes, so {OBJECTIVES.labels.wrongClass.toLocaleString('en-US')} of the{' '}
                      {OBJECTIVES.labels.successful.toLocaleString('en-US')} successful training outcomes become wrong-class targets and the
                      classifier learns to pick fast policies that often fail, as Proposition 4(b) predicts. Outside robotics no target beats the
                      fixed candidate: the best of 12 winner-label recipes scores 78.87 against 79.44 on 16 benchmarks, and on 11 benchmarks the
                      outcome router stays within noise of the matched fixed candidate (−0.40 [−1.19, +0.33]).
                    </p>
                  }
                >
                  <Plate
                    fig="4.3"
                    title="Outcomes beat winners"
                    source={{ kind: 'data', ref: 'Table 4 · §4.3' }}
                    caption={<>Two routers that share inputs, backbone and training scenes; the solid line is the fixed policy ME-Dex, the dashed line the per-scene oracle.</>}
                  >
                    <TargetsCompare />
                  </Plate>
                </Pane>
              ),
            },
            {
              key: 'matched',
              tag: '§4.4 · Finding 5',
              label: 'Compare on the same inputs',
              stat: '−0.40 → +2.38',
              content: (
                <Pane
                  lede={
                    <>
                      A fixed baseline that requires a score on every training input dropped Opus 5.5, which missed {MATCHED.hleMissing.missed} of{' '}
                      {MATCHED.hleMissing.of.toLocaleString('en-US')} HLE scores, and turned the outcome router&rsquo;s 0.40-point deficit into a
                      2.38-point gain.
                    </>
                  }
                  more={
                    <>
                      <p>
                        Choosing and evaluating the fixed candidate under the routers&rsquo; fallback, which uses GPT-6 Astra&rsquo;s outcome where
                        Opus 5.5 has none, removes the artifact. The same rule governs portfolios: adding a model changes which tasks reach the
                        fallback, and Lemma 1 with the current portfolio <M>{'S'}</M> as the reference gives the paired gain
                      </p>
                      <MathBlock n="8">{`${s('G')}=\\mathbb E[V_{S^+}-V_S]-\\eta(S)\\,\\mathbb E[D_{S^+}-D_S].`}</MathBlock>
                      <p>
                        Adding {PORTFOLIO_EXAMPLE.add} to the {PORTFOLIO_EXAMPLE.to}, for example, is predicted by frozen averages to lose 1.4 score
                        per dollar but gains +5.0 [3.5, 6.6].
                      </p>
                    </>
                  }
                >
                  <Plate
                    fig="4.4"
                    title="The same router, two baselines"
                    source={{ kind: 'data', ref: '§4.4 · Table 4' }}
                    caption={<>Switch the baseline. Only the fixed candidate moves; the router stays at 67.90.</>}
                  >
                    <BaselineArtifact />
                  </Plate>
                  <Plate
                    fig="4.5"
                    title="Paired selection picks the best added model most often"
                    source={{ kind: 'data', ref: 'Table 13' }}
                    caption={<>Share of comparisons in which a rule&rsquo;s fitted choice has the highest test efficiency; comparing both portfolios on the same tasks leads in every setting.</>}
                  >
                    <SelectionDots />
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
