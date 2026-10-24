import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { HeadroomBars } from '@/components/viz/HeadroomBars';
import { HEADROOM_ALL, LADDER } from '@/data/results';

export function Headroom() {
  return (
    <Section
      id="headroom"
      n="7"
      kicker={
        <>
          <span>Finding 1</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">How much can routing gain?</span>
        </>
      }
      title="The headroom is large, and it lives inside task types."
      lede="Per input, the best arm beats the best fixed arm per benchmark by 5.4 points. Little of that gap is available to a router that sees only the benchmark or the task type."
    >
      <Prose>
        <p>
          Proposition 3 orders what routers can reach. The paper measures its outer rungs on the test split, the best fixed arm and the
          per-input oracle, and the rungs in between with the best lookup per benchmark or per type chosen in hindsight, which overstates what
          a fitted lookup can reach.
        </p>
        <p>
          On the {HEADROOM_ALL.inputs.toLocaleString('en-US')} test inputs, the best fixed arm per benchmark scores {HEADROOM_ALL.fixed.toFixed(2)}{' '}
          and the per-input oracle {HEADROOM_ALL.oracle}. The gap is 0.7 points for speech generation, where every generator is nearly
          perfect, and 18–19 points for video generation and robot manipulation, where no arm dominates.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="11"
          title="Per-input headroom, by output type"
          source={{ kind: 'data', ref: 'Table 2 · Table 6' }}
          caption={
            <>
              Test inputs on which every arm of the pool is scored; values are benchmark metrics on a 0–100 scale, pooled over inputs. The
              hollow dot is the best arm per benchmark chosen on training inputs, the filled dot the best arm on each input. Switch to the
              benchmark view for the arm behind each fixed score.
            </>
          }
        >
          <HeadroomBars />
        </Plate>
      </div>

      <Prose className="mt-12">
        <p>
          <strong>Little of the gap is between types.</strong> The best arm per benchmark chosen in hindsight raises{' '}
          {LADDER.all.fixed.toFixed(2)} only to {LADDER.all.perBenchmark}. On the {LADDER.typed.benchmarks} benchmarks of the rule-based
          capability tree, which assigns each of {LADDER.typed.inputs.toLocaleString('en-US')} test inputs to one of {LADDER.typed.leaves}{' '}
          capability leaves, the best arm per leaf chosen in hindsight scores {LADDER.typed.perLeaf}, against {LADDER.typed.fixed} for the
          fixed arm and {LADDER.typed.oracle} for the oracle: about 8% of the gap lies between types. On RoboTwin, the best policy per task and
          scene condition, again chosen on the test scenes, recovers 23% of the 18.4-point gap. Code tasks show the same split: the best
          released CodeRouterBench routers capture 55% of the value of perfect routing information when the task type is unknown, but only
          6–8% within a task type.
        </p>
        <p>
          <strong>Inside a type, outcomes vary input by input.</strong> On GenEval2, each of the five other generators beats the fixed one by
          more than two points on 76–100 training prompts while trailing it on more, and the per-prompt difference has a standard deviation of
          31–38 points against mean differences of 4–14. Part of this variation is noise that no router can predict, the last gap of
          Proposition 3: on AA-LCR, where every question is answered three times, the oracle&rsquo;s 2.4-point margin over the fixed arm
          vanishes once each arm is scored by its mean over the three runs.
        </p>
        <p>
          Section 8 studies learned routers on every benchmark except seven understanding ones, on which no router has been evaluated yet.
          These seven hold three quarters of the inputs in Table 2 and half of its pooled gap, but their gaps are only 1.4–6.0 points per
          input; every benchmark with a gap above 8 points is among those studied.
        </p>
      </Prose>
    </Section>
  );
}
