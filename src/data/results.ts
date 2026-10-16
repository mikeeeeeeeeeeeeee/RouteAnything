// Numbers transcribed from the paper (Route Anything, 2026-10-15 build). Each block names its source.

/* ------------------------------------------------------------------ */
/* Setup (§3)                                                          */
/* ------------------------------------------------------------------ */

export const SETUP = {
  coderouterbench: {
    name: 'CodeRouterBench',
    models: 8,
    tasks: 9999,
    probing: 7080,
    test: 2919,
    dims: 9,
    cells: 21,
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

export const CRB_MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'gpt-5.4',
  'Qwen3-Max',
  'Kimi-K2.5',
  'Qwen3.5-Plus',
  'glm-5',
  'MiniMax-M2.7',
];

/* ------------------------------------------------------------------ */
/* Finding 1 — Figure 3 / Table 3: policies on the 2,919-task test set */
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
  { label: 'Predicted 21 cells, ε = 0', eff: [25.324, 24.097, 26.65], cost: 0.453, dv: [-0.007, -0.02, 0.0067], group: 'inferred', note: 'cells predicted from the prompt' },
  { label: 'Quality-cost router', eff: [24.166, 22.861, 25.581], cost: 0.482, dv: [-0.0003, -0.0138, 0.0132], group: 'inferred', note: 'direct router in the style of Dekoninck et al.' },
  { label: 'Fixed Qwen3-Max dispatch', eff: [20.097, 18.965, 21.297], cost: 0.525, dv: [-0.0416, -0.0549, -0.0275], group: 'baseline' },
  { label: 'Best fixed cascade', eff: [2.004, 1.881, 2.14], cost: 6.556, dv: [0.0558, 0.0461, 0.066], group: 'baseline' },
  { label: 'ACRouter map', eff: [1.745, 1.666, 1.826], cost: 7.643, dv: [0.0631, 0.0528, 0.0731], group: 'baseline' },
  { label: 'Per-task oracle', eff: [33.51, 32.065, 35.206], cost: 0.368, dv: [0.0248, 0.0117, 0.0376], group: 'oracle', note: 'in-sample ceiling' },
  { label: 'Always-Opus', eff: [1, 1, 1], cost: 11.655, dv: [0, 0, 0], group: 'reference' },
];

/** Table 3 rows not in Figure 3: the 9-dimension partition and ε = 0.005 */
export const POLICIES_EXTRA: PolicyRow[] = [
  { label: '21 cells, ε = 0.005', eff: [27.071, 25.786, 28.538], cost: 0.422, dv: [-0.0083, -0.0212, 0.0056], group: 'ours' },
  { label: '9 dims, unconstrained', eff: [28.024, 26.713, 29.452], cost: 0.398, dv: [-0.0192, -0.0332, -0.0047], group: 'ours' },
  { label: '9 dims, ε = 0', eff: [22.733, 21.584, 23.954], cost: 0.502, dv: [-0.009, -0.0227, 0.006], group: 'ours' },
  { label: '9 dims, ε = 0.005', eff: [24.241, 23.042, 25.528], cost: 0.468, dv: [-0.0116, -0.0255, 0.0033], group: 'ours' },
  { label: '9 dims, ε = 0.01', eff: [25.984, 24.735, 27.349], cost: 0.434, dv: [-0.0141, -0.0279, 0.0004], group: 'ours' },
];

/** §4.1 Finding 1, prices on the 21 probing cells (score per dollar and in units of eta_B) */
export const PRICES = {
  crb: { lambdaB: 100, lambdaBRel: 2.9, lambdaEps: 144, lambdaEpsRel: 4.16, etaStar: 1022, etaStarRel: 29.4, deltaB: 0.056, opusCut: 0.31, kappa: 5.43, etaStarEps: 927.7 },
  rb: { lambdaBRel: 5.85, lambdaEpsRel: 1.6, deltaFree: -0.097, zeroLoss: 7.1, certifiedMedian: 6.7 },
  /** hand-picked operating points (Appendix B.2) */
  handPicked: { atEtaB: 10.85, budgetOpus: 2.16 },
};

/* ------------------------------------------------------------------ */
/* Finding 2 — fitted vs certified floors, 200 random halvings         */
/* ------------------------------------------------------------------ */

export const FLOOR_SPLITS = [
  { key: 'fitted', label: 'Fitted zero-loss floor', held: 25, of: 200, note: 'refitted on a random half of probing' },
  { key: 'rounded', label: 'Fitted floor, rounded down', held: 153, of: 200, note: 'last path router meeting the fitted floor' },
  { key: 'certified', label: 'Certified floor (Prop. 3)', held: 200, of: 200, note: 'empirical-Bernstein p-values, α = 0.05' },
] as const;

export const CERTIFICATION = {
  medianEff: 19.4,
  certifiedPriceRel: 4.2,
  pathRouters: 38,
  pathBound: 442,
  negCellsMedian: 8,
  cells: 21,
  cellwiseEff: 2.34,
  cellwiseDirectOnly: 1.99,
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
/* Finding 3 — Table 1: best-candidate selection                       */
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
  { key: 'paired', label: 'Paired', desc: 'normalized paired gain, Eq. (5): both portfolios on the same tasks' },
  { key: 'residual', label: 'Residual', desc: 'residual coverage N_m(S), Eq. (6): conditional means frozen' },
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
  cheapestFirst: { paired: 97.4, residual: 88.1, saving: 86.6 },
  regret: { paired: '0.04–0.06%', marginal: '13–17%' },
};

/* ------------------------------------------------------------------ */
/* Finding 4 — failures and retries                                    */
/* ------------------------------------------------------------------ */

export const CHAINS = {
  orderedPairs: 42,
  medianRatio: 0.49,
  decided: 57405,
  agreement: [
    { label: 'State-matched planning', value: 93.2, ours: true },
    { label: 'Shared-value rule', value: 88.5 },
    { label: 'Marginal planning', value: 77.2 },
    { label: 'Never attempting', value: 67.5 },
  ],
  shorterChains: { settings: 36, of: 105 },
  pairedFavor: { conditional: 27, marginal: 2 },
};

/** Table 6: online retries with disjoint feedback and scoring tests */
export const RETRIES = [
  { model: 'DeepSeek-flash', failures: 52, fresh: 0.263, feedback: 0.327, diff: [0.064, -0.05, 0.18] },
  { model: 'DeepSeek-v4-pro', failures: 34, fresh: 0.157, feedback: 0.363, diff: [0.206, 0.061, 0.365] },
  { model: 'Kimi-K2.5', failures: 35, fresh: 0.105, feedback: 0.219, diff: [0.114, -0.01, 0.241] },
  { model: 'Qwen3-Max', failures: 31, fresh: 0.032, feedback: 0.28, diff: [0.247, 0.102, 0.407] },
  { model: 'Qwen3.5-Plus', failures: 29, fresh: 0.069, feedback: 0.218, diff: [0.149, -0.021, 0.333] },
  { model: 'GLM-5', failures: 28, fresh: 0.071, feedback: 0.262, diff: [0.19, 0.051, 0.358] },
  { model: 'MiniMax-M2.7', failures: 54, fresh: 0.29, feedback: 0.383, diff: [0.093, -0.012, 0.194] },
] as const;

export const RETRY_POOLED = { failures: 263, tasks: 282, fresh: 0.165, feedback: 0.304, diff: [0.139, 0.058, 0.223] as [number, number, number] };

/* ------------------------------------------------------------------ */
/* Finding 5 — Table 7 / Figure 8: verifiers for Qwen3-Max             */
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
  seconds: { opus: 3.9, qwen: 6.2, judgeCall: 39, cascadesRange: [0.4, 0.54] as [number, number], judgeRatio: 0.08 },
  menu: { keepsOracle: 0.97, compilerOnly: 2.33 },
};

/* ------------------------------------------------------------------ */
/* Finding 6 — Table 9: released routers as signals                    */
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
  tfidfAuroc: { qwen: 0.895, kimi: 0.768 },
  llmCostAttempts: 2.4,
  statesAbove: 22,
  states: 24,
  calls: 1200,
  /** a/b for Qwen3-Max against Opus at theta = 1 */
  aOverB: 0.043,
};

/* ------------------------------------------------------------------ */
/* Finding 7 — Table 2: router memory against two priors               */
/* ------------------------------------------------------------------ */

export const MEMORY = {
  priors: [
    { prior: 'Always-Opus', predicted: 0.304, realized: [0.275, 0.272, 0.279] as [number, number, number] },
    { prior: 'DimensionBest', predicted: -0.148, realized: [-0.12, -0.126, -0.113] as [number, number, number] },
  ],
  storeEff: 135.8,
  belowOpus: 0.034,
  belowDimBest: 0.116,
  signAgreement: { right: 918, of: 969 },
  alwaysImprove: { right: 646, of: 969 },
  cells: 12,
  streams: 50,
  rounds: 60000,
  explore: 0.25,
  writerTprFpr: [0.96, 0.205] as [number, number],
};

/* ------------------------------------------------------------------ */
/* Overheads (Appendix B.6)                                            */
/* ------------------------------------------------------------------ */

export const OVERHEADS = [
  { what: 'TF-IDF router (16 ridge predictors)', time: '1.9 ms', share: 0.0006 },
  { what: 'Hidden-test sandbox run', time: '0.15 s', share: 0.02 },
  { what: 'DeepSeek-v4-pro forecast', time: '1.89 s', share: 2.4 },
  { what: 'grok-4.6 judge (list price)', time: '39.0 s', share: 63 },
];
