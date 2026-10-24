import ClickSpark from '@/components/reactbits/ClickSpark/ClickSpark';
import GlareHover from '@/components/reactbits/GlareHover/GlareHover';
import { InfRecLogo } from '@/components/ui/TopBar';
import { toast } from '@/components/ui/toast';
import { M } from '@/components/math/M';
import { authors, bibtex, paper } from '@/data/paper';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';

const RULES = [
  {
    title: 'Compare arms on the same inputs.',
    body: 'Measure gains against the matched best fixed arm, chosen and evaluated under the same fallback as the router.',
  },
  {
    title: 'Train routers on per-arm outcomes.',
    body: 'Look for headroom inside task types: a router that learns mainly the type recovers the best fixed arm and little more.',
  },
  {
    title: 'Fix the reference and the tolerance before ranking routes.',
    body: 'They set the price. Then certify the floor on independent inputs, because a fitted floor need not hold on new ones.',
  },
];

const LIMITS = [
  {
    title: 'Some modalities are missing.',
    body: 'The matrix has no video understanding, audio understanding or 3D generation benchmarks, and seven understanding benchmarks enter only the headroom analysis, because no router has yet been evaluated on them.',
  },
  {
    title: 'Router gains are small next to their intervals.',
    body: 'Learned routers were trained with one or four seeds, and most of their gains are small next to their intervals.',
  },
  {
    title: 'Prices are recorded in only some places.',
    body: 'Prices exist for image and speech generation, CodeRouterBench and RouterBench; the other matrix results are quality-only, and robot cost is policy time.',
  },
  {
    title: 'The law of states is taken as given.',
    body: 'The theory does not cover states that depend on the router’s own earlier choices, such as SciCode steps that contain a model’s earlier code, and certification needs the reference’s outcome on every certification input.',
  },
];

export function Cite() {
  const { theme } = useTheme();
  const tk = useTokens();
  const copy = () =>
    navigator.clipboard?.writeText(bibtex).then(
      () => toast('BibTeX copied', 'Paste it into your .bib file.'),
      () => toast('Copy failed', 'Select the text and copy it by hand.')
    );

  return (
    <section id="cite" className="relative scroll-mt-20 border-t border-rule py-24 md:py-32">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <div className="mb-20">
          <div className="smallcaps text-[10.5px] text-accent">Conclusion</div>
          <h2 className="display mt-3 max-w-[820px] text-[clamp(34px,4vw,52px)] text-ink">Three rules follow.</h2>
          <p className="mt-5 max-w-[760px] font-serif text-[17px] leading-[1.7] text-ink-2">
            Across text, images, video, speech, code and robots, the best arm changes from input to input, and the per-input oracle sits
            5.4 points above the best fixed arm per benchmark. Most of that headroom lies within task types. Where the input shows which arm
            will win, as camera frames do for robot policies, a router trained on per-arm outcomes follows it. Routing pays most reliably
            through price: when arms are close in quality and far apart in cost, the reference and the quality tolerance fix the price, and a
            finite-sample test certifies the quality floor.
          </p>
          <ol className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {RULES.map((r, i) => (
              <li key={r.title} className="rounded-[22px] border border-rule bg-surface p-6 shadow-[var(--shadow)]">
                <span className="font-display text-[44px] font-semibold leading-none text-accent [font-variant-numeric:lining-nums]">{i + 1}</span>
                <div className="mt-3 font-sans text-[15.5px] font-semibold leading-snug text-ink">{r.title}</div>
                <p className="mt-2 font-serif text-[15px] leading-[1.6] text-ink-2">{r.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="smallcaps text-[10.5px] text-accent">Limitations</div>
            <h2 className="display mt-3 text-[clamp(34px,4vw,48px)] text-ink">What the results do not say.</h2>
            <ol className="mt-8 space-y-6">
              {LIMITS.map((l, i) => (
                <li key={l.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
                  <span className="font-display text-[26px] font-semibold leading-none text-ink-4">{i + 1}</span>
                  <div>
                    <div className="font-sans text-[15px] font-semibold text-ink">{l.title}</div>
                    <p className="mt-1 font-serif text-[15.5px] leading-[1.65] text-ink-2">{l.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <div className="smallcaps text-[10.5px] text-accent">Cite</div>
            <h2 className="display mt-3 text-[clamp(34px,4vw,48px)] text-ink">If the matrix or the theory helps you.</h2>
            <p className="mt-4 font-serif text-[16px] leading-relaxed text-ink-3">
              A placeholder entry until the paper is posted and its arXiv identifier is assigned.
            </p>
            <div className="mt-7">
              <GlareHover
                background="var(--surface)"
                borderRadius="22px"
                borderColor="var(--rule)"
                glareColor={theme === 'dark' ? '#ffffff' : '#c21a2b'}
                glareOpacity={theme === 'dark' ? 0.16 : 0.08}
                glareAngle={-35}
                glareSize={260}
                width="100%"
                height="auto"
                className="!grid w-full shadow-[var(--shadow)] [grid-template-columns:minmax(0,1fr)]"
              >
                <div className="w-full min-w-0 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-ink-3">zhou2026routeanything.bib</span>
                    <ClickSpark sparkColor={[tk.accent, tk.amber, tk.blue]} sparkCount={10} sparkRadius={34} sparkSize={12} className="!h-auto !w-auto">
                      <button
                        type="button"
                        onClick={copy}
                        className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-sans text-[13px] font-medium text-bg transition-transform active:scale-95"
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                          <rect x="5" y="5" width="8.5" height="8.5" rx="1.8" />
                          <path d="M3 10.5V3.8A1.3 1.3 0 0 1 4.3 2.5H10.5" strokeLinecap="round" />
                        </svg>
                        Copy BibTeX
                      </button>
                    </ClickSpark>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre rounded-2xl bg-surface-2 p-4 font-mono text-[12.5px] leading-[1.7] text-ink-2 no-scrollbar">{bibtex}</pre>
                </div>
              </GlareHover>
            </div>
          </div>
        </div>

        <footer id="page-end" className="mt-24 flex flex-col gap-8 border-t border-rule pt-10 md:flex-row md:items-end md:justify-between">
          <div>
            <InfRecLogo className="h-8 w-auto" />
            <p className="mt-4 max-w-[520px] font-serif text-[14.5px] leading-relaxed text-ink-3">
              {paper.title}: {paper.subtitle}. {authors.map((a) => a.name).join(', ')}. {paper.date}. Figures marked <em>Paper data</em> are
              redrawn from the paper&rsquo;s tables and figures; figures marked <em>Schematic</em> illustrate a result with made-up numbers.
              The omni-modal outcome matrix is proprietary and is not released.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="font-display text-[22px] italic text-ink-2">
              <M>{'g(s)\\in\\arg\\max_u\\,v(s,u)-\\lambda\\,c(s,u)'}</M>
            </span>
            <span className="font-sans text-[12px] text-ink-4">Interactive figures built with React Bits, KaTeX and Motion.</span>
          </div>
        </footer>
      </div>
    </section>
  );
}
