import { Section } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Fold } from '@/components/ui/Fold';
import { HeadroomBars } from '@/components/viz/HeadroomBars';
import { MatrixMap } from '@/components/viz/MatrixMap';
import { HEADROOM_ALL, LADDER, MATRIX } from '@/data/results';

export function Gain() {
  return (
    <Section
      id="gain"
      n="3"
      kicker={
        <>
          <span>Finding 1</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">How much can routing gain?</span>
        </>
      }
      title="The headroom is large, and it lives inside task types."
      lede="On 19,814 held-out inputs, the per-input oracle beats the best fixed candidate per benchmark by 5.4 points, from 0.7 for speech generation to 18–19 for video generation and robot manipulation. The best candidate per capability type, even chosen in hindsight, closes only about 8% of the gap."
    >
      <div className="md:ml-[190px]">
        <Plate
          fig="3.1"
          title="Per-input headroom, by output type"
          source={{ kind: 'data', ref: 'Table 1 · Table 6' }}
          caption={
            <>
              Hollow: the best candidate per benchmark, chosen on training inputs. Filled: the best candidate on each input. Values are benchmark
              metrics on a 0–100 scale; switch to the benchmark view for the candidate behind each fixed score.
            </>
          }
        >
          <HeadroomBars />
        </Plate>
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 md:ml-[190px]">
        <Fold>
          <div className="max-w-[720px]">
            <p>
              The best fixed candidate per benchmark scores {HEADROOM_ALL.fixed.toFixed(2)} and the per-input oracle {HEADROOM_ALL.oracle}. Little
              of the gap is available to a router that sees only the benchmark or the task type: the best candidate per benchmark chosen in
              hindsight raises {LADDER.all.fixed.toFixed(2)} only to {LADDER.all.perBenchmark}, and on the {LADDER.typed.benchmarks} benchmarks of
              the rule-based capability tree ({LADDER.typed.leaves} leaves) the best candidate per leaf scores {LADDER.typed.perLeaf}, against{' '}
              {LADDER.typed.fixed} for the fixed candidate and {LADDER.typed.oracle} for the oracle. On RoboTwin, the best policy per task and scene
              condition recovers 23% of the 18.4-point gap. Released CodeRouterBench routers capture 55% of the value of perfect routing
              information when the task type is unknown, but only 6–8% within a task type.
            </p>
            <p>
              Inside a type, outcomes vary input by input. On GenEval2, the per-prompt difference between generators has a standard deviation of
              31–38 points against mean differences of 4–14. Part of this is noise that no router can predict: on AA-LCR, where every question
              is answered three times, the oracle&rsquo;s 2.4-point margin vanishes once each candidate is scored by its mean over the runs.
            </p>
            <p>
              Learned routers are studied on every benchmark except seven understanding ones. Those seven hold three quarters of the inputs and
              half of the pooled gap, but their gaps are only 1.4–6.0 points; every benchmark with a gap above 8 points is studied.
            </p>
          </div>
        </Fold>
        <Fold
          label={
            <>
              What was measured
              <span className="num font-mono text-[11.5px] font-normal text-ink-3">
                {MATRIX.benchmarks} benchmarks · {MATRIX.runs.toLocaleString('en-US')} scored runs · {MATRIX.armVersions} candidate configurations
              </span>
            </>
          }
        >
          <p className="max-w-[720px]">
            Every candidate in a pool runs on the same inputs, and each run is scored by the benchmark&rsquo;s own metric on a 0–100 scale. Inputs
            are split 70/10/20 by source group, so identical inputs never cross splits; RoboTwin&rsquo;s 2,000 test scenes come from 10 tasks the
            routers never see. The fixed candidate plays the best candidate per benchmark on training inputs, and the oracle the best observed
            candidate on each input.
          </p>
          <div className="mt-6">
            <Plate fig="3.2" title="The matrix, and the panels cut from it" source={{ kind: 'data', ref: '§3 · Table 2 · App. B.1' }}>
              <MatrixMap />
            </Plate>
          </div>
        </Fold>
      </div>
    </Section>
  );
}
