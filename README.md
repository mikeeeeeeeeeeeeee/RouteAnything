# Route Anything project page

Project page for **Route Anything: an attempt for AGI through a simple omni-modal router** (Pengfei Zhou, Yixing Ma, Hexin Wang,
Weidong Tang, Zhenglin Wan, Wangbo Zhao, Yang You; manuscript of 2026-10-24).

The page is set like an interactive monograph. It opens on an animated schematic of what a router does (Fig. 00, the capability
field: one router among arms of every output type). Part I sets each formal result (Lemma 1, Theorem 2, Propositions 3–5) in its own
plate with a proof idea and a live figure; every symbol carries a hover card. Part II redraws the evidence from the paper's tables:
the omni-modal outcome matrix, per-input headroom, learned routers, robot routing by scene, training targets, matched baselines,
price routes, and spending more within a task. Route diagrams share one drawing language: circles, thin edges, packets travelling
along them. Light ("vellum") and dark ("slate") themes; light has no background, dark is lit by Side Rays. The visitor's choice is
remembered.

React 19 + Vite + Tailwind CSS v4 + KaTeX, with effects and components from [React Bits](https://reactbits.dev)
(TS + Tailwind variants, vendored in `src/components/reactbits/`).

**Not released yet.** `released` in `src/data/paper.ts` is `false`, so the Paper, arXiv, Code and Data links render as "soon".
The link to the Route Anything research thread (`thread` in `src/data/paper.ts`, https://route-anything.vercel.app/, in the hero
and the footer) is always live, because that site is already public. When the
paper is posted, fill in `links.pdf` and `links.arxiv`, set `released = true`, replace the BibTeX placeholder `2610.xxxxx`, rebuild and
publish.

## Run and build

```bash
npm install
npm run dev            # http://localhost:5181
npm run build          # dist/: static site, relative paths, works under any sub-path
npm run build:single   # dist-single/index.html: one self-contained file, opens by double-click
```

## Publish on GitHub Pages

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and deploys `dist/` to GitHub Pages
(Settings → Pages → Source: **GitHub Actions**). The page appears at `https://<user>.github.io/<repo>/`; the canonical
and link-preview URLs in `index.html` assume `mikeeeeeeeeeeeeee.github.io/RouteAnything/`, so change them if the
address differs. Any static host works too: upload the contents of `dist/`.

## Where the content lives

| What | File |
| --- | --- |
| Title, authors, date, abstract, BibTeX, **links** and the `released` switch | `src/data/paper.ts` |
| Every number on the page (Tables 1–17, Fig. 4 and the text of the 2026-10-24 manuscript) | `src/data/results.ts` |
| Symbols and their hover-card definitions | `src/data/notation.ts` |
| The schematic arm menu behind Figs. 4, 5 (Theorem 2) | `src/lib/envelope.ts`, `src/lib/frontier.ts` |
| Sections, in page order | `src/sections/*.tsx` |
| Figures | `src/components/viz/*.tsx` |
| Colours (validated for colour-vision deficiency in both themes) | `src/index.css`, `src/theme/tokens.ts` |

Figures marked **Paper data** are redrawn from the paper's tables and figures; figures marked **Schematic** illustrate a
result with made-up numbers and say so in their caption. The omni-modal outcome matrix itself is proprietary and is not released;
the page shows only the aggregates the paper reports.
