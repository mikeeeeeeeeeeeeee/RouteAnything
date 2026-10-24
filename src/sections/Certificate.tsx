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
      n="5"
      kicker={
        <>
          <span>Proposition 5</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Certified quality floor</span>
        </>
      }
      title="A fitted floor is not a guarantee. A certified one is."
      lede="Theorem 2 is applied to fitted values and costs, so a fitted floor need not hold on new inputs. Testing a short, ordered family of routers on fresh inputs makes it hold with a stated probability."
    >
      <div className="md:ml-[190px]">
        <Statement
          kind="Proposition"
          n="5"
          name="Certified quality floor"
          source="Paper §2 · proof in App. A.5"
          proof={
            <>
              Condition on the fitting data, which fixes the routers, their order and their true quality changes. If the selected router breaks
              the floor, then some router up to it does, and the first such router in the order was tested and passed: its p-value was at most{' '}
              <M>{'\\alpha'}</M>. That happens with probability at most <M>{'\\alpha'}</M>, because its null hypothesis is true. The reference
              itself never breaks the floor. This is fixed-sequence testing; it needs no condition on how the p-values, which share one sample,
              depend on each other.
            </>
          }
        >
          <p>
            Let values lie in <M>{'[0,1]'}</M>, let <M>{'\\epsilon\\ge0'}</M> and <M>{`${s('alpha')}\\in(0,1)`}</M>, and let the routers{' '}
            <M>{'g_1,\\dots,g_K'}</M> and their order be fixed by the fitting data. Let <Sym k="pk" /> be valid p-values for the null
            hypotheses <M>{'Q_{g_k}<-\\epsilon'}</M>, computed on <M>{'n'}</M> inputs drawn i.i.d. from the deployment law, independently of
            the fitting data, with matched outcomes; for instance
          </p>
          <MathBlock compact>{'p_k=\\exp\\!\\big\\{-n\\,(\\hat Q_k+\\epsilon)_+^2/2\\big\\},'}</MathBlock>
          <p>
            where <M>{'\\hat Q_k'}</M> is the sample mean of <M>{'V_{g_k}-Y_B'}</M>. Let <M>{'\\hat g=g_{\\hat k}'}</M> with{' '}
            <M>{'\\hat k=\\max\\{k:\\,p_1,\\dots,p_k\\le\\alpha\\}'}</M>, or the reference if <M>{'p_1>\\alpha'}</M>. Then{' '}
            <M>{'\\mathbb P\\big(Q_{\\hat g}<-\\epsilon\\big)\\le\\alpha'}</M>.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          A natural order is the <em>price path</em> (the paper&rsquo;s Fig. 2): the maximisers of the fitted <M>{'J_\\lambda'}</M> as{' '}
          <M>{'\\lambda'}</M> rises from 0 to the fitted <M>{'\\eta^\\star'}</M>, along which fitted value and cost fall while fitted
          efficiency rises. The test stops at the first router it cannot certify, so no multiplicity correction is needed, and returning the
          reference when nothing is certified mirrors high-confidence policy improvement. The certified router comes with a{' '}
          <em>certified price</em>: the reference, the tolerance and the level fix <M>{'\\lambda'}</M>. On CodeRouterBench&rsquo;s probing
          set the path has only {CERTIFICATION.pathRouters} routers, against the bound of {CERTIFICATION.pathBound}.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="8"
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
          <strong>In the data.</strong> On CodeRouterBench, refitted on half of the probing tasks, the zero-loss floor holds on test in only
          12.5% of 200 splits. Certified on the other half by Proposition 5, with empirical-Bernstein p-values on the mixture-refined path, it
          holds in all 200, at a median {CERTIFICATION.medianEff}× the reference&rsquo;s efficiency. On RouterBench, certified on half of the
          fitting prompts, the zero-loss floor holds on the test prompts in all 200 halvings, at a median 6.70×; uncertified fitted floors hold
          on 4 of 11 splits with family states and on none with dataset states.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="9"
          title="200 random splits, two ways to set the floor"
          source={{ kind: 'data', ref: 'Table 5 · App. C.2' }}
          caption={
            <>
              CodeRouterBench, zero-loss floor (<M>{'\\epsilon=0'}</M>), evaluated on the 2,919 test tasks. Only certification on independent
              tasks holds every time. The guarantee is an aggregate one: the certified router loses quality in a median{' '}
              {CERTIFICATION.negCellsMedian} of {CERTIFICATION.cells} test cells. In {CERTIFICATION.nestedResplits.of} nested 70/30 resplits of
              all 9,999 tasks the refined procedure holds the floor in {CERTIFICATION.nestedResplits.held}, at a median{' '}
              {CERTIFICATION.nestedResplits.median}×. Certification needs every path action and the reference on <M>{'\\mathcal B'}</M>, at
              $0.0158 per task against $0.0124 for Opus alone.
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
              Testing the whole path with a Bonferroni correction is also valid, but pays for multiplicity. The fixed order adds 1.9–3.7 to
              the median multiplier.
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
