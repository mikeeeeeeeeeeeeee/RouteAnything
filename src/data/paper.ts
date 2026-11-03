// Paper metadata, from the 2026-11-03 PDF. The paper is not on arXiv yet, so `released` stays false and
// the Paper and arXiv pills read "soon"; going live is filling in `pdf` and `arxiv` and flipping it.
// Code and data are public already and link now.

export const released = false;

export const paper = {
  title: 'Route Anything',
  subtitle: 'A Study of Model and Policy Routing for General-Purpose AI Systems',
  lab: 'InfRec · Cardinal AI Lab',
  date: 'November 2026',
  dateISO: '2026-11-03',
  question: 'How much can routing gain, what do learned routers recover, and when does routing pay through price?',
  links: {
    pdf: '',
    arxiv: '',
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

export const abstract =
  'Artificial general intelligence (AGI) requires the method that can understand, generate, reason, and act across diverse domains and modalities. Rather than relying on a single model to master every capability, a promising path toward AGI is to orchestrate a heterogeneous ecosystem of specialized models, tools, and policies into a unified intelligent system. At the heart of this vision lies a fundamental question: how can an AI system dynamically select and coordinate the right capabilities for each task while balancing performance and computational cost? In this work, we present Route Anything, a unified framework for studying model and policy routing across general-purpose AI systems. We develop a unified theoretical foundation that characterizes optimal routing under quality–cost trade-offs and establishes how the information available to a router determines its attainable performance. To systematically investigate routing across diverse capabilities, we construct an omni-modal trajectory matrix spanning 25 benchmarks across language understanding, image, video, and speech generation, coding and workplace agents, and robotic manipulation, comprising 374,401 scored runs from 452 candidate configurations. Building on this framework, we investigate the potential of routing, the capabilities of learned routers, and the conditions under which routing improves efficiency. Our results reveal substantial opportunities for capability orchestration: per-input oracle routing improves performance by 5.4 points over the best fixed candidate, while learned routers recover only a small fraction of this potential. More importantly, routing enables significant efficiency gains at near-zero quality loss, reaching up to 25.5× on coding tasks and 7.1× on text question answering.';

/** Placeholder until the arXiv identifier exists. */
export const bibtex = `@misc{zhou2026routeanything,
  title         = {Route Anything: A Study of Model and Policy Routing for General-Purpose {AI} Systems},
  author        = {Zhou, Pengfei and Ma, Yixing and Wang, Hexin and Tang, Weidong and Wan, Zhenglin and Zhao, Wangbo and You, Yang},
  year          = {2026},
  month         = nov,
  note          = {Technical report},
  archivePrefix = {arXiv},
  eprint        = {2610.xxxxx}
}`;
