// Numbers transcribed from the paper (Route Anything: A Study of Model and Policy Routing for General-Purpose
// AI Systems, arXiv 2611.05275v1). Each block names its source. Tables 1–5 are in the body (1 potential gain,
// 2 panels), 6–9 in Appendix B (the matrix), 10–15 in Appendix C (code and text). "Headroom" in the names below
// is the paper's "potential gain".

/* ================================================================== */
/* The omni-modal matrix (§3, Appendix B)                             */
/* ================================================================== */

export const MATRIX = {
  benchmarks: 25,
  groups: 7,
  runs: 374401,
  tasks: 103307,
  armVersions: 452,
  testInputs: 19814,
  /** the release (App. B.2): decisions split 70/10/20 by source group */
  decisions: 104050,
  split: { train: 72351, dev: 10630, test: 21069 },
};

export type PoolKey = 'lm' | 'image' | 'video' | 'speech' | 'robot';
export type GroupKey = 'text' | 'imgqa' | 'imggen' | 'video' | 'speech' | 'agents' | 'robot';

export interface PoolSpec {
  key: PoolKey;
  label: string;
  short: string;
  candidates: string[];
  /** pool size as the paper's Figure 1 states it */
  size: string;
  note?: string;
}

/** §3 and App. B.1: the candidate pools */
export const POOLS: PoolSpec[] = [
  {
    key: 'lm',
    label: 'Language models',
    short: 'Language', size: '3–4',
    candidates: ['Claude Opus 5.5', 'GPT-6.1 Sol', 'DeepSeek V4.1 Flash', 'GPT-6 Astra'],
    note: 'GPT-6 Astra joins for long-context, knowledge and agent tasks',
  },
  { key: 'image', label: 'Image generators', short: 'Image', size: '6', candidates: ['FLUX 3', 'Seedream 5.0 Pro', 'MAI-Image 2.6', 'GPT Image 2.5', 'Qwen-Image 3 Pro', 'Grok Imagine 2.0'] },
  { key: 'video', label: 'Video generators', short: 'Video', size: '3', candidates: ['MiniMax H3', 'Seedance 2.5', 'Wan 3.0'] },
  { key: 'speech', label: 'Speech generators', short: 'Speech', size: '3', candidates: ['Seed Audio 1.0', 'Fish S2.1 Pro', 'Gemini 3.8 Flash TTS'] },
  {
    key: 'robot',
    label: 'Robot policies',
    short: 'Robot', size: '7',
    candidates: ['π0.5', 'GigaBrain', 'Spatial Forcing', 'X-VLA', 'X-WAM', 'PatchWAM', 'ME-Dex'],
    note: 'vision-language-action policies, co-trained on the 50 RoboTwin tasks',
  },
];

export interface GroupSpec {
  key: GroupKey;
  label: string;
  short: string;
  /** what the router reads (the paper's Fig. 1a) */
  input: string;
  pool: PoolKey;
  benchmarks: string[];
}

/** §3: the 25 benchmarks in seven groups */
export const GROUPS: GroupSpec[] = [
  { key: 'text', label: 'Text QA', short: 'Text QA', input: 'Question', pool: 'lm', benchmarks: ['MMLU-Pro', 'MMLU-Redux', 'SuperGPQA', 'GPQA', 'AA-LCR', 'AA-Omniscience', 'HLE (text)'] },
  { key: 'imgqa', label: 'Image-text QA', short: 'Image-text QA', input: 'Image + question', pool: 'lm', benchmarks: ['MMMU-Pro', 'MMMU', 'VLM-ExecRouterBench'] },
  { key: 'imggen', label: 'Image generation', short: 'Image gen.', input: 'Generation prompt', pool: 'image', benchmarks: ['GenEval2', 'Qwen-Image-Bench', 'LongT2I', 'OneIG', 'WISE'] },
  { key: 'video', label: 'Video generation', short: 'Video gen.', input: 'Generation prompt', pool: 'video', benchmarks: ['VBench-2.0'] },
  { key: 'speech', label: 'Speech generation', short: 'Speech gen.', input: 'Generation prompt', pool: 'speech', benchmarks: ['Seed-TTS (en)', 'Seed-TTS (zh)'] },
  { key: 'agents', label: 'Code and workplace agents', short: 'Agents', input: 'Task + files', pool: 'lm', benchmarks: ['AA-Briefcase', 'AutomationBench', 'GDP.pdf', 'GDPval', 'SciCode', 'Terminal-Bench'] },
  { key: 'robot', label: 'Robot manipulation', short: 'Robots', input: 'Cameras + state', pool: 'robot', benchmarks: ['RoboTwin 2.0'] },
];

export const groupLabel = (k: GroupKey) => GROUPS.find((g) => g.key === k)!.label;

/** Table 2: evaluation panels. Fixed and oracle are comparable only within a row. */
export const PANELS = [
  { study: 'Headroom', where: '§3', policies: 'fixed candidate, hindsight lookups', benchmarks: 24, inputs: 19814, seeds: null, fixed: 82.6, oracle: 87.98 },
  { study: 'Rule-based tree', where: '§3, §4.1', policies: 'rule-based type router', benchmarks: 18, inputs: 5034, seeds: null, fixed: 77.03, oracle: 87.44 },
  { study: 'One router', where: '§4.1', policies: 'capability-tree and untrained routers', benchmarks: 16, inputs: 3444, seeds: 1, fixed: 79.68, oracle: 84.8 },
  { study: 'Robots', where: '§4.2, §4.3', policies: 'outcome and winner-label routers', benchmarks: 1, inputs: 2000, seeds: 1, fixed: 70.45, oracle: 88.85 },
  { study: 'Targets', where: '§4.3, §4.4', policies: 'outcome and type routers', benchmarks: 11, inputs: 1302, seeds: 4, fixed: 68.3, oracle: 75.84 },
  { study: 'Winner labels', where: '§4.3', policies: '12 winner-label recipes', benchmarks: 16, inputs: 3211, seeds: 1, fixed: 79.44, oracle: 85.77 },
] as const;

/* ------------------------------------------------------------------ */
/* Finding 1 · Table 1 and Table 6: per-input headroom on the test split */
/* ------------------------------------------------------------------ */

export interface HeadroomRow {
  group: GroupKey;
  benchmarks: number;
  candidates: string;
  inputs: number;
  fixed: number;
  /** best fixed candidate per benchmark, chosen on the test inputs themselves */
  hindsight: number;
  oracle: number;
  gap: number;
}

export const HEADROOM: HeadroomRow[] = [
  { group: 'text', benchmarks: 7, candidates: '3–4', inputs: 9482, fixed: 83.27, hindsight: 83.27, oracle: 87.56, gap: 4.28 },
  { group: 'imgqa', benchmarks: 3, candidates: '3', inputs: 5708, fixed: 85.32, hindsight: 85.32, oracle: 88.02, gap: 2.7 },
  { group: 'imggen', benchmarks: 5, candidates: '4–6', inputs: 1515, fixed: 82.93, hindsight: 82.99, oracle: 87.92, gap: 4.99 },
  { group: 'video', benchmarks: 1, candidates: '3', inputs: 158, fixed: 62.43, hindsight: 62.43, oracle: 81.36, gap: 18.93 },
  { group: 'speech', benchmarks: 2, candidates: '3', inputs: 608, fixed: 98.62, hindsight: 98.63, oracle: 99.3, gap: 0.68 },
  { group: 'agents', benchmarks: 5, candidates: '4', inputs: 343, fixed: 69.17, hindsight: 69.78, oracle: 77.29, gap: 8.11 },
  { group: 'robot', benchmarks: 1, candidates: '7', inputs: 2000, fixed: 70.45, hindsight: 70.45, oracle: 88.85, gap: 18.4 },
];

export const HEADROOM_ALL = { benchmarks: 24, inputs: 19814, fixed: 82.6, hindsight: 82.62, oracle: 87.98, gap: 5.38 };

export interface BenchHeadroom {
  bench: string;
  group: GroupKey;
  inputs: number;
  fixedArm: string;
  fixed: number;
  hindsight: number;
  /** named when the best fixed candidate in hindsight differs from the training choice */
  hindsightArm?: string;
  oracle: number;
  gap: number;
}

export const HEADROOM_BENCH: BenchHeadroom[] = [
  { bench: 'MMLU-Pro', group: 'text', inputs: 2403, fixedArm: 'Opus 5.5', fixed: 92.55, hindsight: 92.55, oracle: 95.21, gap: 2.66 },
  { bench: 'MMLU-Redux', group: 'text', inputs: 1080, fixedArm: 'Opus 5.5', fixed: 96.67, hindsight: 96.67, oracle: 98.06, gap: 1.39 },
  { bench: 'SuperGPQA', group: 'text', inputs: 5300, fixedArm: 'Opus 5.5', fixed: 78.26, hindsight: 78.26, oracle: 83.66, gap: 5.4 },
  { bench: 'GPQA (extended)', group: 'text', inputs: 106, fixedArm: 'Opus 5.5', fixed: 90.57, hindsight: 90.57, oracle: 92.45, gap: 1.89 },
  { bench: 'AA-LCR', group: 'text', inputs: 42, fixedArm: 'Opus 5.5', fixed: 97.62, hindsight: 97.62, oracle: 100, gap: 2.38 },
  { bench: 'AA-Omniscience', group: 'text', inputs: 120, fixedArm: 'Opus 5.5', fixed: 77.5, hindsight: 77.5, oracle: 85.83, gap: 8.33 },
  { bench: 'HLE (text)', group: 'text', inputs: 431, fixedArm: 'Opus 5.5', fixed: 58.0, hindsight: 58.0, oracle: 64.5, gap: 6.5 },
  { bench: 'MMMU-Pro', group: 'imgqa', inputs: 350, fixedArm: 'Opus 5.5', fixed: 86.86, hindsight: 86.86, oracle: 92.86, gap: 6.0 },
  { bench: 'MMMU (dev/val)', group: 'imgqa', inputs: 94, fixedArm: 'Opus 5.5', fixed: 81.91, hindsight: 81.91, oracle: 84.04, gap: 2.13 },
  { bench: 'VLM-ExecRouterBench', group: 'imgqa', inputs: 5264, fixedArm: 'Opus 5.5', fixed: 85.28, hindsight: 85.28, oracle: 87.77, gap: 2.49 },
  { bench: 'GenEval2', group: 'imggen', inputs: 160, fixedArm: 'GPT Image 2.5', fixed: 82.48, hindsight: 82.48, oracle: 96.18, gap: 13.69 },
  { bench: 'Qwen-Image-Bench', group: 'imggen', inputs: 193, fixedArm: 'GPT Image 2.5', fixed: 64.09, hindsight: 64.09, oracle: 69.83, gap: 5.73 },
  { bench: 'LongT2I', group: 'imggen', inputs: 543, fixedArm: 'MAI-Image 2.6', fixed: 86.14, hindsight: 86.14, oracle: 86.89, gap: 0.75 },
  { bench: 'OneIG', group: 'imggen', inputs: 427, fixedArm: 'FLUX 3', fixed: 83.35, hindsight: 83.35, oracle: 89.34, gap: 5.99 },
  { bench: 'WISE', group: 'imggen', inputs: 192, fixedArm: 'Qwen-Image 3', fixed: 92.19, hindsight: 92.71, hindsightArm: 'MAI-Image 2.6', oracle: 98.96, gap: 6.77 },
  { bench: 'VBench-2.0', group: 'video', inputs: 158, fixedArm: 'MiniMax H3', fixed: 62.43, hindsight: 62.43, oracle: 81.36, gap: 18.93 },
  { bench: 'Seed-TTS (en)', group: 'speech', inputs: 214, fixedArm: 'Fish S2.1', fixed: 98.41, hindsight: 98.43, hindsightArm: 'Gemini 3.8 TTS', oracle: 99.02, gap: 0.61 },
  { bench: 'Seed-TTS (zh)', group: 'speech', inputs: 394, fixedArm: 'Fish S2.1', fixed: 98.73, hindsight: 98.73, oracle: 99.45, gap: 0.72 },
  { bench: 'AA-Briefcase', group: 'agents', inputs: 1, fixedArm: 'Opus 5.5', fixed: 66.67, hindsight: 75.0, hindsightArm: 'GPT-6.1 Sol', oracle: 75.0, gap: 8.33 },
  { bench: 'AutomationBench', group: 'agents', inputs: 160, fixedArm: 'Opus 5.5', fixed: 92.75, hindsight: 92.75, oracle: 96.53, gap: 3.78 },
  { bench: 'GDP.pdf', group: 'agents', inputs: 100, fixedArm: 'GPT-6.1 Sol', fixed: 21.0, hindsight: 23.0, hindsightArm: 'GPT-6 Astra', oracle: 36.0, gap: 15.0 },
  { bench: 'GDPval', group: 'agents', inputs: 43, fixedArm: 'Opus 5.5', fixed: 91.18, hindsight: 91.18, oracle: 92.79, gap: 1.61 },
  { bench: 'Terminal-Bench', group: 'agents', inputs: 39, fixedArm: 'Opus 5.5', fixed: 71.79, hindsight: 71.79, oracle: 87.18, gap: 15.38 },
  { bench: 'RoboTwin 2.0', group: 'robot', inputs: 2000, fixedArm: 'ME-Dex', fixed: 70.45, hindsight: 70.45, oracle: 88.85, gap: 18.4 },
];

/** Finding 1 and Proposition 3: the rungs the paper measures, each within one panel */
export const LADDER = {
  all: { benchmarks: 24, inputs: 19814, fixed: 82.6, perBenchmark: 82.62, oracle: 87.98 },
  /** rule-based capability tree: 107 leaves over 18 benchmarks */
  typed: { benchmarks: 18, inputs: 5034, leaves: 107, fixed: 77.03, perLeaf: 77.89, oracle: 87.44, betweenTypesShare: 0.08 },
  /** best policy per task and scene condition, chosen on the test scenes */
  robot: { inputs: 2000, fixed: 70.45, router: 71.55, conditionChoice: 72.1, perTaskCondition: { shareOfGap: 0.23 }, oracle: 88.85 },
  /** released CodeRouterBench routers as signals (Table 16) */
  code: { typeUnknown: 0.55, withinType: [0.06, 0.08] as [number, number] },
  geneval: { winsOn: [76, 100] as [number, number], sd: [31, 38] as [number, number], meanDiff: [4, 14] as [number, number] },
  aaLcr: { runs: 3, margin: 2.4 },
  unstudied: { benchmarks: 7, inputShare: 0.75, gapShare: 0.5, gapRange: [1.4, 6.0] as [number, number] },
};

/* ------------------------------------------------------------------ */
/* Finding 2 · Table 3 and Table 7: learned routers                     */
/* ------------------------------------------------------------------ */

export interface RouterRow {
  key: string;
  label: string;
  group?: GroupKey;
  benchmarks: number;
  inputs: number;
  fixed: number;
  router: number;
  oracle: number;
  diff: number;
  /** router's gain over the fixed candidate divided by the oracle's */
  share: number;
  ci?: [number, number];
}

export const ROUTERS: RouterRow[] = [
  { key: 'text', label: 'Text QA', group: 'text', benchmarks: 3, inputs: 588, fixed: 65.14, router: 64.97, oracle: 71.43, diff: -0.17, share: -0.03 },
  { key: 'agents', label: 'Code and workplace agents', group: 'agents', benchmarks: 5, inputs: 519, fixed: 69.24, router: 70.01, oracle: 74.78, diff: 0.77, share: 0.14 },
  { key: 'imggen', label: 'Image generation', group: 'imggen', benchmarks: 5, inputs: 1559, fixed: 82.96, router: 83.21, oracle: 87.92, diff: 0.25, share: 0.05 },
  { key: 'video', label: 'Video generation', group: 'video', benchmarks: 1, inputs: 161, fixed: 62.17, router: 64.28, oracle: 80.22, diff: 2.12, share: 0.12 },
  { key: 'speech', label: 'Speech generation', group: 'speech', benchmarks: 2, inputs: 617, fixed: 98.63, router: 98.63, oracle: 99.3, diff: 0, share: 0 },
];

export const ROUTERS_ALL: RouterRow = { key: 'all', label: 'All 16 benchmarks', benchmarks: 16, inputs: 3444, fixed: 79.68, router: 79.98, oracle: 84.8, diff: 0.3, share: 0.06 };

export const ROUTER_ROBOT: RouterRow = {
  key: 'robot',
  label: 'Robot manipulation (outcome router)',
  group: 'robot',
  benchmarks: 1,
  inputs: 2000,
  fixed: 70.45,
  router: 71.55,
  oracle: 88.85,
  diff: 1.1,
  share: 0.06,
  ci: [-0.4, 2.55],
};

export const ROUTERS_BENCH = [
  { bench: 'AA-LCR', group: 'text', inputs: 42, fixedArm: 'Opus 5.5', fixed: 97.62, router: 95.24, oracle: 100 },
  { bench: 'AA-Omniscience', group: 'text', inputs: 120, fixedArm: 'Opus 5.5', fixed: 77.5, router: 77.5, oracle: 85.83 },
  { bench: 'HLE (text)', group: 'text', inputs: 426, fixedArm: 'Opus 5.5', fixed: 58.45, router: 58.45, oracle: 64.55 },
  { bench: 'SciCode', group: 'agents', inputs: 187, fixedArm: 'Opus 5.5', fixed: 70.05, router: 70.05, oracle: 70.59 },
  { bench: 'Terminal-Bench', group: 'agents', inputs: 36, fixedArm: 'Opus 5.5', fixed: 69.44, router: 77.78, oracle: 86.11 },
  { bench: 'AutomationBench', group: 'agents', inputs: 160, fixedArm: 'Opus 5.5', fixed: 92.75, router: 92.75, oracle: 96.53 },
  { bench: 'GDP.pdf', group: 'agents', inputs: 99, fixedArm: 'GPT-6.1 Sol', fixed: 21.21, router: 22.22, oracle: 36.36 },
  { bench: 'GDPval', group: 'agents', inputs: 37, fixedArm: 'Opus 5.5', fixed: 91.84, router: 91.84, oracle: 93.62 },
  { bench: 'GenEval2', group: 'imggen', inputs: 162, fixedArm: 'GPT Image 2.5', fixed: 82.66, router: 82.66, oracle: 96.18 },
  { bench: 'Qwen-Image-Bench', group: 'imggen', inputs: 197, fixedArm: 'GPT Image 2.5', fixed: 64.25, router: 64.25, oracle: 69.93 },
  { bench: 'LongT2I', group: 'imggen', inputs: 552, fixedArm: 'MAI-Image 2.6', fixed: 86.13, router: 86.12, oracle: 86.89 },
  { bench: 'OneIG', group: 'imggen', inputs: 450, fixedArm: 'FLUX 3', fixed: 83.2, router: 84.3, oracle: 89.2 },
  { bench: 'WISE', group: 'imggen', inputs: 198, fixedArm: 'Qwen-Image 3', fixed: 92.42, router: 91.92, oracle: 98.99 },
  { bench: 'VBench-2.0', group: 'video', inputs: 161, fixedArm: 'MiniMax H3', fixed: 62.17, router: 64.28, oracle: 80.22 },
  { bench: 'Seed-TTS (en)', group: 'speech', inputs: 216, fixedArm: 'Fish S2.1', fixed: 98.42, router: 98.42, oracle: 99.02 },
  { bench: 'Seed-TTS (zh)', group: 'speech', inputs: 401, fixedArm: 'Fish S2.1', fixed: 98.74, router: 98.74, oracle: 99.45 },
] as { bench: string; group: GroupKey; inputs: number; fixedArm: string; fixed: number; router: number; oracle: number }[];

/** §4.1, Finding 2 */
export const ONE_ROUTER = {
  leaves: 157,
  trainBenchmarks: 18,
  classifierAcc: [86, 89] as [number, number],
  toFixed: [83, 86] as [number, number],
  matchedWithin001: 10,
  departures: [
    { bench: 'Terminal-Bench', d: 8.3, inputs: 36 },
    { bench: 'VBench-2.0', d: 2.1 },
    { bench: 'OneIG', d: 1.1 },
    { bench: 'GDP.pdf', d: 1.0 },
    { bench: 'AA-LCR', d: -2.4 },
  ],
  ruleTree: { leaves: 107, diff: 0.09, ci: [-0.01, 0.18] as [number, number] },
  imageSuite: { designs: 31, configs: 124, significantlyWorse: 44 },
  untrained: { diff: -1.15, ci: [-1.92, -0.4] as [number, number] },
};

/* ------------------------------------------------------------------ */
/* Finding 3 · Fig. 4: robot routing by scene condition                */
/* ------------------------------------------------------------------ */

export const ROBOT = {
  scenes: 2000,
  unseenTasks: 10,
  trainOutcomes: 49000,
  policies: 7,
  frames: '3 × 240×320',
  conditions: [
    { key: 'clean', label: 'Clean', scenes: 1000, meDex: 78.4, patchWam: 81.7, router: 81.6, oracle: 93.3, sentTo: [{ candidate: 'PatchWAM', n: 929 }] },
    {
      key: 'randomized',
      label: 'Randomized',
      scenes: 1000,
      meDex: 62.5,
      patchWam: 45.6,
      router: 61.5,
      oracle: 84.4,
      sentTo: [
        { candidate: 'ME-Dex', n: 842 },
        { candidate: 'GigaBrain', n: 141 },
      ],
    },
  ],
  overall: { router: 71.55, fixed: 70.45, diff: 1.1, ci: [-0.4, 2.55] as [number, number], oracle: 88.85, patchWam: 63.65 },
  seconds: { router: 11.05, patchWam: 11.1, meDex: 14.51, saving: 0.24, successPerSecond: 1.33 },
  /** the condition-level choice alone */
  conditionChoice: 72.1,
};

/* ------------------------------------------------------------------ */
/* Finding 4 · Table 4 and Table 8: training targets                   */
/* ------------------------------------------------------------------ */

export const OBJECTIVES = {
  eleven: {
    benchmarks: 11,
    inputs: 1302,
    seeds: 4,
    rows: [
      { key: 'fixed', label: 'Matched fixed candidate', score: 68.3 },
      { key: 'outcome', label: 'Outcome router', score: 67.9, diff: -0.4, ci: [-1.19, 0.33] as [number, number] },
      { key: 'type', label: '68-type classifier + table', score: 66.98, diff: -1.32, ci: [-3.05, 0.34] as [number, number] },
      { key: 'oracle', label: 'Oracle', score: 75.84, diff: 7.55 },
      { key: 'full', label: 'Fixed candidate requiring full coverage', score: 65.52, diff: -2.78 },
    ],
  },
  sixteen: {
    benchmarks: 16,
    inputs: 3211,
    rows: [
      { key: 'fixed', label: 'Fixed candidate (best training mean)', score: 79.44 },
      { key: 'winner', label: 'Winner-label router (generative)', score: 78.87, diff: -0.58 },
      { key: 'oracle', label: 'Oracle', score: 85.77, diff: 6.33 },
    ],
  },
  robot: {
    inputs: 2000,
    rows: [
      { key: 'outcome', label: 'Outcome router (per-policy success)', score: 71.55, diff: 1.1, ci: [-0.4, 2.55] as [number, number] },
      { key: 'winner', label: 'Winner-label classifier', score: 42.8, diff: -27.65 },
    ],
  },
  /** why the robot winner labels fail */
  labels: { tieBreakShare: 0.94, wrongClass: 24556, successful: 31408, fastPolicySeconds: 1.9 },
  winnerLabels16: { labels: 11273, uniqueShare: 1 / 3, recipes: 12 },
  typeRouter: { types: 68, accuracy: 0.75, sameArm: 0.93 },
};

/* ------------------------------------------------------------------ */
/* Finding 5 · §4.4: matched comparisons                               */
/* ------------------------------------------------------------------ */

export const MATCHED = {
  hleMissing: { missed: 11, of: 1122 },
  benchmarksWithMissing: 7,
  examples: [
    { bench: 'HLE (text)', matched: 58.24, fullCoverage: 52.9 },
    { bench: 'AA-Omniscience', matched: 77.5, fullCoverage: 70.0 },
  ],
  pooled: { matched: 68.3, fullCoverage: 65.52, router: 67.9, vsMatched: -0.4, vsFull: 2.38 },
  fallbackArm: 'GPT-6 Astra',
};

/* ------------------------------------------------------------------ */
/* Finding 6 · Table 5 and Table 9: price routes                       */
/* ------------------------------------------------------------------ */

export interface PriceRouteRow {
  key: string;
  group: 'code' | 'text' | 'image' | 'robot';
  testbed: string;
  resource: '$' | 's';
  reference: string;
  route: string;
  kind: 'fitted' | 'certified' | 'router';
  /** test-set quality change in points, with paired 95% interval */
  dv: number | null;
  ci?: [number, number];
  /** for certified routes: how often the floor held */
  held?: string;
  eff: number;
}

export const PRICE_ROUTES: PriceRouteRow[] = [
  { key: 'code-fit', group: 'code', testbed: 'Code · CodeRouterBench', resource: '$', reference: 'Always Opus 4.6', route: 'Fitted, ε = 0', kind: 'fitted', dv: -0.44, ci: [-1.75, 0.97], eff: 25.5 },
  { key: 'code-cert', group: 'code', testbed: 'Code · CodeRouterBench', resource: '$', reference: 'Always Opus 4.6', route: 'Certified, ε = 0', kind: 'certified', dv: null, held: '≥ 0 in 200 of 200', eff: 19.4 },
  { key: 'text-fit', group: 'text', testbed: 'Text QA · RouterBench', resource: '$', reference: 'Always GPT-4', route: 'Fitted, ε = 0', kind: 'fitted', dv: -0.4, ci: [-0.84, 0.08], eff: 7.1 },
  { key: 'text-cert', group: 'text', testbed: 'Text QA · RouterBench', resource: '$', reference: 'Always GPT-4', route: 'Certified, ε = 0', kind: 'certified', dv: null, held: '≥ 0 in 200 of 200', eff: 6.7 },
  { key: 'img-05', group: 'image', testbed: 'Image generation', resource: '$', reference: 'Fixed generator', route: 'Fitted, ε = 0.5', kind: 'fitted', dv: -0.47, ci: [-0.87, -0.06], eff: 1.35 },
  { key: 'img-2', group: 'image', testbed: 'Image generation', resource: '$', reference: 'Fixed generator', route: 'Fitted, ε = 2', kind: 'fitted', dv: -1.56, ci: [-2.39, -0.73], eff: 2.03 },
  { key: 'robot', group: 'robot', testbed: 'Robot manipulation', resource: 's', reference: 'Fixed policy', route: 'Outcome router', kind: 'router', dv: 1.1, ci: [-0.4, 2.55], eff: 1.33 },
];

/** Finding 6: the four near-zero-loss routes (images at ε = 0.5) and their mean efficiency, the paper's 8.82× */
export const NEAR_ZERO_KEYS = ['code-fit', 'text-fit', 'img-05', 'robot'] as const;
export const NEAR_ZERO_MEAN = NEAR_ZERO_KEYS.reduce((a, k) => a + PRICE_ROUTES.find((r) => r.key === k)!.eff, 0) / NEAR_ZERO_KEYS.length;

/** Table 9: the half-point image route, test quality (0–100) and m$ per image */
export const IMAGE_ROUTE = [
  { bench: 'GenEval2', prompts: 160, fixed: { candidate: 'GPT Image 2.5', q: 82.48, m: 208.8 }, route: { candidate: 'GPT Image 2.5', q: 82.48, m: 208.8 } },
  { bench: 'Qwen-Image-Bench', prompts: 193, fixed: { candidate: 'GPT Image 2.5', q: 64.09, m: 211.1 }, route: { candidate: 'Grok Imagine 2.0', q: 61.16, m: 60.0 } },
  { bench: 'LongT2I', prompts: 543, fixed: { candidate: 'MAI-Image 2.6', q: 86.14, m: 39.4 }, route: { candidate: 'MAI-Image 2.6', q: 86.14, m: 39.4 } },
  { bench: 'OneIG', prompts: 427, fixed: { candidate: 'FLUX 3', q: 83.35, m: 48.0 }, route: { candidate: 'Qwen-Image 3', q: 83.02, m: 40.0 } },
  { bench: 'WISE', prompts: 192, fixed: { candidate: 'Qwen-Image 3', q: 92.19, m: 40.0 }, route: { candidate: 'Qwen-Image 3', q: 92.19, m: 40.0 } },
];

/** §5.1, Finding 6 */
export const PRICE_FACTS = {
  code: {
    lambdaB: 100,
    lambdaBRel: 2.9,
    floorPrice: 144,
    etaStar: 1022,
    alwaysOpus: { score: 0.4383, mUsd: 11.655 },
    qwenAlways: { eff: 20.1, loss: 4.2 },
    stateGain: 0.27,
    predictedCells: 25.3,
    learned: [22.7, 24.2] as [number, number],
    opusShareWithoutStates: 0.287,
  },
  text: { refFreeGap: 9.7, eff: 7.1 },
  floor: { fittedHeld: 0.125, splits: 200, certifiedMedian: 19.4 },
  image: { gptImageUsd: 0.21, priceRatio: [3.5, 5.4] as [number, number], bestOn: 2, of: 5, costCut: 0.26, loss: 0.47 },
  overhead: { routerSeconds: 0.13, gpu: 'H20', imageSeconds: [27, 158] as [number, number], videoSeconds: [211, 314] as [number, number] },
};

/* ================================================================== */
/* Code and text testbeds (§5, Appendix C)                             */
/* ================================================================== */

export const SETUP = {
  coderouterbench: {
    name: 'CodeRouterBench',
    models: 8,
    tasks: 9999,
    probing: 7080,
    test: 2919,
    dims: 9,
    cells: 21,
    candidates: 22,
    reference: 'claude-opus-4-6',
    refScore: 0.4383,
    refCost: 11.655, // m$ per task
    etaB: 34.7, // score per dollar (approx.)
  },
  routerbench: {
    name: 'RouterBench',
    models: 11,
    prompts: 36497,
    heldOut: 10955,
    reference: 'gpt-4-1106-preview',
    refScore: 0.781,
    refCost: 3.29,
  },
};

export const CRB_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'gpt-5.4', 'Qwen3-Max', 'Kimi-K2.5', 'Qwen3.5-Plus', 'glm-5', 'MiniMax-M2.7'];

/* ------------------------------------------------------------------ */
/* Table 10 (and Table 11 for the rows without oracle cell labels)     */
/* ------------------------------------------------------------------ */

export type PolicyGroup = 'ours' | 'inferred' | 'baseline' | 'oracle' | 'reference';

export interface PolicyRow {
  label: string;
  /** eta / eta_B with paired 95% CI */
  eff: [number, number, number];
  /** m$ per task */
  cost: number;
  /** mean score change vs always-Opus, with CI */
  dv: [number, number, number];
  group: PolicyGroup;
  note?: string;
}

export const POLICIES: PolicyRow[] = [
  { label: '21 cells, unconstrained', eff: [28.187, 26.84, 29.659], cost: 0.395, dv: [-0.0201, -0.0343, -0.0056], group: 'ours' },
  { label: '21 cells, ε = 0', eff: [25.516, 24.278, 26.903], cost: 0.452, dv: [-0.0044, -0.0175, 0.0097], group: 'ours', note: 'zero-loss floor' },
  { label: '21 cells, ε = 0.01', eff: [27.612, 26.311, 29.072], cost: 0.409, dv: [-0.014, -0.0272, -0.0004], group: 'ours' },
  { label: 'Predicted 21 cells, ε = 0', eff: [25.32, 24.07, 26.63], cost: 0.453, dv: [-0.007, -0.0203, 0.0058], group: 'inferred', note: 'cells predicted from the prompt (Table 11)' },
  { label: 'Quality-cost router', eff: [24.17, 22.83, 25.49], cost: 0.482, dv: [-0.0003, -0.014, 0.0125], group: 'inferred', note: 'direct quality–cost router at its probing zero-loss point (Table 11)' },
  { label: 'Fixed Qwen3-Max dispatch', eff: [20.097, 18.965, 21.297], cost: 0.525, dv: [-0.0416, -0.0549, -0.0275], group: 'baseline' },
  { label: 'Best fixed cascade', eff: [2.004, 1.881, 2.14], cost: 6.556, dv: [0.0558, 0.0461, 0.066], group: 'baseline' },
  { label: 'ACRouter released map', eff: [1.745, 1.666, 1.826], cost: 7.643, dv: [0.0631, 0.0528, 0.0731], group: 'baseline' },
  { label: 'Per-task oracle', eff: [33.51, 32.065, 35.206], cost: 0.368, dv: [0.0248, 0.0117, 0.0376], group: 'oracle', note: 'in-sample ceiling' },
  { label: 'Always-Opus', eff: [1, 1, 1], cost: 11.655, dv: [0, 0, 0], group: 'reference' },
];

/** Table 10: the coarser 9-dimension partition */
export const NINE_DIMS: Record<string, PolicyRow> = {
  '21 cells, unconstrained': { label: '9 dims, unconstrained', eff: [28.024, 26.713, 29.452], cost: 0.398, dv: [-0.0192, -0.0332, -0.0047], group: 'ours' },
  '21 cells, ε = 0': { label: '9 dims, ε = 0', eff: [22.733, 21.584, 23.954], cost: 0.502, dv: [-0.009, -0.0227, 0.006], group: 'ours' },
};

/** Finding 6 and App. C.2: prices on the 21 probing cells (score per dollar, and in units of eta_B) */
export const PRICES = {
  crb: { lambdaB: 100, lambdaBRel: 2.9, lambdaEps: 144, lambdaEpsRel: 4.16, etaStar: 1022, etaStarRel: 29.4, kappa: 5.43, etaStarEps: 927.7 },
  rb: { lambdaBRel: 5.85, lambdaEpsRel: 1.6, deltaFree: -0.097, zeroLoss: 7.1, certifiedMedian: 6.7 },
  /** hand-picked operating points (App. C.2) */
  handPicked: { atEtaB: 10.85, budgetOpus: 2.16 },
};

/* ------------------------------------------------------------------ */
/* Proposition 5 in the data: fitted vs certified floors (App. C.2)    */
/* ------------------------------------------------------------------ */

export const FLOOR_SPLITS = [
  { key: 'fitted', label: 'Fitted zero-loss floor', held: 25, of: 200, note: 'refitted on a random half of probing' },
  { key: 'certified', label: 'Certified floor (Prop. 5)', held: 200, of: 200, note: 'empirical-Bernstein p-values on the refined path, α = 0.05' },
] as const;

export const CERTIFICATION = {
  medianEff: 19.4,
  pathRouters: 38,
  pathBound: 442,
  negCellsMedian: 8,
  cells: 21,
  /** median efficiency of the certified router by p-value and selection rule */
  byMethod: [
    { label: 'Bonferroni · Hoeffding', eff: 13.29, ordered: false },
    { label: 'Fixed order · Hoeffding', eff: 15.17, ordered: true },
    { label: 'Bonferroni · emp.-Bernstein', eff: 15.17, ordered: false },
    { label: 'Fixed order · emp.-Bernstein', eff: 18.83, ordered: true },
    { label: 'Fixed order · EB, refined path', eff: 19.38, ordered: true },
  ],
  nestedResplits: { held: 199, of: 200, median: 20.56 },
  costPerTask: { certification: 0.0158, opusAlone: 0.0124 },
};

/* ------------------------------------------------------------------ */
/* Finding 5 · Table 13: best-candidate selection                      */
/* ------------------------------------------------------------------ */

export interface SelectionRow {
  setting: string;
  bench: 'CodeRouterBench' | 'RouterBench';
  theta: string;
  splits: number;
  count: number;
  paired: number;
  residual: number;
  indep: number;
  saving: number;
  marginal: number;
}

export const SELECTION: SelectionRow[] = [
  { setting: 'CodeRouterBench, θ = 1', bench: 'CodeRouterBench', theta: '1', splits: 1, count: 139, paired: 97.1, residual: 86.3, indep: 86.3, saving: 95.7, marginal: 46.8 },
  { setting: 'CodeRouterBench, θ = 0.5', bench: 'CodeRouterBench', theta: '0.5', splits: 1, count: 194, paired: 96.4, residual: 94.3, indep: 91.8, saving: 93.3, marginal: 40.7 },
  { setting: 'RouterBench, θ = 0.5', bench: 'RouterBench', theta: '0.5', splits: 10, count: 5539, paired: 63.9, residual: 61.9, indep: 35.9, saving: 63.5, marginal: 14.6 },
  { setting: 'RouterBench, θ = 1', bench: 'RouterBench', theta: '1', splits: 10, count: 212, paired: 64.6, residual: 53.8, indep: 36.3, saving: 48.1, marginal: 0.0 },
];

export const SELECTION_RULES = [
  { key: 'paired', label: 'Paired', desc: 'paired gain, Eq. (8): both portfolios on the same tasks' },
  { key: 'residual', label: 'Residual', desc: 'residual coverage N_m(S), Eq. (9): conditional means frozen' },
  { key: 'saving', label: 'Saving', desc: 'saving score r_m b − d_m' },
  { key: 'indep', label: 'Indep.', desc: 'residual coverage with independent failures' },
  { key: 'marginal', label: 'Marginal', desc: 'marginal success rate of the candidate' },
] as const;

export const PORTFOLIO_EXAMPLE = {
  add: 'Qwen3.5-Plus',
  to: 'pooled Qwen3-Max portfolio',
  predicted: -1.4,
  realized: 5.0,
  ci: [3.5, 6.6] as [number, number],
  fallbackCostDrop: 0.14,
  missValueLowered: 0.97,
  regret: { paired: '0.04–0.06%', marginal: '13–17%' },
};

/* ------------------------------------------------------------------ */
/* Finding 7 · retries (§5.2)                                          */
/* ------------------------------------------------------------------ */

export const CHAINS = {
  orderedPairs: 42,
  /** the second model's success after the first fails, as a share of its success otherwise (θ = 1) */
  medianRatio: 0.49,
};

/* ------------------------------------------------------------------ */
/* Finding 7 · verifiers (App. C.4, Table 14)                          */
/* ------------------------------------------------------------------ */

export interface VerifierRow {
  name: string;
  auroc: number;
  r05: [number, number, number];
  r1: [number, number, number];
  q05: number;
  note?: string;
}

export const VERIFIERS: VerifierRow[] = [
  { name: 'Compiler (static gate)', auroc: 0.766, r05: [4.09, 3.23, 5.45], r1: [4.09, 3.23, 5.45], q05: -0.024, note: 'compiles the answer with the harness, never runs it' },
  { name: 'Visible examples', auroc: 0.537, r05: [1.98, 1.72, 2.35], r1: [1.06, 1.03, 1.1], q05: -0.036 },
  { name: 'Hidden tests', auroc: 0.994, r05: [2.87, 2.38, 3.53], r1: [2.37, 2.03, 2.8], q05: 0.024, note: 'oracle-like control' },
  { name: 'LLM judge (proxy price)', auroc: 0.824, r05: [1.09, 1.0, 1.21], r1: [0.64, 0.61, 0.66], q05: -0.012, note: 'grok-4.6, charged at the primary’s token price' },
  { name: 'Released-score oracle', auroc: 1.0, r05: [2.46, 2.09, 2.93], r1: [2.46, 2.09, 2.93], q05: 0.045 },
];

export const JUDGE = {
  free: 2.63,
  proxy: 1.09,
  list: 0.3,
  breakEven: 0.0033,
  breakEvenCI: [0.00285, 0.00379] as [number, number],
  seconds: { opus: 3.93, qwen: 6.23, judgeCall: 39, cascadesRange: [0.4, 0.54] as [number, number], judgeRatio: 0.08 },
};

/* ------------------------------------------------------------------ */
/* Finding 7 · routing signals (App. C.5, Table 15)                    */
/* ------------------------------------------------------------------ */

export const SIGNALS = [
  { source: 'Fine-tuned Qwen 27B', native: 0.555, within: 0.062, family: 'fine-tuned' },
  { source: 'Fine-tuned Qwen 9B', native: 0.546, within: 0.078, family: 'fine-tuned' },
  { source: 'Fine-tuned Qwen 2B', native: 0.466, within: -0.006, family: 'fine-tuned' },
  { source: 'Fine-tuned Qwen 0.8B', native: 0.422, within: -0.008, family: 'fine-tuned' },
  { source: 'Logistic regression', native: -1.218, within: -0.002, family: 'classical' },
  { source: 'TF-IDF MLP', native: -1.736, within: -0.012, family: 'classical' },
  { source: 'RouteLLM MF', native: -1.033, within: -0.013, family: 'classical' },
  { source: 'RouteLLM SW', native: -1.284, within: 0.005, family: 'classical' },
  { source: 'DimensionBest', native: -1.468, within: 0, family: 'classical' },
] as const;

export const FORECAST = {
  tfidfCost: 0.0006, // share of a Qwen3-Max attempt
  llmCostAttempts: 2.4,
  statesAbove: 22,
  states: 24,
  calls: 1200,
  /** a/b for Qwen3-Max against Opus at theta = 1 */
  aOverB: 0.043,
};

/* ------------------------------------------------------------------ */
/* Finding 7 · router memory (App. C.6)                                */
/* ------------------------------------------------------------------ */

export const MEMORY = {
  storeEff: 135.8,
  belowOpus: 0.034,
  belowDimBest: 0.116,
  cells: 12,
  probing: 2044,
  test: 867,
  streams: 50,
  rounds: 60000,
  explore: 0.25,
  writerTprFpr: [0.96, 0.205] as [number, number],
};

/* ------------------------------------------------------------------ */
/* Overheads (App. C.4)                                                */
/* ------------------------------------------------------------------ */

export const OVERHEADS = [
  { what: 'TF-IDF router', time: '1.9 ms', share: 0.0006 },
  { what: 'Hidden-test sandbox run', time: '0.15 s', share: 0.02 },
  { what: 'DeepSeek-v4-pro forecast', time: '1.89 s', share: 2.4 },
  { what: 'grok-4.6 judge (list price)', time: '39.0 s', share: 63 },
];
