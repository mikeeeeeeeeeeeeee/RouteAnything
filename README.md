# Route Anything project page

Project page for **Route Anything: A Study of Model and Policy Routing for General-Purpose AI Systems** (Pengfei Zhou, Yixing
Ma, Hexin Wang, Weidong Tang, Zhenglin Wan, Wangbo Zhao, Yang You; paper of 2026-11-03).

The page is set like an interactive monograph and follows the paper's own sections. It opens on an animated schematic of what a
router does (Fig. 00, the capability field: one router among candidates of every output type). §1 shows one router over every
output type; §2 gathers the formal results (Lemma 1, Theorem 2, Propositions 3–5) under one tab rail, each with its statement, a
folded proof idea and a live figure; §3–§5 redraw the evidence (how much routing can gain, what learned routers recover, when
routing pays through price) from the paper's tables, with sibling results in tabs and longer text folded under "What the paper
says". Tabs keep the height of their tallest pane, so nothing below them moves when you switch. Every symbol carries a hover card.
Light ("vellum") and dark ("slate") themes; light has no background, dark is lit by Side Rays.

React 19 + Vite + Tailwind CSS v4 + KaTeX, with effects and components from [React Bits](https://reactbits.dev)
(TS + Tailwind variants, vendored in `src/components/reactbits/`).

**Paper links.** The paper is not on arXiv yet: `released` in `src/data/paper.ts` is `false`, so the Paper and arXiv pills read
"soon". Code and Data link to the public repository and the Hugging Face replay bundle, and the Research thread pill links to
https://route-anything.vercel.app/. When the paper is posted, fill in `links.pdf` and `links.arxiv`, set `released = true`, replace
the BibTeX placeholder `2610.xxxxx`, and push.

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
| Every number on the page (Tables 1–17, Figs. 1, 4 and 7, and the text of the 2026-11-03 paper) | `src/data/results.ts` |
| Symbols and their hover-card definitions | `src/data/notation.ts` |
| The schematic candidate menu behind Fig. 2.2 (Theorem 2) | `src/lib/envelope.ts`, `src/lib/frontier.ts` |
| Sections, in page order | `src/sections/*.tsx` |
| Figures | `src/components/viz/*.tsx` |
| Colours (validated for colour-vision deficiency in both themes) | `src/index.css`, `src/theme/tokens.ts` |

Figures marked **Paper data** are redrawn from the paper's tables and figures; figures marked **Schematic** illustrate a
result with made-up numbers and say so in their caption. The omni-modal matrix itself is proprietary and is not released;
the page shows only the aggregates the paper reports.
