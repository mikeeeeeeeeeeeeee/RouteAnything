import { Section, Prose, Sub } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { MathBlock } from '@/components/math/MathBlock';
import { s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { RouterShare } from '@/components/viz/RouterShare';
import { RobotScenes } from '@/components/viz/RobotScenes';
import { TargetsCompare } from '@/components/viz/TargetsCompare';
import { BaselineArtifact } from '@/components/viz/BaselineArtifact';
import { SelectionDots } from '@/components/viz/SelectionDots';
import { MATCHED, OBJECTIVES, ONE_ROUTER, PORTFOLIO_EXAMPLE, ROBOT, ROUTERS_ALL } from '@/data/results';

export function Routers() {
  return (
    <Section
      id="routers"
      n="8"
      kicker={
        <>
          <span>Findings 2–5</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">What do learned routers recover?</span>
        </>
      }
      title="Learned routers recover the coarse rungs, and little more."
      lede="One router across modalities matches the best fixed arm. A router that reads camera frames follows the better robot policy in each scene. What a router is trained to predict, and what it is compared with, decide the rest."
    >
      {/* ---------- 8.1 one router ---------- */}
      <Sub id="one-router" n="8.1" kicker="Finding 2" title="One router across modalities" />
      <Prose className="mt-6">
        <p>
          The capability-tree router is a type router whose types are the {ONE_ROUTER.leaves} leaves of a tree over input modality, task and
          capability, on {ONE_ROUTER.trainBenchmarks} benchmarks. A Qwen3.5-4B classifier, trained on all of them at once, predicts the leaf,
          and one global table, fitted on training inputs, maps each leaf to its best arm; unresolved inputs go to the fixed arm. It is
          evaluated on the {ROUTERS_ALL.inputs.toLocaleString('en-US')} test inputs of {ROUTERS_ALL.benchmarks} benchmarks on which every
          compared policy is scored.
        </p>
        <p>
          One router over {ROUTERS_ALL.benchmarks} benchmarks in five output groups scores {ROUTERS_ALL.router}, against {ROUTERS_ALL.fixed}{' '}
          for the fixed arm and {ROUTERS_ALL.oracle.toFixed(2)} for the oracle. It matches the fixed arm to within 0.01 points on{' '}
          {ONE_ROUTER.matchedWithin001} benchmarks and departs from it where arms complement each other input by input: Terminal-Bench
          (+8.3 points on 36 inputs), VBench-2.0 (+2.1), OneIG (+1.1) and GDP.pdf (+1.0); its largest loss is AA-LCR (−2.4). The leaf
          classifier is 86–89% accurate, yet 83–86% of inputs still go to the fixed arm, because within a benchmark one arm wins almost every
          type, as Proposition 3 predicts.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="12"
          title="Learned routers land next to the fixed arm"
          source={{ kind: 'data', ref: 'Table 3 · Table 7' }}
          caption={
            <>
              Each track runs from the best fixed arm (0% of the headroom) to the per-input oracle (100%); the marker is the router, labelled
              with its share and its difference from the fixed arm in points. Test inputs, one training seed; the robot row is the outcome
              router of §8.2, which reads camera frames. By benchmark, the router matches the fixed arm to within 0.01 points on 10 of 16
              benchmarks and departs only where arms complement each other input by input.
            </>
          }
        >
          <RouterShare />
        </Plate>
      </div>

      {/* ---------- 8.2 robots ---------- */}
      <div className="mt-24">
        <Sub id="robots" n="8.2" kicker="Finding 3" title="Routers that read the scene" />
      </div>
      <Prose className="mt-6">
        <p>
          On RoboTwin, the outcome router reads the instruction, three 240×320 camera frames and the robot state, and predicts the success of
          each of seven vision-language-action policies with one sigmoid head per policy, trained by cross-entropy on all{' '}
          {ROBOT.trainOutcomes.toLocaleString('en-US')} training outcomes. No task identity enters the input, and the{' '}
          {ROBOT.scenes.toLocaleString('en-US')} test scenes come from {ROBOT.unseenTasks} tasks the router never sees, half clean and half
          domain-randomized. ME-Dex is the best policy on training scenes and on test scenes ({ROBOT.overall.fixed}%); PatchWAM is second (
          {ROBOT.overall.patchWam}%).
        </p>
        <p>
          The best policy flips between the two conditions, and the router tracks it. It sends 929 of the 1,000 clean scenes to PatchWAM and
          842 of the 1,000 randomized scenes to ME-Dex. Overall success is {ROBOT.overall.router}% against {ROBOT.overall.fixed}% (+1.10 [−0.40,
          +2.55]), at {ROBOT.seconds.router} instead of {ROBOT.seconds.meDex} seconds of policy time per scene: 24% less, and{' '}
          {ROBOT.seconds.successPerSecond}× the success per policy-second of the best single policy. This is the coarse rung of Proposition 3
          learned from pixels, since the condition-level choice alone would score {ROBOT.conditionChoice}%; the remaining 17 points to the
          oracle require predicting which policy succeeds on a given scene.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="13"
          title="The router follows the better policy in each scene"
          source={{ kind: 'data', ref: 'Fig. 4' }}
          caption={
            <>
              Above, each chip is a RoboTwin 2.0 test scene; the router reads the instruction, three camera frames and the robot state, and
              plays the policy with the highest predicted success. The stream is illustrative; its long-run split is the paper&rsquo;s. Below,
              success on the 2,000 test scenes from 10 unseen tasks, with dashed lines at the per-scene oracle, and mean policy time per scene.
            </>
          }
        >
          <RobotScenes />
        </Plate>
      </div>

      {/* ---------- 8.3 targets ---------- */}
      <div className="mt-24">
        <Sub id="learn" n="8.3" kicker="Finding 4" title="What a router should learn" />
      </div>
      <Prose className="mt-6">
        <p>
          With the same inputs, backbone and training scenes, the winner-label classifier reaches 42.8% robot success against 71.6% for
          per-policy outcome regression. The labels explain the gap, as Proposition 4(b) predicts: several policies succeed on most training
          scenes, a latency tie-break decides {Math.round(OBJECTIVES.labels.tieBreakShare * 100)}% of the labels, and{' '}
          {OBJECTIVES.labels.wrongClass.toLocaleString('en-US')} of the {OBJECTIVES.labels.successful.toLocaleString('en-US')} successful
          training outcomes become wrong-class targets, so the classifier learns to pick fast policies (1.9 seconds per scene) that often fail.
        </p>
        <p>
          Outside robotics no panel compares the two targets directly, and no target beats the fixed arm. Generative winner-label routers on
          16 benchmarks learn from {OBJECTIVES.winnerLabels16.labels.toLocaleString('en-US')} labels of which only a third are decided by a
          unique best outcome; the best of {OBJECTIVES.winnerLabels16.recipes} recipes scores 78.87 against 79.44 for the fixed arm. On 11
          text, agent and image benchmarks, the outcome router stays within noise of the matched fixed arm (−0.40 [−1.19, +0.33]), and a type
          router over 68 types, although 75% accurate, maps 93% of its predictions to the same arm as the true type and scores 1.32 points
          below it.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="14"
          title="Outcomes beat winners"
          source={{ kind: 'data', ref: 'Table 4 · §5.3' }}
          caption={
            <>
              Robot success on 2,000 RoboTwin test scenes of two routers that share inputs, backbone and training scenes; the solid line is
              the fixed policy ME-Dex, the dashed line the per-scene oracle. A latency tie-break decides 94% of the winner labels and turns
              24,556 of the 31,408 successful training outcomes into wrong-class targets. Outside robotics, no training target beats the
              fixed arm.
            </>
          }
        >
          <TargetsCompare />
        </Plate>
      </div>

      {/* ---------- 8.4 matched comparisons ---------- */}
      <div className="mt-24">
        <Sub id="matched" n="8.4" kicker="Finding 5" title="Compare arms on the same inputs" />
      </div>
      <Prose className="mt-6">
        <p>
          A fixed baseline that admits a model only if it has a score on every training input drops strong models over a few missing scores.
          In the 11-benchmark study, Opus 5.5 missed a few scores on {MATCHED.benchmarksWithMissing} benchmarks, for example{' '}
          {MATCHED.hleMissing.missed} of {MATCHED.hleMissing.of.toLocaleString('en-US')} training inputs of HLE, so the baseline fell back to
          the next model there: on HLE it scored 52.90 instead of 58.24, and on AA-Omniscience 70.00 instead of 77.50. Pooled, the baseline
          dropped from 68.30 to 65.52, and the outcome router&rsquo;s 0.40-point deficit became a 2.38-point gain. Choosing and evaluating the
          fixed arm under the routers&rsquo; fallback, which uses GPT-6 Astra&rsquo;s outcome where Opus 5.5 has none, removes the artifact.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="15"
          title="The same router, two baselines"
          source={{ kind: 'data', ref: '§5.4 · Table 4' }}
          caption={
            <>
              Switch the baseline. Only the fixed arm moves: requiring a score on every training input drops Opus 5.5 where it missed a few,
              and the router&rsquo;s deficit turns into a gain it did not earn.
            </>
          }
        >
          <BaselineArtifact />
        </Plate>
      </div>

      <Prose className="mt-12">
        <p>
          <strong>The same rule governs portfolios.</strong> Adding a model changes which tasks reach the fallback. For a portfolio{' '}
          <M>{'S'}</M> and a candidate <M>{'m'}</M>, Lemma 1 with <M>{'S'}</M> as the reference gives the paired gain
        </p>
        <MathBlock n="8">{`${s('G')}=\\mathbb E[V_{S^+}-V_S]-\\eta(S)\\,\\mathbb E[D_{S^+}-D_S],`}</MathBlock>
        <p>
          so adding <M>{'m'}</M> improves efficiency if and only if <M>{'G_m(S)>0'}</M>. Averages frozen at the current portfolio, as in the
          residual-coverage rule <M>{'N_m(S)'}</M> of Eq. (9), misrank candidates. Comparing both portfolios on the same tasks picks the best
          added model in 96.4–97.1% of CodeRouterBench comparisons, against 86.3–94.3% for frozen averages, differences whose cluster-bootstrap
          intervals include zero. Adding {PORTFOLIO_EXAMPLE.add} to the {PORTFOLIO_EXAMPLE.to}, for example, is predicted to lose 1.4 score
          per dollar but gains +5.0 [3.5, 6.6], because the fallback cost of the new failure set falls by 14%.
        </p>
      </Prose>
      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="16"
          title="Paired selection picks the best candidate most often"
          source={{ kind: 'data', ref: 'Table 13' }}
          caption={
            <>
              Share of comparisons in which a rule&rsquo;s fitted choice has the highest test efficiency among the candidates. Candidates are
              fitted on probing and evaluated on test tasks; an oracle verifier commits to the best passing member, else calls the reference,
              and every member call is charged. Marginal success forgoes 13–17% of the best candidate&rsquo;s efficiency; paired selection, at
              most 0.06%.
            </>
          }
        >
          <SelectionDots />
        </Plate>
      </div>
    </Section>
  );
}
