# Route Anything project page

Project page for **Route Anything: A Study of Model and Policy Routing for General-Purpose AI Systems** (Pengfei Zhou, Yixing
Ma, Hexin Wang, Weidong Tang, Zhenglin Wan, Wangbo Zhao, Yang You; paper of 2026-11-03).

A short, minimal page in the manner of [rlvr-pirl.vercel.app](https://rlvr-pirl.vercel.app/) and
[supermimic.github.io](https://supermimic.github.io/): white page and grey bands, one accent (blue) for the method and grey for
everything else, Inter Tight headlines and Inter text. Each section is one question, a two-line answer, a short paragraph and
one figure; every figure is a plain SVG chart with a tooltip on hover (a tap on a touch screen). It runs from the hero (headroom
and efficiency, the paper's Figure 1) through how it works (the setting and four drawings of Theorem 2 and Propositions 3–5),
how much routing can gain, what learned routers recover and when routing pays through price, to the paper and its BibTeX.
Light by default, with a plain dark theme.

**Phone layout.** A phone gets its own layout (`src/phone/`), chosen by the browser's user agent or a window narrower than
640 px; `?view=phone` or `?view=desktop` chooses one and remembers it. Both layouts carry a switch to the other one and keep the
section being read. A computer that chooses the phone layout sees it in a phone-sized frame.

React 19 + Vite + Tailwind CSS v4 (for the reset and theme variables; the page's own styles are in `src/index.css`).

**Paper links.** The paper is not on arXiv yet: `released` in `src/data/paper.ts` is `false`, so the Paper and arXiv buttons read
"soon" and the bar's main button links to the code. Code and Data link to the public repository and the Hugging Face replay
bundle. When the paper is posted, fill in `links.pdf` and `links.arxiv`, set `released = true`, replace the BibTeX placeholder
`2610.xxxxx`, and push.

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
| Every number on the page (Tables 1–17, Figs. 1, 3, 4 and the text of the 2026-11-03 paper) | `src/data/results.ts` |
| Every sentence on the page, shared by both layouts | `src/site/copy.tsx` |
| Sections, shared by both layouts | `src/site/sections.tsx` |
| Charts | `src/charts/*.tsx` |
| The phone layout, the layout switch and the framed preview | `src/phone/` |
| Colours, type and spacing | `src/index.css` |

Charts are redrawn from the paper's tables and figures; the four small drawings under How it works illustrate the statements
with made-up numbers, and their tooltips give the measured values where the paper has them. The omni-modal matrix itself is
proprietary and is not released; the page shows only the aggregates the paper reports.
