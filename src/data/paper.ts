// Paper metadata, from arXiv 2611.05275v1 (submitted 2026-11-03). `released` turns the Paper and arXiv
// buttons on; with it false they read "soon" and the bar's main button links to the code instead.

export const released = true;

export const paper = {
  title: 'Route Anything',
  subtitle: 'A Study of Model and Policy Routing for General-Purpose AI Systems',
  lab: 'InfRec · Cardinal AI Lab',
  date: 'November 2026',
  dateISO: '2026-11-03',
  question: 'How much can routing gain, how well do learned routers work, and when is a cheaper route good enough?',
  links: {
    pdf: 'https://arxiv.org/pdf/2611.05275',
    arxiv: 'https://arxiv.org/abs/2611.05275',
    /** the paper's Hugging Face page */
    hf: 'https://huggingface.co/papers/2611.05275',
    code: 'https://github.com/InfRec-Cardinal/route-anything',
    data: 'https://huggingface.co/datasets/Lance1573/route-anything-data',
  },
};

/** a link only once the paper is out */
export const live = (href: string) => (released ? href : '');

/** The research thread this paper belongs to (Pengfei Zhou's site). It is already public, so it links before release too. */
export const thread = {
  href: 'https://route-anything.vercel.app/',
  host: 'route-anything.vercel.app',
  label: 'Research thread',
  blurb: 'routing at every granularity, from agents and models down to single denoising steps',
};

export const authors = [
  { name: 'Pengfei Zhou', aff: [1, 2] },
  { name: 'Yixing Ma', aff: [2, 3] },
  { name: 'Hexin Wang', aff: [2], corresponding: true },
  { name: 'Weidong Tang', aff: [1] },
  { name: 'Zhenglin Wan', aff: [1] },
  { name: 'Wangbo Zhao', aff: [4] },
  { name: 'Yang You', aff: [1], corresponding: true },
];

export const affiliations = [
  'National University of Singapore, HPC-AI Lab',
  'InfRec, Cardinal AI Lab',
  'University of California, Berkeley',
  'Hong Kong University of Science and Technology',
];

/** the abstract as arXiv lists it */
export const abstract =
  'Artificial general intelligence (AGI) requires a method that can understand, generate, reason, and act across diverse domains and modalities. Rather than relying on a single model to master every capability, a promising path toward AGI now is to orchestrate a heterogeneous ecosystem of specialized models, tools, and policies (candidates) into a unified AI system. At the heart of this vision lies a fundamental question: how can an AI system dynamically select and coordinate the most capable candidate for each task while balancing performance and computational cost? In this work, we present Route Anything, a unified framework for studying model and policy routing across general-purpose AI systems. We develop a unified theoretical foundation that characterizes optimal routing under quality–cost trade-offs and establishes how the information available to a router determines its attainable performance. To systematically investigate routing across diverse capabilities, we first construct an omni-modal trajectory matrix spanning 25 benchmarks across language understanding, image, video, and speech generation, coding and workplace agents, and robotic manipulation, comprising 374,401 scored runs from 452 candidate configurations. Building on this framework, we train and test different routers to investigate the potential of omni-modal model routing, the capabilities of learned routers, and the conditions under which routing improves efficiency. Our results reveal substantial opportunities for capability orchestration: per-input oracle routing outperforms the best fixed candidate by 5.4 points, and learned routers outperform it by 0.3 points across 16 benchmarks, by 2.1 points on video generation, and by 1.1 points on robot manipulation while using 24% less policy time. More importantly, routing raises efficiency by 8.82× on average compared with the reference model.';

export const bibtex = `@misc{zhou2026routeanything,
  title         = {Route Anything: A Study of Model and Policy Routing for General-Purpose {AI} Systems},
  author        = {Zhou, Pengfei and Ma, Yixing and Wang, Hexin and Tang, Weidong and Wan, Zhenglin and Zhao, Wangbo and You, Yang},
  year          = {2026},
  eprint        = {2611.05275},
  archivePrefix = {arXiv},
  primaryClass  = {cs.CV},
  url           = {https://arxiv.org/abs/2611.05275}
}`;
