import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { MatrixMap } from '@/components/viz/MatrixMap';
import { MATRIX } from '@/data/results';

export function Matrix() {
  return (
    <Section
      id="matrix"
      n="6"
      kicker={
        <>
          <span>Setup</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Paper §3</span>
        </>
      }
      title="One outcome matrix: every arm on the same inputs."
      lede="Every arm of a pool runs on the same inputs and is scored with the benchmark's own metric, rescaled to 0–100. Routers and arms are therefore compared input by input, never across different samples."
    >
      <Prose>
        <p>
          <strong>Benchmarks and arms.</strong> The {MATRIX.benchmarks} benchmarks form seven groups: text QA, image-text QA, image, video
          and speech generation, code and workplace agents, and robot manipulation (RoboTwin 2.0, 50 bimanual tasks in clean and randomized
          scenes). Questions go to three language models, Claude Opus 5.5, GPT-6.1 Sol and DeepSeek V4.1 Flash, joined by GPT-6 Astra for
          long-context, knowledge and agent tasks. The other pools have six image generators, three video generators, three speech
          generators and seven vision-language-action policies. The matrix holds {MATRIX.runs.toLocaleString('en-US')} scored runs on{' '}
          {MATRIX.tasks.toLocaleString('en-US')} tasks from {MATRIX.armVersions} arm versions, which differ in model, harness and effort.
          Costs are recorded in dollars for image and speech generation, and in policy seconds for robots.
        </p>
        <p>
          <strong>Splits, routers, baselines.</strong> Inputs are split 70/10/20 by source group, so identical inputs never cross splits;
          RoboTwin is split by task family, and its 2,000 test scenes come from 10 tasks the router never sees. The test split has{' '}
          {MATRIX.testInputs.toLocaleString('en-US')} inputs on which every arm of the pool is scored. Learned routers fine-tune Qwen3.5-4B
          and read the task text and the output requirement, and for robots also three camera frames and the robot state. An{' '}
          <em>outcome router</em> scores each pair of input and arm and plays the highest score; a <em>type router</em> classifies the input
          into a capability type and plays the best arm for that type; a <em>winner-label router</em> is trained to name the best arm. The{' '}
          <em>fixed arm</em> is the best arm per benchmark on training inputs, and the <em>oracle</em> plays the best observed arm on each
          input. Differences carry paired 95% bootstrap intervals over source groups.
        </p>
        <p>
          <strong>Priced testbeds.</strong> CodeRouterBench records the outcomes and token-price costs of eight models on 9,999 coding tasks,
          and RouterBench supplies eleven models on 36,497 mostly non-code prompts. Their references are Opus 4.6 and gpt-4-1106-preview.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="10"
          title="The matrix, and the panels cut from it"
          source={{ kind: 'data', ref: '§3 · Table 1 · App. B.1' }}
          caption={
            <>
              Each study is scored on the test inputs on which all its compared policies have outcomes, so the fixed arm and the oracle
              differ from study to study; every comparison on this page is made within one panel. Hover a group to see the pool it draws on.
            </>
          }
        >
          <MatrixMap />
        </Plate>
      </div>
    </Section>
  );
}
