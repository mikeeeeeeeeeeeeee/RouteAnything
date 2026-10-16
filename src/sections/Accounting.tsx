import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { QSPlane } from '@/components/viz/QSPlane';
import { CascadeFlow } from '@/components/viz/CascadeFlow';

export function Accounting() {
  return (
    <Section
      id="accounting"
      n="1"
      kicker={
        <>
          <span>Lemma 1</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Reference-relative gain</span>
        </>
      }
      title="Compare whole policies, against a named reference."
      lede="Every policy is compared with a named reference on the same tasks, by its quality change and its saving in total resource cost, under an explicit tolerance for quality loss."
    >
      <Prose>
        <p>
          Let <Sym k="V" /> be the value delivered on a task and <Sym k="D" /> the total consumption of one resource: model calls, routing,
          aggregation, verification and information updates, all of it. Let <Sym k="YB" children="Y_B" /> and <Sym k="YB" children="C_B" /> be
          the value and cost of the reference policy <em>on the same tasks</em>, with <M>{'\\bar v=\\mathbb E[Y_B]'}</M> and{' '}
          <M>{'\\bar c=\\mathbb E[C_B]'}</M>. Policies are compared by aggregate efficiency, under a quality floor:
        </p>
      </Prose>
      <Prose>
        <MathBlock n="2">{`${s('eta')}=\\frac{\\mathbb E[V]}{\\mathbb E[D]},\\qquad ${s('etaB')}=\\frac{\\bar v}{\\bar c},\\qquad \\mathbb E[V]\\ \\ge\\ \\bar v-${s('eps')},\\quad \\epsilon\\ge 0.`}</MathBlock>
        <p>
          Dollars, tokens and seconds define <em>separate</em> comparisons; several resources combine only through stated prices. Against the
          reference, a policy has a quality change and a resource saving,
        </p>
        <MathBlock n="3">{`${s('Q')}=\\mathbb E[V-Y_B],\\qquad ${s('S')}=\\mathbb E[C_B-D].`}</MathBlock>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Statement
          kind="Lemma"
          n="1"
          name="Reference-relative gain"
          source="Paper §2 · Eq. (4)"
          proof={
            <>
              Write <M>{'\\mathbb E[V]=\\bar v+Q'}</M> and <M>{'\\mathbb E[D]=\\bar c-\\mathcal S'}</M>. Then{' '}
              <M>{'\\eta-\\eta_B=(\\bar v+Q)/(\\bar c-\\mathcal S)-\\bar v/\\bar c'}</M>; over the common denominator{' '}
              <M>{'\\bar c\\,(\\bar c-\\mathcal S)'}</M> the numerator is <M>{'\\bar c\\,Q+\\bar v\\,\\mathcal S'}</M>, and dividing through by{' '}
              <M>{'\\bar c'}</M> gives the identity. The denominator is positive, so the sign of the gain is the sign
              of <M>{'Q+\\eta_B\\mathcal S'}</M>. The floor is a statement about <M>{'Q'}</M> alone, which is why it is a separate condition.
            </>
          }
        >
          <p>Under the model above,</p>
          <MathBlock n="4">{`\\eta-\\eta_B=\\frac{${s('Q')}+\\eta_B\\,${s('S')}}{\\mathbb E[D]}=\\frac{Q+\\eta_B\\,\\mathcal S}{\\bar c-\\mathcal S}.`}</MathBlock>
          <p>
            Efficiency improves if and only if <M>{'Q+\\eta_B\\mathcal S>0'}</M>; the quality floor is the separate condition{' '}
            <M>{'Q\\ge-\\epsilon'}</M>.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          The identity compares complete policies even when the accepted and fallback populations change, and at an external price it
          reads <M>{'\\Delta J_\\lambda=Q+\\lambda\\mathcal S'}</M>. <strong>Both conditions are needed.</strong> Accepting every output of a
          primary that is right on 15% of tasks, at a tenth of the cost of an always-right reference, passes the ratio test (
          <M>{'\\eta=1.5\\,\\eta_B'}</M>) while losing 0.85 in quality. Try it below.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="2"
          title="Two conditions, not one"
          source={{ kind: 'schematic', note: 'after the paper’s Fig. 1c' }}
          caption={
            <>
              In normalised units, <M>{'\\eta/\\eta_B=(1+Q/\\bar v)/(1-\\mathcal S/\\bar c)'}</M>, so every line of equal efficiency passes
              through the corner where nothing is delivered and nothing is spent. The diagonal <M>{'Q+\\eta_B\\mathcal S=0'}</M> separates gains
              from losses; the dashed floor <M>{'Q=-\\epsilon'}</M> is a second, independent cut. A ratio ranking also depends on where value is
              zero; <M>{'Q+\\lambda\\mathcal S'}</M> at a fixed price and the floor do not.
            </>
          }
        >
          <QSPlane />
        </Plate>
      </div>

      <Prose className="mt-16">
        <p>
          <strong>Cascades.</strong> For language models, a <em>reference-fallback cascade</em> accepts a cheap primary&rsquo;s answer when
          the verifier says <Sym k="H" children="H=1" />, and calls the reference otherwise. With primary-plus-verification cost{' '}
          <Sym k="A" />, it delivers
        </p>
        <MathBlock n="5">{`V=${s('H')}\\,Y_P+(1-H)\\,Y_B,\\qquad D=${s('A')}+(1-H)\\,C_B.`}</MathBlock>
        <p>
          A failed primary is still paid for, and measured or priced verification and routing enter <M>{'A'}</M>. Since{' '}
          <M>{'V-Y_B=H\\,(Y_P-Y_B)'}</M>, a cascade loses quality <em>only</em> through false accepts, on any task distribution, whereas a
          floor for ex-ante dispatch holds only for the law on which it was fitted.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="3"
          title="A cascade pays twice on the tasks it rejects"
          source={{ kind: 'schematic', note: 'illustrative rates' }}
          caption={
            <>
              Each dot is a task. Filled dots are tasks the primary gets right. Every task pays <M>{'A'}</M>; the rejected ones also pay{' '}
              <M>{'C_B'}</M> and receive the reference&rsquo;s answer. Illustration only: the primary is right on 45% of tasks, costs a tenth of
              the reference, and the reference is always right.
            </>
          }
        >
          <CascadeFlow />
        </Plate>
      </div>
    </Section>
  );
}
