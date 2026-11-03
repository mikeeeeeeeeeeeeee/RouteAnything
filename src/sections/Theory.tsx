import { useState } from 'react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { Gather, Stack } from '@/components/ui/Gather';
import { Fold } from '@/components/ui/Fold';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { QSPlane } from '@/components/viz/QSPlane';
import { DinkelbachFigure } from '@/components/viz/DinkelbachFigure';
import { PrimalDual } from '@/components/viz/PrimalDual';
import { HeadroomLadder } from '@/components/viz/HeadroomLadder';
import { WinnerTrap } from '@/components/viz/WinnerTrap';
import { CertificationRun } from '@/components/viz/CertificationRun';
import { useTokens } from '@/theme/tokens';
import { useNarrow } from '@/lib/hooks';

const tag = (t: string) => <span className="mr-2 font-display text-[19px] italic text-accent">{t}</span>;

export function Theory() {
  const narrow = useNarrow();
  const q = `${s('Q')}=\\mathbb E[V_g-Y_B]`;
  const sv = `${s('S')}=\\mathbb E[C_B-D_g]`;
  const eff = `${s('eta')}=\\frac{\\mathbb E[V_g]}{\\mathbb E[D_g]}`;
  const effB = `${s('etaB')}=\\frac{\\mathbb E[Y_B]}{\\mathbb E[C_B]}`;
  const floor = `Q\\ge-${s('eps')}`;
  const eq1 = narrow
    ? `\\begin{gathered}${q},\\quad ${floor},\\\\[3pt] ${sv},\\\\[3pt] ${eff},\\quad ${effB}.\\end{gathered}`
    : `\\begin{gathered}${q},\\qquad ${sv},\\qquad ${floor},\\\\[4pt] ${eff},\\qquad ${effB}.\\end{gathered}`;
  return (
    <Section
      id="theory"
      n="2"
      kicker={
        <>
          <span>A router&rsquo;s value</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Lemma 1, Theorem 2, Propositions 3–5</span>
        </>
      }
      title="Play the candidate with the highest value minus priced cost."
      lede="A router observes a state and plays a candidate. At a resource price the best router does this in every state, and when no price is given, a reference policy with a quality tolerance fixes it."
    >
      <Prose>
        <p>
          Against a named reference with value <Sym k="YB" children="Y_B" /> and cost <Sym k="YB" children="C_B" /> on the same inputs, a router{' '}
          <Sym k="g" /> has a quality change, a saving and an efficiency, and a floor it must keep:
        </p>
        <MathBlock n="1">{eq1}</MathBlock>
        <Fold label="Candidates, states and prices">
          <p>
            An input <Sym k="x" /> comes with a finite menu <M>{'\\mathcal U(x)'}</M> of <em>candidates</em> <Sym k="u" />: language models,
            image, video or speech generators, robot policies, or execution plans such as &ldquo;try a cheap model, verify, and escalate on
            rejection&rdquo;. Running candidate <M>{'u'}</M> delivers a value <Sym k="V" children="V_u\in[0,1]" />, the benchmark&rsquo;s
            metric, and consumes <Sym k="D" children="D_u>0" /> units of one resource, such as dollars or seconds. A router observes a{' '}
            <em>state</em> <Sym k="s" children="s=\sigma(x)" />, which may be the benchmark, a capability type, or the input itself, and chooses
            a candidate <M>{'g(s)'}</M>, possibly at random. Write <M>{'v(s,u)=\\mathbb E[V_u\\mid s]'}</M> and{' '}
            <M>{'c(s,u)=\\mathbb E[D_u\\mid s]'}</M>. Routing does not change which inputs arrive, so the law <M>{'\\pi'}</M> of states is fixed;
            sequential choices within a task enter as complete plans.
          </p>
          <p>
            At a resource price <Sym k="lambda" children="\lambda\ge0" />, router <M>{'g'}</M> earns{' '}
            <M>{'J_\\lambda(g)=\\mathbb E[V_g]-\\lambda\\,\\mathbb E[D_g]'}</M>; at <M>{'\\lambda=0'}</M> it is ranked by quality alone. When no
            price is given, it is compared with a named reference policy, such as always calling the strongest model, by Eq. (1).
          </p>
        </Fold>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Gather
          ariaLabel="Formal results"
          items={[
            { key: 'lemma1', tag: 'Lemma 1', label: 'Reference-relative gain', content: <Lemma1 /> },
            { key: 'thm2', tag: 'Theorem 2', label: 'Optimal routing', content: <Theorem2 /> },
            { key: 'prop3', tag: 'Proposition 3', label: 'Headroom ladder', content: <Prop3 /> },
            { key: 'prop4', tag: 'Proposition 4', label: 'Outcomes, not winners', content: <Prop4 /> },
            { key: 'prop5', tag: 'Proposition 5', label: 'Certified floor', content: <Prop5 /> },
          ]}
        />
      </div>
    </Section>
  );
}

function Lemma1() {
  return (
    <div className="space-y-6">
      <Statement
        compact
        kind="Lemma"
        n="1"
        name="Reference-relative gain"
        source="Paper §2 · proof in App. A.1"
        proof={
          <>
            Write <M>{'\\bar v=\\mathbb E[Y_B]'}</M> and <M>{'\\bar c=\\mathbb E[C_B]'}</M>. The definitions give <M>{'\\mathbb E[V]=\\bar v+Q'}</M>{' '}
            and <M>{'\\mathbb E[D]=\\bar c-\\mathcal S'}</M>, so{' '}
            <M>{'\\eta-\\eta_B=(\\bar v+Q)/(\\bar c-\\mathcal S)-\\bar v/\\bar c=(Q+\\eta_B\\mathcal S)/(\\bar c-\\mathcal S)'}</M>, whose denominator{' '}
            <M>{'\\mathbb E[D]'}</M> is positive. No independence or stationarity is needed; the floor is a statement about <M>{'Q'}</M> alone.
          </>
        }
      >
        <MathBlock compact>{`\\eta-\\eta_B=\\frac{${s('Q')}+\\eta_B\\,${s('S')}}{\\mathbb E[D_g]}.`}</MathBlock>
        <p>
          Efficiency improves if and only if <M>{'Q+\\eta_B\\mathcal S>0'}</M>, and the quality floor is the separate condition{' '}
          <M>{'Q\\ge-\\epsilon'}</M>. Both are needed: a primary that is correct on 15% of tasks at a tenth of the cost of an always-correct
          reference has <M>{'\\eta=1.5\\,\\eta_B'}</M> but <M>{'Q=-0.85'}</M>.
        </p>
      </Statement>
      <Plate
        fig="2.1"
        title="Two conditions, not one"
        source={{ kind: 'schematic', note: 'Lemma 1' }}
        caption={
          <>
            Drag the point. Lines of equal efficiency meet where nothing is delivered and nothing is spent; the diagonal{' '}
            <M>{'Q+\\eta_B\\mathcal S=0'}</M> separates gains from losses, and the dashed floor <M>{'Q=-\\epsilon'}</M> is a second, independent cut.
          </>
        }
      >
        <QSPlane />
      </Plate>
    </div>
  );
}

function Theorem2() {
  const tk = useTokens();
  const [view, setView] = useState<'price' | 'floor'>('price');
  return (
    <div className="space-y-6">
      <Statement
        compact
        main
        kind="Theorem"
        n="2"
        name="Optimal routing at a price and under a floor"
        source="Paper §2 · proof in App. A.2"
        proof={
          <>
            For any router, <M>{'\\mathbb E_g[V-\\lambda D]=\\mathbb E_g[D]\\,(\\eta(g)-\\lambda)'}</M>, so <M>{'\\Phi(\\lambda)\\ge 0'}</M> exactly
            when some router reaches efficiency <M>{'\\lambda'}</M> (Dinkelbach). Each state contributes a maximum of finitely many lines with
            negative slopes, so <M>{'\\Phi'}</M> is convex, piecewise linear and strictly decreasing, and its unique root is the highest
            efficiency. Under the floor, the problem at <M>{'\\eta^\\star_\\epsilon'}</M> is a linear program with one extra constraint; strong
            duality supplies <M>{'\\kappa'}</M>, and every constrained optimum maximizes <M>{'(1+\\kappa)\\,v-\\eta^\\star_\\epsilon c'}</M>.
          </>
        }
      >
        <p>
          {tag('(i)')}A router maximizes <M>{'J_\\lambda'}</M> if and only if, in every state, it plays only candidates maximizing{' '}
          <M>{'v(s,u)-\\lambda c(s,u)'}</M>. The highest efficiency <M>{`${s('etaStar')}=\\max_g\\eta(g)`}</M> is the unique root of{' '}
          <M>{`${s('Phi')}=\\sum_s\\pi(s)\\max_u[v(s,u)-\\lambda c(s,u)]`}</M>, and the efficiency-optimal routers are exactly the maximizers of{' '}
          <M>{'J_{\\eta^\\star}'}</M>.
        </p>
        <p className="mt-3">
          {tag('(ii)')}If the reference is itself a router and <M>{'\\epsilon\\ge0'}</M>, an efficiency-optimal router under the floor{' '}
          <M>{'Q\\ge-\\epsilon'}</M> exists, and for some <M>{`${s('kappa')}\\ge 0`}</M> every such router maximizes <M>{'J_\\lambda'}</M> at{' '}
          <M>{`${s('lambdaEps')}=\\eta^\\star_\\epsilon/(1+\\kappa)`}</M>, where <M>{'\\eta^\\star_\\epsilon'}</M> is the constrained optimum.
        </p>
      </Statement>
      <Plate
        fig="2.2"
        title={view === 'price' ? 'Every candidate is a line; Dinkelbach walks down the envelope' : 'Under a floor: one operating point, read two ways'}
        source={{ kind: 'schematic', note: 'one state, six candidates' }}
        controls={
          <RubberSegment
            items={[
              { value: 'price', label: 'At a price' },
              { value: 'floor', label: 'Under a floor' },
            ]}
            value={view}
            onChange={(v) => setView(v as 'price' | 'floor')}
            trackColor={tk.surface2}
            thumbColor={tk.ink}
            textColor={tk.ink2}
            activeTextColor={tk.bg}
            size="sm"
            className="font-sans"
            aria-label="Theorem 2 view"
          />
        }
        caption={
          view === 'price' ? (
            <>
              At price <M>{'\\lambda'}</M>, candidate <M>{'u'}</M> is worth <M>{'v-\\lambda c'}</M>, a line; the best a router can do is the upper
              envelope <M>{'\\Phi(\\lambda)'}</M>, zero exactly at <M>{'\\eta^\\star'}</M>. Sweep the figure to scan the price.
            </>
          ) : (
            <>
              Drag the tolerance. The constrained optimum is a <M>{'J_\\lambda'}</M> maximizer at <M>{'\\lambda_\\epsilon'}</M>, the slope of the
              frontier where the floor meets it; hover any candidate to find it in both panels.
            </>
          )
        }
      >
        <Stack
          active={view}
          views={[
            { key: 'price', node: <DinkelbachFigure /> },
            { key: 'floor', node: <PrimalDual /> },
          ]}
        />
      </Plate>
    </div>
  );
}

function Prop3() {
  const narrow = useNarrow();
  const ladder = narrow
    ? 'V^\\star(\\sigma_1)\\le V^\\star(\\sigma_2)\\le V^\\star(x)\\\\ \\le\\mathbb E\\big[\\max_u W_u\\big].'
    : 'V^\\star(\\sigma_1)\\ \\le\\ V^\\star(\\sigma_2)\\ \\le\\ V^\\star(x)\\ \\le\\ \\mathbb E\\big[\\max_u W_u\\big].';
  return (
    <div className="space-y-6">
      <Statement
        compact
        kind="Proposition"
        n="3"
        name="Headroom ladder"
        source="Paper §2 · proof in App. A.3"
        proof={
          <>
            By the tower property, <M>{'\\mathbb E[W_u\\mid S_1]=\\mathbb E\\big[\\mathbb E[W_u\\mid S_2]\\mid S_1\\big]'}</M>, which is at most the
            conditional mean of <M>{"\\max_{u'}\\mathbb E[W_{u'}\\mid S_2]"}</M>; maximizing over <M>{'u'}</M> and taking expectations gives the
            first inequality. The last holds because <M>{"W_u\\le\\max_{u'}W_{u'}"}</M> for every candidate, input by input.
          </>
        }
      >
        <p>
          With <Sym k="W" children="W_u=V_u-\lambda D_u" /> and <Sym k="Vstar" /> the best return of a router that observes{' '}
          <M>{'\\sigma(x)'}</M>: if <M>{'\\sigma_1'}</M> is coarser than <M>{'\\sigma_2'}</M> and the menu depends on <M>{'x'}</M> only through{' '}
          <M>{'\\sigma_1(x)'}</M>, then
        </p>
        <MathBlock n="2" compact>{narrow ? `\\begin{gathered}${ladder}\\end{gathered}` : ladder}</MathBlock>
        <p>
          The first inequality is an equality if and only if a single candidate is optimal at almost every finer state; the last gap vanishes if
          and only if, given almost every <M>{'x'}</M>, one candidate attains <M>{'\\max_u W_u'}</M> almost surely.
        </p>
      </Statement>
      <Plate
        fig="2.3"
        title="The ladder, measured"
        source={{ kind: 'data', ref: '§3 · Tables 1–2' }}
        caption={
          <>
            Each panel stays within one set of test inputs. Dashed rungs are lookups chosen in hindsight, an optimistic estimate; the band under
            the oracle is <M>{'V^\\star(x)'}</M>, which no experiment measures.
          </>
        }
      >
        <HeadroomLadder />
      </Plate>
    </div>
  );
}

function Prop4() {
  return (
    <div className="space-y-6">
      <Statement
        compact
        kind="Proposition"
        n="4"
        name="Outcomes, not winners"
        source="Paper §2 · proof in App. A.4"
        proof={
          <>
            (a) For a fixed input, the expected cross-entropy <M>{'-\\mu\\log m-(1-\\mu)\\log(1-m)'}</M> is strictly convex in the score <M>{'m'}</M>{' '}
            and minimized at <M>{'m=\\mu=\\mathbb E[V_u\\mid x]'}</M>, as is the squared error. (b) Since <M>{'\\tfrac12<b<a<1'}</M>, candidate{' '}
            <M>{'B'}</M> beats <M>{'A'}</M> exactly when it delivers 1, so the winner label favors <M>{'B'}</M>, whose expected value{' '}
            <M>{'b'}</M> is below <M>{'a'}</M>.
          </>
        }
      >
        <p>
          {tag('(a)')}The score that minimizes cross-entropy, or squared error, against each candidate&rsquo;s outcome is{' '}
          <M>{'m_u(x)=\\mathbb E[V_u\\mid x]'}</M>, and routing to <M>{'\\arg\\max_u m_u(x)'}</M> attains <M>{'V^\\star(x)'}</M> at{' '}
          <M>{'\\lambda=0'}</M>.
        </p>
        <p className="mt-3">
          {tag('(b)')}Routing to the most likely winner, <M>{'\\arg\\max_u p_u(x)'}</M>, can lose almost half of the value range: if candidate{' '}
          <M>{'A'}</M> always delivers <M>{'a<1'}</M> and candidate <M>{'B'}</M> delivers 1 with probability <M>{'b\\in(\\tfrac12,a)'}</M>, then{' '}
          <M>{'p_B=b>p_A'}</M> while <M>{'\\mathbb E[V_B]=b<a'}</M>.
        </p>
      </Statement>
      <Plate
        fig="2.4"
        title="The winner label points at the wrong candidate"
        source={{ kind: 'schematic', note: 'Proposition 4(b)' }}
        caption={
          <>
            Move <M>{'a'}</M> and <M>{'b'}</M>: winner labels pick <M>{'B'}</M>, outcome regression picks <M>{'A'}</M>. Below, ties sent to a faster
            candidate: the one that succeeds nine times in ten collects fewer than half of the labels.
          </>
        }
      >
        <WinnerTrap />
      </Plate>
    </div>
  );
}

function Prop5() {
  return (
    <div className="space-y-6">
      <Statement
        compact
        kind="Proposition"
        n="5"
        name="Certified quality floor"
        source="Paper §2 · proof in App. A.5"
        proof={
          <>
            Condition on the fitting data, which fixes the routers, their order and their true quality changes. If the selected router breaks the
            floor, the first violating router in the order was tested and passed, which happens with probability at most <M>{'\\alpha'}</M>. The
            reference never breaks the floor. This is fixed-sequence testing, so no multiplicity correction is needed.
          </>
        }
      >
        <p>
          Let the routers <M>{'g_1,\\dots,g_K'}</M> and their order be fixed by the fitting data, and let <Sym k="pk" /> be valid p-values for{' '}
          <M>{'Q_{g_k}<-\\epsilon'}</M> on <M>{'n'}</M> fresh inputs with matched outcomes, for instance{' '}
          <M>{'p_k=\\exp\\{-n(\\hat Q_k+\\epsilon)_+^2/2\\}'}</M>. With <M>{'\\hat k=\\max\\{k:\\,p_1,\\dots,p_k\\le\\alpha\\}'}</M>, or the
          reference if <M>{'p_1>\\alpha'}</M>,
        </p>
        <MathBlock compact>{`\\mathbb P\\big(Q_{g_{\\hat k}}<-\\epsilon\\big)\\le${s('alpha')}.`}</MathBlock>
      </Statement>
      <Plate
        fig="2.5"
        title="Test in order, stop at the first failure"
        source={{ kind: 'schematic', note: 'simulated p-values' }}
        caption={
          <>
            Routers on the price path, tested in order on a fresh sample <M>{'\\mathcal B'}</M>. Draw new samples: the certified router moves,
            but it almost never breaks the floor.
          </>
        }
      >
        <CertificationRun />
      </Plate>
    </div>
  );
}
