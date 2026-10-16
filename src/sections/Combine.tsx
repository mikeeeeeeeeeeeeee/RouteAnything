import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { MathBlock } from '@/components/math/MathBlock';
import { s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { PortfolioShift } from '@/components/viz/PortfolioShift';
import { SelectionDots } from '@/components/viz/SelectionDots';
import { PORTFOLIO_EXAMPLE } from '@/data/results';

export function Combine() {
  return (
    <Section
      id="combine"
      n="5"
      kicker={
        <>
          <span>Finding 3</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Which model adds cost-aware coverage?</span>
        </>
      }
      title="Adding a model changes the tasks left to the fallback."
      lede="A candidate's worth to a portfolio depends on which tasks still reach the fallback after it joins. Comparing both portfolios on the same tasks gets this right; holding the old portfolio's averages fixed does not."
    >
      <Prose>
        <p>
          For a portfolio <M>{'S'}</M> and a candidate <M>{'m'}</M>, let <M>{'S^+=S\\cup\\{m\\}'}</M>. Lemma 1, with the current portfolio as
          the reference, gives the <em>paired gain</em>, which lets accepted quality and fallback outcomes change:
        </p>
        <MathBlock n="6">{`\\begin{gathered}${s('G')}=\\mathbb E[V_{S^+}-V_S]-\\eta(S)\\,\\mathbb E[D_{S^+}-D_S],\\\\[4pt] \\eta(S^+)-\\eta(S)=\\frac{G_m(S)}{\\mathbb E[D_{S^+}]}.\\end{gathered}`}</MathBlock>
        <p>
          If the two portfolios shared an accepted value <M>{'v_h'}</M>, a miss-conditional fallback value <M>{'v_{\\rm miss}'}</M> and a
          fallback cost <M>{'b'}</M>, the paired gain would reduce to the residual-coverage rule, with <M>{'d_m(S)'}</M> the added call,
          aggregation and verification cost:
        </p>
        <MathBlock n="7">{`N_m(S)=${s('r')}\\,\\big[v_h-v_{\\rm miss}+\\eta(S)\\,b\\big]-\\eta(S)\\,d_m(S).`}</MathBlock>
        <p>
          Residual coverage is a solver&rsquo;s marginal contribution to an algorithm portfolio&rsquo;s virtual best solver. What routing adds
          is the fallback cost <M>{'b'}</M> and the <em>shift of the fallback population</em>, which Eq. (7) ignores.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="9"
          title="The fallback population moves when a model joins"
          source={{ kind: 'data', ref: '§4.2 example' }}
          caption={
            <>
              Left, schematic: adding <M>{'m'}</M> takes over part of the fallback&rsquo;s tasks, so the tasks that still reach{' '}
              <M>{'B'}</M> change. Right, data: on CodeRouterBench, residual coverage predicts that adding {PORTFOLIO_EXAMPLE.add} loses 1.4
              score per dollar; on held-out tasks the paired gain is <M>{'+5.0\\ [3.5,\\,6.6]'}</M>.
            </>
          }
        >
          <PortfolioShift />
        </Plate>
      </div>

      <Prose className="mt-16">
        <p>
          <strong>Test.</strong> Candidate choices are fitted on probing and evaluated on held-out tasks: seven candidates and portfolios of
          up to three models on CodeRouterBench, ten candidates added to 21 initial portfolios on RouterBench. An oracle verifier picks a
          passing member, else the reference, and every member call is charged.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="10"
          title="Paired selection picks the best candidate most often"
          source={{ kind: 'data', ref: 'Table 1' }}
          caption={
            <>
              Share of comparisons in which a rule&rsquo;s fitted choice has the highest held-out efficiency among the candidates. The paired
              rule leads in every setting, by margins that cluster bootstraps cannot separate from zero (at CodeRouterBench{' '}
              <M>{'\\theta=1'}</M> it wins 15 of 15 discordant comparisons against residual coverage). In a cheapest-first cascade at{' '}
              <M>{'\\theta=0.5'}</M> the gap widens: {PORTFOLIO_EXAMPLE.cheapestFirst.paired}% against {PORTFOLIO_EXAMPLE.cheapestFirst.residual}%
              for residual coverage. Marginal success forgoes 13–17% of the best candidate&rsquo;s efficiency; paired selection, at most 0.06%.
            </>
          }
        >
          <SelectionDots />
        </Plate>
      </div>
    </Section>
  );
}
