import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { WinnerTrap } from '@/components/viz/WinnerTrap';

export function Targets() {
  return (
    <Section
      id="targets"
      n="4"
      kicker={
        <>
          <span>Proposition 4</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Outcomes, not winners</span>
        </>
      }
      title="Train on each arm's outcome, not on who won."
      lede="A learned router needs a training target. Two are common: each arm's outcome, and the identity of the winning arm. Only the first estimates what the rule of Theorem 2 needs."
    >
      <div className="md:ml-[190px]">
        <Statement
          kind="Proposition"
          n="4"
          name="Outcomes, not winners"
          source="Paper §2 · proof in App. A.4"
          proof={
            <>
              (a) For a fixed input, the expected cross-entropy <M>{'-\\mu\\log m-(1-\\mu)\\log(1-m)'}</M> is strictly convex in the score{' '}
              <M>{'m'}</M> and minimised at <M>{'m=\\mu=\\mathbb E[V_u\\mid x]'}</M>; the expected squared error{' '}
              <M>{'\\operatorname{Var}(V_u\\mid x)+(\\mu-m)^2'}</M> is minimised there too. (b) Since <M>{'\\tfrac12<b<a<1'}</M>, arm{' '}
              <M>{'B'}</M> beats <M>{'A'}</M> exactly when it delivers 1, with probability <M>{'b'}</M>, and loses otherwise; so the winner
              label favours <M>{'B'}</M>, whose expected value <M>{'b'}</M> is below <M>{'a'}</M>, and the loss <M>{'a-b'}</M> approaches{' '}
              <M>{'\\tfrac12'}</M>.
            </>
          }
        >
          <p>
            <span className="mr-2 font-display text-[19px] italic text-accent">(a)</span>For each arm, the score that minimises the expected
            binary cross-entropy, or squared error, against <M>{'V_u'}</M> given <M>{'x'}</M> is
          </p>
          <MathBlock compact>{'m_u(x)=\\mathbb E[V_u\\mid x],'}</MathBlock>
          <p>
            and routing to <M>{'\\arg\\max_u m_u(x)'}</M> attains <M>{'V^\\star(x)'}</M> at <M>{'\\lambda=0'}</M>.
          </p>
          <p className="mt-3">
            <span className="mr-2 font-display text-[19px] italic text-accent">(b)</span>Let the <em>winner</em> be the arm with the highest
            realised value, ties broken by a fixed rule, and let <Sym k="p" /> be the probability that <M>{'u'}</M> wins, which a cross-entropy
            classifier on winner labels estimates. Routing to <M>{'\\arg\\max_u p_u(x)'}</M> can lose almost half of the value range: if arm{' '}
            <M>{'A'}</M> always delivers <M>{'a<1'}</M> and arm <M>{'B'}</M> delivers 1 with probability <M>{'b\\in(\\tfrac12,a)'}</M> and 0
            otherwise, then <M>{'p_B=b>p_A'}</M>, while <M>{'\\mathbb E[V_B]=b<a'}</M>.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          Tie-breaks make it worse. With binary outcomes and ties sent to a faster arm, an arm that succeeds with probability 0.9 loses the
          label to a faster independent arm that succeeds with probability 0.5: it wins only when it succeeds and the other fails, with
          probability 0.45. Per-arm regression uses every outcome, including ties and failures, whereas a winner label keeps one choice per
          input. Section 8 shows what this does to a robot router.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="7"
          title="The winner label points at the wrong arm"
          source={{ kind: 'schematic', note: 'Proposition 4(b)' }}
          caption={
            <>
              Move <M>{'a'}</M> and <M>{'b'}</M>. A classifier trained on winner labels learns <M>{'p_u'}</M> and picks <M>{'B'}</M> whenever{' '}
              <M>{'b>\\tfrac12'}</M>; a regression on outcomes learns <M>{'\\mathbb E[V_u]'}</M> and picks <M>{'A'}</M> whenever{' '}
              <M>{'a>b'}</M>. The strip below simulates the tie-break example draw by draw: the arm that succeeds nine times in ten collects
              fewer than half of the labels.
            </>
          }
        >
          <WinnerTrap />
        </Plate>
      </div>
    </Section>
  );
}
