import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { QSPlane } from '@/components/viz/QSPlane';

export function Value() {
  return (
    <Section
      id="value"
      n="1"
      kicker={
        <>
          <span>Lemma 1</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Reference-relative gain</span>
        </>
      }
      title="Every arm delivers a value and spends a resource."
      lede="When a price is given, a router is ranked by value minus priced cost. When none is, it is compared with a named reference on the same inputs: by the quality it changes and the resource it saves, under an explicit tolerance for quality loss."
    >
      <Prose>
        <p>
          <strong>Arms, states, outcomes.</strong> An input <Sym k="x" /> comes with a finite menu <M>{'\\mathcal U(x)'}</M> of{' '}
          <em>arms</em> <Sym k="u" />: language models, image, video or speech generators, robot policies, or execution plans. Running arm{' '}
          <M>{'u'}</M> delivers a value <Sym k="V" children="V_u\in[0,1]" />, the benchmark&rsquo;s metric, and consumes{' '}
          <Sym k="D" children="D_u>0" /> units of one resource, such as dollars or seconds. A router observes a <em>state</em>{' '}
          <Sym k="s" children="s=\sigma(x)" />, which may be the benchmark, a capability type, or the input itself, and chooses an arm{' '}
          <Sym k="g" children="g(s)" />, possibly at random. Write <M>{'v(s,u)=\\mathbb E[V_u\\mid s]'}</M> and{' '}
          <M>{'c(s,u)=\\mathbb E[D_u\\mid s]'}</M>. Routing does not change which inputs arrive, so the law <M>{'\\pi'}</M> of states is fixed.
        </p>
        <p>
          <strong>Price, reference and floor.</strong> At a resource price <Sym k="lambda" children="\lambda\ge0" />, router <M>{'g'}</M> earns{' '}
          <M>{'J_\\lambda(g)=\\mathbb E[V_g]-\\lambda\\,\\mathbb E[D_g]'}</M>; at <M>{'\\lambda=0'}</M> it is ranked by quality alone. When no
          price is given, compare <M>{'g'}</M> with a named <em>reference</em> policy, such as always calling the strongest model, whose value
          and cost on the same inputs are <Sym k="YB" children="Y_B" /> and <Sym k="YB" children="C_B" />. The quality change, the saving, the
          efficiency and the quality floor with tolerance <M>{'\\epsilon\\ge0'}</M> are
        </p>
        <MathBlock n="1">{`\\begin{gathered}${s('Q')}=\\mathbb E[V_g-Y_B],\\qquad ${s('S')}=\\mathbb E[C_B-D_g],\\qquad Q\\ge-${s('eps')},\\\\[4pt] ${s('eta')}=\\frac{\\mathbb E[V_g]}{\\mathbb E[D_g]},\\qquad ${s('etaB')}=\\frac{\\mathbb E[Y_B]}{\\mathbb E[C_B]}.\\end{gathered}`}</MathBlock>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Statement
          kind="Lemma"
          n="1"
          name="Reference-relative gain"
          source="Paper §2 · proof in App. A.1"
          proof={
            <>
              Write <M>{'\\bar v=\\mathbb E[Y_B]'}</M> and <M>{'\\bar c=\\mathbb E[C_B]'}</M>. The definitions give{' '}
              <M>{'\\mathbb E[V]=\\bar v+Q'}</M> and <M>{'\\mathbb E[D]=\\bar c-\\mathcal S'}</M>, so{' '}
              <M>{'\\eta-\\eta_B=(\\bar v+Q)/(\\bar c-\\mathcal S)-\\bar v/\\bar c=(Q+\\eta_B\\mathcal S)/(\\bar c-\\mathcal S)'}</M>, whose
              denominator <M>{'\\mathbb E[D]'}</M> is positive. No independence or stationarity is needed. The floor is a statement about{' '}
              <M>{'Q'}</M> alone, which is why it is a separate condition.
            </>
          }
        >
          <MathBlock>{`\\eta-\\eta_B=\\frac{${s('Q')}+\\eta_B\\,${s('S')}}{\\mathbb E[D_g]}.`}</MathBlock>
          <p>
            Efficiency improves if and only if <M>{'Q+\\eta_B\\mathcal S>0'}</M>, and the quality floor is the separate condition{' '}
            <M>{'Q\\ge-\\epsilon'}</M>.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          <strong>Both conditions are needed.</strong> A primary that is correct on 15% of tasks, at a tenth of the cost of an
          always-correct reference, has <M>{'\\eta=1.5\\,\\eta_B'}</M> but <M>{'Q=-0.85'}</M>. It passes the efficiency test and fails the
          floor by a wide margin. Try it below.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="3"
          title="Two conditions, not one"
          source={{ kind: 'schematic', note: 'Lemma 1' }}
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
    </Section>
  );
}
