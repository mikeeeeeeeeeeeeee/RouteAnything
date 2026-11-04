import type { ReactNode } from 'react';
import { FORECAST, HEADROOM_ALL, JUDGE, MATRIX, NEAR_ZERO_MEAN, OBJECTIVES, PRICE_FACTS, ROBOT, ROUTERS, ROUTERS_ALL } from '@/data/results';
import { trial } from '@/data/trial';

// Every sentence on the page, shared by the desktop and the phone layouts. Numbers come from the data file where
// one exists; the rest are quoted from the paper (arXiv 2611.05275v1).

const v = (s: string) => <i className="var">{s}</i>;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const n = (x: number) => x.toLocaleString('en-US');
/** routing's mean efficiency over the reference across the four testbeds: 8.82× */
const mean = `${NEAR_ZERO_MEAN.toFixed(2)}×`;
const video = ROUTERS.find((r) => r.key === 'video')!;

export interface StatRow {
  k: string;
  note: ReactNode;
  us: { v: string; c: string };
  them: { v: string; c: string };
}

export const COPY = {
  hero: {
    sub: 'One router for language models, image, video and speech generators, and robot policies.',
    buy: 'A potential path to AGI could be a router.',
    buy2: `Route Anything brings routing to text, images, video, speech, code, and robots, delivering ${mean} average relative efficiency across four settings and exceeding the performance of the best fixed model in diverse domains.`,
    thread: 'The research thread',
    panels: [
      { t: 'Potential gain per input, by modality' },
      { t: 'Efficiency at near-zero quality loss', key: 'Price route, against the testbed’s reference' },
    ],
  },

  how: {
    eyebrow: 'How it works',
    h: ['One rule.', 'Every modality.'],
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
    eyebrow: 'Can a router beat the best fixed candidate?',
    h: ['The potential gain is large.'],
    lede: (
      <>
        On {n(HEADROOM_ALL.inputs)} test inputs from {HEADROOM_ALL.benchmarks} benchmarks, the best candidate per input beats the best fixed
        candidate per benchmark by <b>5.4 points</b>, from 0.7 for speech generation to 18–19 for video generation and robot manipulation. A
        lookup by capability type, even chosen in hindsight, closes only <b>8%</b> of the gap.
      </>
    ),
    fig: {
      t: 'Where the potential gain lies',
      sub: 'Share of the gap from the best fixed candidate to the per-input oracle that the best lookup recovers, chosen in hindsight.',
      cap: 'Inside a type, outcomes vary input by input. On GenEval2, per-prompt differences between generators have a standard deviation of 31–38 points against mean differences of 4–14.',
    },
  },

  recover: {
    eyebrow: 'How well do learned routers work?',
    h: ['Routers beat the best fixed candidate.', 'On robots, they read the scene.'],
    lede: (
      <>
        One router over {ROUTERS_ALL.benchmarks} benchmarks scores {ROUTERS_ALL.router}, against {ROUTERS_ALL.fixed} for the best fixed candidate:{' '}
        <b>{ROUTERS_ALL.diff.toFixed(1)} points</b> ahead, and <b>{video.diff.toFixed(1)}</b> on video generation. From three camera frames, a
        router sends clean scenes to PatchWAM and randomized ones to ME-Dex, and beats the best single policy by{' '}
        <b>
          {ROBOT.overall.diff.toFixed(1)} points with {pct(ROBOT.seconds.saving)} less policy time
        </b>
        .
      </>
    ),
    beat: {
      t: 'A learned router against the best fixed candidate',
      sub: 'Router score minus the fixed candidate’s, in points, by modality. Test inputs, one training seed.',
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
    eyebrow: 'When is a cheaper route good enough?',
    h: ['A cheaper route is', 'often good enough.'],
    lede: (
      <>
        Where candidates are close in quality and far apart in cost, routing raises efficiency over the reference by <b>{mean}</b> on average
        across four testbeds, including <b>25.5×</b> on code and <b>7.1×</b> on text QA. Fitted on half of the data, the zero-loss floor holds on
        test in only 12.5% of 200 splits; certified on the other half, in <b>all 200</b>.
      </>
    ),
    fig: {
      t: 'A floor that holds on new inputs',
      sub: 'The zero-loss floor on CodeRouterBench, refitted on 200 random halves of the probing tasks. One square per split, filled where the floor holds on test.',
      cap: `Always calling the cheapest model already reaches ${PRICE_FACTS.code.qwenAlways.eff}× at a ${PRICE_FACTS.code.qwenAlways.loss}-point loss; routing by state recovers that loss and adds ${pct(PRICE_FACTS.code.stateGain)} efficiency.`,
    },
    spend: {
      k: 'Spending more within a task',
      h: 'Richer candidates are worth their cost only if they beat what they replace.',
    },
    rows: [
      {
        k: 'Verifiers',
        note: 'Dollar efficiency of a Qwen3-Max cascade, verifier included.',
        us: { v: '4.09×', c: 'Free compiler gate' },
        them: { v: `${JUDGE.list.toFixed(2)}×`, c: 'LLM judge at list price' },
      },
      {
        k: 'Routing signals',
        note: 'Cost per task, against one Qwen3-Max call. A forecast can save at most the attempt it replaces.',
        us: { v: `${(FORECAST.tfidfCost * 100).toFixed(2)}%`, c: 'Prompt-only TF-IDF router' },
        them: { v: `${FORECAST.llmCostAttempts}×`, c: 'DeepSeek-v4-pro forecast at list price' },
      },
    ] as StatRow[],
  },

  trial: {
    eyebrow: 'Try it',
    h: ['Route your own inputs.', 'Request an API key.'],
    lede: (
      <>
        We are opening <b>a small number of API keys</b> to our 4B router. Tell us who you are and what you would route; we review every request
        and email a key to the ones we approve.
      </>
    ),
    steps: [
      { h: 'Apply', note: 'Your name, affiliation and what you plan to route. About two minutes.' },
      { h: 'We review', note: `We read every request and reply by email ${trial.reply}.` },
      { h: 'Get a key', note: 'A personal key with its quota and validity, and how to call the router.' },
    ],
    cta: 'Request an API key',
    fine: 'Keys are limited and for research and evaluation. Quotas and validity will be announced.',
    form: {
      k: 'Route Anything · API trial',
      title: 'Request an API key',
      sub: 'For our 4B router. We read every request.',
      emailHint: 'We send the key here. Work email preferred.',
      linkHint: 'Helps us review your request sooner.',
      useHint: 'The tasks, and the models or policies you would route between.',
      usePlaceholder: 'For example: routing coding questions between three open models and one API model, to cut cost at the same pass rate.',
      agree: 'I have read and agree to the trial terms.',
      privacy: 'We use these details only to review your request and to contact you about it.',
      doneTitle: 'Request sent',
      doneNote: 'Our reply comes from an @infrec.tech address. If it doesn’t arrive, check your spam folder.',
    },
    /** the terms an applicant agrees to; each key's details are set in its approval email */
    terms: {
      title: 'Trial terms',
      date: `Last updated ${trial.termsDate}.`,
      items: [
        {
          k: 'Review',
          t: 'We read every request by hand. Whether to grant a key, and its quota and validity, are up to us; the details of each key are in its approval email. We may ask for more information or decline without giving a reason.',
        },
        { k: 'Use', t: 'Keys are for research and evaluation, including non-commercial prototypes. Commercial or production use needs our written agreement.' },
        {
          k: 'Your key',
          t: 'A key is for you alone: don’t share, publish or commit it. If it leaks, tell us and we will replace it. We can limit, suspend or revoke a key at any time, for example after misuse or when the trial ends.',
        },
        {
          k: 'Not allowed',
          t: 'Using the API to break the law or infringe others’ rights, to produce harmful content, to probe or overload the service, or to copy the router, for example by training a model on its choices.',
        },
        { k: 'What you send', t: 'We may log calls to the API, including what you send, to run the trial, enforce quotas and improve the router. Don’t send personal or confidential data.' },
        { k: 'No guarantees', t: 'The trial is provided as is. It may be slow or unavailable, and it may change or end at any time.' },
        { k: 'This form', t: 'We use these details only to review your request and to contact you about the trial. The form reaches us by email through Web3Forms.' },
        { k: 'Changes', t: 'We may update these terms. The version you agreed to is sent with your request.' },
        { k: 'Credit', t: 'If you publish work that uses the router, please cite the paper.' },
      ],
    },
  },

  paper: {
    eyebrow: 'Preprint · November 2026',
    foot: 'Figures are redrawn from the paper’s tables and figures; the four small drawings under How it works illustrate the statements with made-up numbers. The omni-modal matrix itself is not released.',
  },
};
