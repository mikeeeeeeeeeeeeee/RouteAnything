# Route Anything project page

Project page for **Route Anything: Quality–Cost Tradeoffs in Model Routing** (The InfRec Research Team).

The page is set like an interactive monograph: every formal result (Lemma 1, Theorem 2, Propositions 3 and 4) sits in
its own plate with a proof idea, every symbol carries a hover card, and every finding is redrawn from the paper's
tables as a live figure. It opens on an animated schematic of what a router is (Fig. 00, the capability field), and
its route diagrams share one drawing language: circles, thin edges, packets travelling along them. Light ("vellum")
and dark ("slate") themes; light has no background, dark is lit by Side Rays. The visitor's choice is remembered.

React 19 + Vite + Tailwind CSS v4 + KaTeX, with 30 effects and components from [React Bits](https://reactbits.dev)
(TS + Tailwind variants, vendored in `src/components/reactbits/`).

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
| Title, team, date, abstract, BibTeX, **links** (PDF / arXiv / code, empty = "soon") | `src/data/paper.ts` |
| Every number on the page (Tables 1–9, Fig. 3, Fig. 8 and the text) | `src/data/results.ts` |
| Symbols and their hover-card definitions | `src/data/notation.ts` |
| The schematic action menu behind Figs. 5, 6 (Theorem 2) | `src/lib/envelope.ts`, `src/lib/frontier.ts` |
| Sections, in page order | `src/sections/*.tsx` |
| Figures | `src/components/viz/*.tsx` |
| Colours (validated for colour-vision deficiency in both themes) | `src/index.css`, `src/theme/tokens.ts` |

Figures marked **Paper data** are redrawn from the paper's tables; figures marked **Schematic** illustrate a result
with made-up numbers and say so in their caption.
