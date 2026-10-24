import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { HeadroomLadder } from '@/components/viz/HeadroomLadder';

export function Ladder() {
  return (
    <Section
      id="ladder"
      n="3"
      kicker={
        <>
          <span>Proposition 3</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Headroom ladder</span>
        </>
      }
      title="What a router observes bounds what it can reach."
      lede="A router that sees only the benchmark can do no better than the best arm per benchmark. One that sees the input can do better, and none can beat the oracle that knows every outcome. The two outer rungs can be measured."
    >
      <Prose>
        <p>
          Write <Sym k="W" children="W_u=V_u-\lambda D_u" /> for an arm&rsquo;s net outcome on one input, and let
        </p>
        <MathBlock>{`${s('Vstar')}=\\mathbb E\\Big[\\max_u\\,\\mathbb E\\big[W_u\\mid\\sigma(x)\\big]\\Big]`}</MathBlock>
        <p>
          be the best return of a router that observes <M>{'\\sigma(x)'}</M>, attained, as in Theorem 2(i), by playing in each state an arm
          that maximises <M>{'\\mathbb E[W_u\\mid\\sigma(x)]'}</M>.
        </p>
      </Prose>

      <div className="mt-8 md:ml-[190px]">
        <Statement
          kind="Proposition"
          n="3"
          name="Headroom ladder"
          source="Paper §2 · proof in App. A.3"
          proof={
            <>
              By the tower property, <M>{'\\mathbb E[W_u\\mid S_1]=\\mathbb E\\big[\\mathbb E[W_u\\mid S_2]\\mid S_1\\big]'}</M>, which is at most
              the conditional mean of <M>{'\\max_{u\'}\\mathbb E[W_{u\'}\\mid S_2]'}</M>; maximising over <M>{'u'}</M> and taking expectations
              gives the first inequality, with equality exactly when one arm is optimal at almost every finer state. The same argument with the
              identity in place of <M>{'\\sigma_2'}</M> gives the second. The last holds because <M>{'W_u\\le\\max_{u\'}W_{u\'}'}</M> for every arm,
              so <M>{'\\max_u\\mathbb E[W_u\\mid x]\\le\\mathbb E[\\max_u W_u\\mid x]'}</M> input by input.
            </>
          }
        >
          <p>
            Let <M>{'\\sigma_1'}</M> be coarser than <M>{'\\sigma_2'}</M>, that is, <M>{'\\sigma_1(x)'}</M> is a function of{' '}
            <M>{'\\sigma_2(x)'}</M>, and let the menu depend on <M>{'x'}</M> only through <M>{'\\sigma_1(x)'}</M>. Then
          </p>
          <MathBlock n="2">{'V^\\star(\\sigma_1)\\ \\le\\ V^\\star(\\sigma_2)\\ \\le\\ V^\\star(x)\\ \\le\\ \\mathbb E\\big[\\max_u W_u\\big].'}</MathBlock>
          <p>
            The first inequality is an equality if and only if, for almost every value <M>{'s_1'}</M> of <M>{'\\sigma_1'}</M>, a single arm is
            optimal at almost every finer state <M>{'s_2'}</M> with <M>{'\\sigma_1=s_1'}</M>. The last gap equals{' '}
            <M>{'\\mathbb E\\{\\mathbb E[\\max_u W_u\\mid x]-\\max_u\\mathbb E[W_u\\mid x]\\}'}</M>, and it vanishes if and only if, given almost
            every <M>{'x'}</M>, one arm attains <M>{'\\max_u W_u'}</M> almost surely.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          With <M>{'\\sigma_1'}</M> the benchmark, <M>{'V^\\star(\\sigma_1)'}</M> is the best fixed arm per benchmark. The outer rungs are
          measurable: the best fixed arm on the left and the per-input oracle on the right. Inner rungs are bounded from below by any router
          that observes that state, and estimated optimistically by the best lookup chosen on the evaluation inputs themselves. A coarse state
          helps only where it changes the best arm, and the oracle overstates what any router can reach by the outcome noise of the last gap:
          when an arm&rsquo;s success on an input is a coin flip, no observable state predicts it.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="6"
          title="The ladder, measured"
          source={{ kind: 'data', ref: '§4 · Tables 1–2' }}
          caption={
            <>
              Each panel stays within one set of test inputs, because fixed-arm and oracle scores are comparable only within a panel. Dashed
              rungs are lookups chosen in hindsight on the test inputs, an optimistic estimate of what a fitted lookup can reach. The band below
              the oracle is <M>{'V^\\star(x)'}</M>, which no experiment measures: the oracle sits above it by the outcome noise of the last gap.
            </>
          }
        >
          <HeadroomLadder />
        </Plate>
      </div>
    </Section>
  );
}
