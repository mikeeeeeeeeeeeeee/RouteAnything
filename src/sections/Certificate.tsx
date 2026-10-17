import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { CertificationRun } from '@/components/viz/CertificationRun';
import { FloorWaffles } from '@/components/viz/FloorWaffles';
import { BarList } from '@/components/viz/BarList';
import { CERTIFICATION } from '@/data/results';

export function Certificate() {
  return (
    <Section
      id="floor"
      n="3"
      kicker={
        <>
          <span>Proposition 3</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Certified quality floor along the price path</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Finding 2</span>
        </>
      }
      title="A fitted floor is not a guarantee. A certified one is."
      lede="Theorem 2 is applied to fitted numbers, so nothing ensures the floor holds on new tasks. The price path turns the fitted solutions into a short, ordered family of routers that can be tested one by one."
    >
      <div className="md:ml-[190px]">
        <Statement
          kind="Proposition"
          n="3"
          name="Certified quality floor along the price path"
          source="Paper §2 · proof in App. A.3"
          proof={
            <>
              Part (a): the fitted maximisers change only at breakpoints of a piecewise-linear convex function, and each breakpoint swaps one
              action for a cheaper one in one state, which bounds <M>{'K'}</M> and makes value and cost fall while efficiency rises. Part (b):
              the order of the hypotheses is fixed in advance by the price path, and testing stops at the first non-rejection, so the
              procedure rejects a true null only if it rejects the <em>first</em> true null in the sequence, which happens with probability
              at most <M>{'\\alpha'}</M>. This is fixed-sequence testing; returning the reference when nothing is certified mirrors
              high-confidence policy improvement.
            </>
          }
        >
          <p>
            In the setting of Theorem 2, let values lie in <M>{'[0,1]'}</M> and the reference be admissible with positive fitted value. Fit{' '}
            <M>{'\\hat\\pi,\\hat v,\\hat c'}</M> on a sample <M>{'\\mathcal A'}</M>, and let <M>{'g_1,\\dots,g_K'}</M> be the maximisers of the
            fitted <M>{'\\hat J_\\lambda'}</M> on the successive breakpoint intervals of <M>{'\\lambda\\in[0,\\hat\\eta^\\star]'}</M>.
          </p>
          <p className="mt-3">
            <span className="mr-2 font-display text-[19px] italic text-accent">(a)</span>
            <M>{'K\\le 1+\\sum_x(|\\mathcal U(x)|-1)'}</M>, and along <M>{'k'}</M> fitted value and cost strictly decrease while fitted
            efficiency strictly increases.
          </p>
          <p className="mt-3">
            <span className="mr-2 font-display text-[19px] italic text-accent">(b)</span>
            Fix <M>{'\\epsilon\\ge0'}</M> and <M>{`${s('alpha')}\\in(0,1)`}</M>, and let <Sym k="pk" /> be valid p-values for the null{' '}
            <M>{'Q_{g_k}<-\\epsilon'}</M>, computed on <M>{'n'}</M> fresh tasks drawn independently of <M>{'\\mathcal A'}</M>; for instance
          </p>
          <MathBlock compact>{'p_k=\\exp\\!\\big\\{-n\\,(\\hat Q_k+\\epsilon)_+^2/2\\big\\}.'}</MathBlock>
          <p>
            With <M>{'\\hat k=\\max\\{k:\\,p_1,\\dots,p_k\\le\\alpha\\}'}</M> (the reference if <M>{'p_1>\\alpha'}</M>),{' '}
            <M>{'\\mathbb P\\big(Q_{g_{\\hat k}}<-\\epsilon\\big)\\le\\alpha'}</M>.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          The price path fixes the testing order, so no multiplicity correction is needed. The certified router also comes with a{' '}
          <em>certified price</em>: the reference, the tolerance and the level fix <M>{'\\lambda'}</M>. On the full probing set the path has
          only {CERTIFICATION.pathRouters} routers, against the bound of {CERTIFICATION.pathBound}.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="7"
          title="Test in order, stop at the first failure"
          source={{ kind: 'schematic', note: 'simulated p-values' }}
          caption={
            <>
              Six routers on a fitted price path, tested on a fresh sample <M>{'\\mathcal B'}</M> of 3,540 tasks at <M>{'\\epsilon=0'}</M>,{' '}
              <M>{'\\alpha=0.05'}</M>. Bars are the estimated quality change <M>{'\\hat Q_k'}</M>; a router passes when its p-value is at most{' '}
              <M>{'\\alpha'}</M>. Draw new samples: the certified router moves, but it almost never breaks the floor. True quality changes and
              the noise level are illustrative.
            </>
          }
        >
          <CertificationRun />
        </Plate>
      </div>

      <Prose className="mt-16">
        <p>
          <strong>In the data.</strong> Refitted on a random half of probing, the zero-loss floor keeps test <M>{'\\Delta V\\ge 0'}</M> in only
          12.5% of 200 splits. Certified on the other half with empirical-Bernstein p-values, it keeps the floor in all 200, at a median{' '}
          {CERTIFICATION.medianEff}× efficiency and a certified price of {CERTIFICATION.certifiedPriceRel}
          <M>{'\\,\\eta_B'}</M>. On RouterBench, certified on half of the fitting prompts, the floor holds on held-out prompts in all 200
          halvings, at a median 6.70×.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="8"
          title="200 random splits, three ways to set the floor"
          source={{ kind: 'data', ref: '§4.1, App. B.2' }}
          caption={
            <>
              CodeRouterBench, zero-loss floor (<M>{'\\epsilon=0'}</M>), evaluated on the 2,919 test tasks. Rounding down to the last path
              router that meets the fitted floor helps, but only certification on independent tasks holds every time. The guarantee is an
              aggregate one: the certified router is negative in a median {CERTIFICATION.negCellsMedian} of {CERTIFICATION.cells} test cells.
              Certifying every cell keeps all cells nonnegative, at {CERTIFICATION.cellwiseEff}× (against {CERTIFICATION.cellwiseDirectOnly}× with
              direct dispatch alone).
            </>
          }
        >
          <FloorWaffles />
          <div className="mt-10 border-t border-dashed border-rule pt-8">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-sans text-[14px] font-semibold text-ink">Why the order matters</span>
              <span className="font-sans text-[12px] text-ink-3">median efficiency of the certified router, same 200 splits</span>
            </div>
            <p className="mb-5 font-serif text-[14.5px] text-ink-3">
              Testing the whole path with a Bonferroni correction is also valid, but pays for multiplicity. The fixed order adds 1.9–3.7 to the
              median multiplier.
            </p>
            <BarList
              labelWidth={230}
              max={21}
              rows={CERTIFICATION.byMethod.map((m) => ({
                key: m.label,
                label: m.label,
                value: m.eff,
                display: `${m.eff.toFixed(2)}×`,
                color: m.ordered ? 'var(--teal)' : 'var(--slate)',
                emphasis: m.eff > 19,
              }))}
              ticks={[0, 5, 10, 15, 20]}
              tickFormat={(v) => `${v}×`}
            />
          </div>
        </Plate>
      </div>
    </Section>
  );
}
