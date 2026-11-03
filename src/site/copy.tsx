import type { ReactNode } from 'react';
import { HEADROOM_ALL, JUDGE, MATRIX, MEMORY, OBJECTIVES, PRICE_FACTS, RETRY_POOLED, ROBOT, ROUTERS_ALL } from '@/data/results';

// Every sentence on the page, shared by the desktop and the phone layouts. Numbers come from the data file where
// one exists; the rest are quoted from the paper (2026-11-03).

const v = (s: string) => <i className="var">{s}</i>;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const n = (x: number) => x.toLocaleString('en-US');

export interface StatRow {
  k: string;
  note: ReactNode;
  us: { v: string; c: string };
  them: { v: string; c: string };
}

export const COPY = {
  hero: {
    sub: 'One router for language models, image, video and speech generators, and robot policies.',
    buy: 'The best candidate per input beats the best fixed one by 5.4 points.',
    buy2: 'Near-zero-loss routes are 25.5× as efficient on code.',
    thread: 'The research thread',
    panels: [
      { t: 'Headroom per input, by output type' },
      { t: 'Efficiency at near-zero quality loss', key: 'Price route, against the testbed’s reference' },
    ],
  },

  how: {
    eyebrow: 'How it works',
    h: ['One rule.', 'Every output type.'],
    lede: (
      <>
        A router observes a state and plays the candidate with <b>the highest value minus priced cost</b>. When no price is given, a reference
        policy and a quality tolerance fix it, and a test on fresh inputs certifies the floor.
      </>
    ),
    setting: {
      k: 'The setting',
      h: 'Every candidate of a pool runs on the same inputs.',
      note: (
        <>
          {MATRIX.benchmarks} benchmarks in {MATRIX.groups} groups, {n(MATRIX.runs)} scored runs, {MATRIX.armVersions} candidate configurations.
          Two code and text testbeds with recorded prices add the cost side.
        </>
      ),
    },
    cards: [
      {
        key: 'thm2',
        k: 'Theorem 2',
        h: 'The reference and the tolerance fix the price.',
        note: (
          <>
            At price {v('λ')}, each candidate is worth {v('v')} − {v('λc')}, a line. The best router follows the upper envelope, whose root is the
            highest efficiency {v('η')}*. Under a quality floor it routes at one price, {v('λ')}
            <sub>{v('ε')}</sub>.
          </>
        ),
      },
      {
        key: 'prop3',
        k: 'Proposition 3',
        h: 'What a router sees bounds what it can reach.',
        note: (
          <>
            Seeing the benchmark, a capability type or the input itself lifts the reachable value one rung at a time. The oracle sits above the top
            rung by outcome noise that no router can predict.
          </>
        ),
      },
      {
        key: 'prop4',
        k: 'Proposition 4',
        h: 'Learn each candidate’s outcome, not the winner.',
        note: (
          <>
            Regressing outcomes estimates {v('E')}[{v('V')} | {v('x')}], which the rule needs. A winner label can favor a candidate that wins more often
            but delivers less, and lose almost half of the value range.
          </>
        ),
      },
      {
        key: 'prop5',
        k: 'Proposition 5',
        h: 'Test in order. Stop at the first failure.',
        note: (
          <>
            Routers on the fitted price path are tested in order on fresh inputs. The certified one breaks the floor with probability at most{' '}
            {v('α')}, with no multiplicity correction.
          </>
        ),
      },
    ],
    foot: 'Lemma 1, Theorem 2 and Propositions 3–5 are proved in the paper’s appendix.',
  },

  gain: {
    eyebrow: 'How much can routing gain?',
    h: ['The headroom is large.', 'It lives inside task types.'],
    lede: (
      <>
        On {n(HEADROOM_ALL.inputs)} held-out inputs from {HEADROOM_ALL.benchmarks} benchmarks, the best candidate per input beats the best fixed
        candidate per benchmark by <b>5.4 points</b>, from 0.7 for speech generation to 18–19 for video generation and robot manipulation. A
        lookup by capability type, even chosen in hindsight, closes only <b>8%</b> of the gap.
      </>
    ),
    fig: {
      t: 'Where the headroom lies',
      sub: 'Share of the gap from the best fixed candidate to the per-input oracle that the best lookup recovers, chosen in hindsight.',
      cap: 'Inside a type, outcomes vary input by input. On GenEval2, per-prompt differences between generators have a standard deviation of 31–38 points against mean differences of 4–14.',
    },
  },

  recover: {
    eyebrow: 'What do learned routers recover?',
    h: ['Routers capture 6%.', 'On robots, they read the scene.'],
    lede: (
      <>
        One router over {ROUTERS_ALL.benchmarks} benchmarks scores {ROUTERS_ALL.router}, against {ROUTERS_ALL.fixed} for the fixed candidate and{' '}
        {ROUTERS_ALL.oracle.toFixed(2)} for the oracle: <b>{pct(ROUTERS_ALL.share)} of the headroom</b>. From three camera frames, a router sends
        clean scenes to PatchWAM and randomized ones to ME-Dex, matching the better policy with <b>{pct(ROBOT.seconds.saving)} less policy time</b>.
      </>
    ),
    share: {
      t: 'Headroom a learned router captures',
      sub: 'Router gain over the fixed candidate, as a share of the oracle’s. Test inputs, one training seed.',
      cap: 'The router departs from the fixed candidate only where candidates complement each other input by input, as on Terminal-Bench (+8.3 points) and VBench-2.0 (+2.1).',
    },
    robot: {
      t: 'Robot success by scene condition',
      sub: `${n(ROBOT.scenes)} RoboTwin test scenes from ${ROBOT.unseenTasks} tasks the router never saw.`,
      cap: `Policy time per scene: ${ROBOT.seconds.router} s for the router, ${ROBOT.seconds.meDex} s for ME-Dex, the best single policy.`,
    },
    rows: [
      {
        k: 'Training target',
        note: `Robot success with the same inputs and backbone. A latency tie-break decides ${pct(OBJECTIVES.labels.tieBreakShare)} of the winner labels.`,
        us: { v: '71.6%', c: 'Regress each policy’s outcome' },
        them: { v: '42.8%', c: 'Predict the winning policy' },
      },
      {
        k: 'Baseline',
        note: 'The same router’s score minus the fixed candidate’s, on 11 benchmarks.',
        us: { v: '−0.40', c: 'Against the matched fixed candidate' },
        them: { v: '+2.38', c: 'Against one that drops models with missing scores' },
      },
    ] as StatRow[],
  },

  pay: {
    eyebrow: 'When does routing pay through price?',
    h: ['Routing pays most', 'through price.'],
    lede: (
      <>
        Where candidates differ more in price than in value, near-zero-loss routes raise efficiency <b>25.5×</b> on code and <b>7.1×</b> on text
        QA. Fitted on half of the data, the zero-loss floor holds on test in only 12.5% of 200 splits; certified on the other half, in{' '}
        <b>all 200</b>.
      </>
    ),
    fig: {
      t: 'A floor that holds on new inputs',
      sub: 'The zero-loss floor on CodeRouterBench, refitted on 200 random halves of the probing tasks. One square per split, filled where the floor holds on test.',
      cap: `Most of the 25.5× on code is the reference’s price: always calling the cheapest model reaches ${PRICE_FACTS.code.qwenAlways.eff}× at a ${PRICE_FACTS.code.qwenAlways.loss}-point loss, and routing by state recovers that loss.`,
    },
    spend: {
      k: 'Spending more within a task',
      h: 'Richer candidates pay only against what they replace.',
    },
    rows: [
      {
        k: 'Retries',
        note: 'Per-retry recovery after a failure, across seven models.',
        us: { v: RETRY_POOLED.feedback.toFixed(3).replace(/^0/, ''), c: 'With the failing tests as feedback' },
        them: { v: RETRY_POOLED.fresh.toFixed(3).replace(/^0/, ''), c: 'Fresh retry' },
      },
      {
        k: 'Verifiers',
        note: 'Dollar efficiency of a Qwen3-Max cascade, verifier included.',
        us: { v: '4.09×', c: 'Free compiler gate' },
        them: { v: `${JUDGE.list.toFixed(2)}×`, c: 'LLM judge at list price' },
      },
      {
        k: 'Memory',
        note: 'Gain per round of one record store, in value minus priced cost.',
        us: { v: `+${MEMORY.priors[0].realized[0].toFixed(3)}`, c: 'Over always-Opus' },
        them: { v: `−${Math.abs(MEMORY.priors[1].realized[0]).toFixed(3)}`, c: 'Over a per-dimension best-model prior' },
      },
    ] as StatRow[],
  },

  paper: {
    eyebrow: 'Technical report · November 2026',
    foot: 'Figures are redrawn from the paper’s tables and figures; the four small drawings under How it works illustrate the statements with made-up numbers. The omni-modal matrix itself is not released.',
  },
};
