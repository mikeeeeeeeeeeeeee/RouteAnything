// Paper metadata. Empty links render as "soon" pills; fill them in when the paper is public.

export const paper = {
  title: 'Route Anything',
  subtitle: 'Quality–Cost Tradeoffs in Model Routing',
  team: 'The InfRec Research Team',
  lab: 'InfRec · Cardinal AI Lab',
  date: 'October 2026',
  dateISO: '2026-10-15',
  question: 'What should a router combine, when should it spend more, and what should it remember?',
  links: {
    pdf: '',
    arxiv: '',
    code: '',
  },
};

export const abstract =
  'An inference router decides which model or combination should handle a task, when to spend more computation, and what to remember from earlier outcomes. We study these coupled decisions with a reference-relative accounting: every policy is compared with a named reference policy on the same tasks, by its quality change and its saving in total resource cost, including routing, verification, and information costs, under an explicit tolerance for quality loss. For finite-menu routing with a quality floor, fractional programming shows that the reference and the tolerance fix the price at which a router should trade quality for cost; the resulting price path yields a finite-sample certificate for the floor, and the reference both sets this price and competes as an action at it. On CodeRouterBench and RouterBench, the accounting yields concrete findings. Whether a router escalates to the reference at all is decided by the price structure, not by the ratio objective. Fitted quality floors often fail on held-out tasks, whereas certified floors hold in all 200 random splits. Adding a model changes which tasks reach the fallback, and comparing both portfolios on the same tasks raises best-candidate selection on CodeRouterBench from 86.3–94.3% to 96.4–97.1%. A failure makes further attempts less attractive, yet failing-test feedback nearly doubles retry recovery, from 0.165 to 0.304 across seven models. Finally, released routers mainly recover the task type, and router memory pays only relative to the prior it replaces.';

/** Placeholder until the arXiv identifier exists. */
export const bibtex = `@misc{infrec2026routeanything,
  title         = {Route Anything: Quality--Cost Tradeoffs in Model Routing},
  author        = {{The InfRec Research Team}},
  year          = {2026},
  month         = oct,
  note          = {Technical report},
  archivePrefix = {arXiv},
  eprint        = {2610.xxxxx}
}`;

/** The paper's author block is still a template ("Author One", ...). */
export const authorsPending = true;
