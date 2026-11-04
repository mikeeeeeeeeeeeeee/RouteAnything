# Route Anything project page

Project page for **Route Anything: A Study of Model and Policy Routing for General-Purpose AI Systems** (Pengfei Zhou, Yixing
Ma, Hexin Wang, Weidong Tang, Zhenglin Wan, Wangbo Zhao, Yang You; paper of 2026-11-03).

A short, minimal page in the manner of [rlvr-pirl.vercel.app](https://rlvr-pirl.vercel.app/) and
[supermimic.github.io](https://supermimic.github.io/): white page and grey bands, one accent (blue) for the method and grey for
everything else, Inter Tight headlines and Inter text. Each section is one question, a two-line answer, a short paragraph and
one figure; every figure is a plain SVG chart with a tooltip on hover (a tap on a touch screen). It runs from the hero (headroom
and efficiency, the paper's Figure 1) through how it works (the setting and four drawings of Theorem 2 and Propositions 3–5),
the paper's three questions (can a router beat the best fixed candidate, how well do learned routers work, when is a cheaper
route good enough), to the paper and its BibTeX.
Light by default, with a plain dark theme.

**Phone layout.** A phone gets its own layout (`src/phone/`), chosen by the browser's user agent or a window narrower than
640 px; `?view=phone` or `?view=desktop` chooses one and remembers it. Both layouts carry a switch to the other one and keep the
section being read. A computer that chooses the phone layout sees it in a phone-sized frame.

React 19 + Vite + Tailwind CSS v4 (for the reset and theme variables; the page's own styles are in `src/index.css`).

**Paper links.** The paper is [arXiv 2611.05275](https://arxiv.org/abs/2611.05275), and the page follows its v1 text. `released` in
`src/data/paper.ts` is `true`, so the Paper (PDF), arXiv and Hugging Face (paper page) buttons link and the bar's main button opens
the paper; Code and Data link to the public repository and the Hugging Face replay bundle. The arXiv cover's Project Page link points here.

## API trial

A Try it section (between the findings and the paper, also in the bar and the phone menu) offers a few API keys to the 4B
router. Applicants fill in one form in a sheet; `#apply` at the end of the address opens it directly, so
`https://mikeeeeeeeeeeeeee.github.io/RouteAnything/#apply` is the link to hand out. The form agrees to the trial terms
(`COPY.trial.terms` in `src/site/copy.tsx`).

- **Where requests go.** The form posts to Web3Forms (form "RedBird"), which emails each request to the form's inbox with the
  applicant as reply-to: answering is replying. The inbox is set in the Web3Forms dashboard, not in this repository.
- **Mainland China.** Web3Forms sits behind Cloudflare, which stops requests from mainland China. When sending fails, the
  form offers to send the same request by email to `fallbackEmail`, answers filled in, or to copy them.
- **Settings** are in `src/data/trial.ts`: `enabled`, the access key (public by design), `fallbackEmail`, the reply time the
  page promises, and the date of the terms.
- **Testing.** The dev server never sends: add `?send=1` to send from it for real, or `?fail=1` to see the email fallback.
  A built page always sends.

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
| Every number on the page (Tables 1–15, Figs. 1, 3, 4 and the text of arXiv 2611.05275v1) | `src/data/results.ts` |
| Every sentence on the page, shared by both layouts | `src/site/copy.tsx` |
| Sections, shared by both layouts | `src/site/sections.tsx` |
| Charts | `src/charts/*.tsx` |
| The phone layout, the layout switch and the framed preview | `src/phone/` |
| Colours, type and spacing | `src/index.css` |

Charts are redrawn from the paper's tables and figures; the four small drawings under How it works illustrate the statements
with made-up numbers, and their tooltips give the measured values where the paper has them. The omni-modal matrix itself is
proprietary and is not released; the page shows only the aggregates the paper reports.
