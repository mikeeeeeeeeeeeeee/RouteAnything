// Paper metadata. The paper is not posted yet, so `released` stays false and every link renders as a
// "soon" pill. The known addresses are kept here: going live is a one-line change.

export const released = false;

export const paper = {
  title: 'Route Anything',
  subtitle: 'an attempt for AGI through a simple omni-modal router',
  lab: 'InfRec · Cardinal AI Lab',
  date: 'October 2026',
  dateISO: '2026-10-24',
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
  'A router picks, for each input, which language model, image, video, or speech generator, or robot policy should run. We study routing across modalities on an outcome matrix that runs every arm of a pool on the same inputs: 25 benchmarks spanning text and image understanding, image, video, and speech generation, code and workplace agents, and robot manipulation, with 374,401 scored runs of 452 arm versions. We also develop a unified routing theory to organize the evidence. At a resource price, the best router plays, in each state it observes, the arm with the highest value minus priced cost, and a reference policy with a quality tolerance fixes that price. What a router observes bounds what it can reach, on a ladder from the best fixed arm through the best arm per task type to the per-input oracle. On held-out inputs, the per-input oracle beats the best fixed arm per benchmark by 5.4 points, and by 18–19 points for video generation and robot manipulation. Most of this gap lies within task types: on 18 benchmarks with labeled capability types, the best arm per type, chosen in hindsight, closes only 8% of it. Learned routers follow this ladder: across 16 benchmarks they match the best fixed arm and capture 6% of the headroom, with gains on agents, video, and image generation; on robot manipulation, a router that reads the camera frames matches the better policy in each scene condition with 24% less policy time. Regressing each arm’s outcome succeeds where predicting the winning arm fails (71.6% versus 42.8% robot success), and a fixed baseline that drops models with missing scores turns a router’s 0.4-point loss into a 2.4-point gain. Routing pays most through price: at near-zero quality loss, it raises efficiency 25.5× on code, 7.1× on text QA, and 1.35× on image generation.';

/** Placeholder until the arXiv identifier exists. */
export const bibtex = `@misc{zhou2026routeanything,
  title         = {Route Anything: an attempt for {AGI} through a simple omni-modal router},
  author        = {Zhou, Pengfei and Ma, Yixing and Wang, Hexin and Tang, Weidong and Wan, Zhenglin and Zhao, Wangbo and You, Yang},
  year          = {2026},
  month         = oct,
  note          = {Technical report},
  archivePrefix = {arXiv},
  eprint        = {2610.xxxxx}
}`;
