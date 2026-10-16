import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { MathBlock } from '@/components/math/MathBlock';
import { s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { MemoryPriors, SignAgreement, WriteThreshold } from '@/components/viz/MemoryFigure';
import { MEMORY } from '@/data/results';

export function Remember() {
  return (
    <Section
      id="remember"
      n="7"
      kicker={
        <>
          <span>Finding 7</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">What should a router remember?</span>
        </>
      }
      title="Memory pays only relative to the prior it replaces."
      lede="A record store is not valuable because it covers many cells. A retained choice must improve on whatever the router would have done without it, and the same store can gain against one prior and lose against another."
    >
      <Prose>
        <p>
          Let cell <M>{'j'}</M> arrive with probability <M>{'\\nu_j'}</M>, have stationary coverage <M>{'\\chi_j'}</M> and erroneous write
          fraction <M>{'e_j'}</M>. For an informative or erroneous record state, <M>{'g_j^I'}</M> and <M>{'g_j^W'}</M> are the value-minus-cost
          gains over a prior <M>{'U'}</M> with the same exploration and writing, at the prior&rsquo;s efficiency <M>{'\\eta_U'}</M>. Under a
          fixed write process, at stationarity,
        </p>
        <MathBlock n="10">{`\\mathbb E[V-\\eta_U D]=\\sum_j \\nu_j\\,\\chi_j\\big[(1-${s('e')})\\,g_j^I+e_j\\,g_j^W\\big].`}</MathBlock>
        <p>
          Positive surplus means an efficiency gain over the prior. If <M>{'g_j^I>0>g_j^W'}</M>, a covered cell helps exactly when{' '}
          <M>{'e_j<g_j^I/(g_j^I-g_j^W)'}</M>.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="15"
          title="When a covered cell helps"
          source={{ kind: 'schematic', note: 'one cell' }}
          caption={
            <>
              A cell&rsquo;s contribution falls linearly with the share of wrong records, from <M>{'g^I'}</M> to <M>{'g^W'}</M>. It helps while{' '}
              <M>{'e'}</M> stays left of the crossing. Make wrong records cheap (small <M>{'|g^W|'}</M>) and the store tolerates many of them;
              in the paper, injected writer errors up to <M>{'e_j=0.90'}</M> leave the aggregate sign unchanged, because injected identities
              mostly name cheaper, still-usable models.
            </>
          }
        >
          <WriteThreshold />
        </Plate>
      </div>

      <Prose className="mt-12">
        <p>
          <strong>Test.</strong> A <em>semi-synthetic</em> study combines real outputs and verifier judgments with constructed arrivals and
          retention: 2,044 probing and 867 test tasks in {MEMORY.cells} cells. The writer explores a uniformly sampled model with probability{' '}
          {MEMORY.explore} and writes its identity to the arriving cell when verification accepts; the newest record serves later tasks.{' '}
          {MEMORY.streams} streams of {MEMORY.rounds.toLocaleString('en-US')} rounds are measured at stationarity.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="16"
          title="One record store, two priors"
          source={{ kind: 'data', ref: 'Table 2' }}
          caption={
            <>
              With hidden-test writes and no expiration, the store reaches {MEMORY.storeEff} score per dollar but scores {MEMORY.belowOpus}{' '}
              below always-Opus and {MEMORY.belowDimBest} below the probing-fitted DimensionBest prior, which sends each dimension to its best
              model. Against always-Opus it gains; against DimensionBest Eq. (10) predicts the opposite sign, and the realised gain has it.
              Predicted magnitudes are less accurate than their signs.
            </>
          }
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <MemoryPriors />
            <div className="lg:border-l lg:border-dashed lg:border-rule lg:pl-8">
              <div className="mb-1 font-sans text-[14px] font-semibold text-ink">Cell-level sign agreement</div>
              <p className="mb-5 font-sans text-[12.5px] leading-snug text-ink-3">
                Does the probing prediction get the sign of each cell&rsquo;s realised gain right?
              </p>
              <SignAgreement />
            </div>
          </div>
        </Plate>
      </div>
    </Section>
  );
}
