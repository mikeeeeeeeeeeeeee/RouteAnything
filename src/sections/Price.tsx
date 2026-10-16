import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { PrimalDual } from '@/components/viz/PrimalDual';
import { BarList } from '@/components/viz/BarList';
import { PRICES } from '@/data/results';

export function Price() {
  return (
    <Section
      id="price"
      n="2"
      kicker={
        <>
          <span>Theorem 2</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Efficiency-optimal routing with a quality floor</span>
        </>
      }
      title="The reference and the tolerance fix the price."
      lede="Maximising a ratio under a floor looks like a new kind of problem. It is not: the constrained optimum maximises value minus cost at one price, and the reference and the tolerance, not a hand-picked budget, choose that price."
    >
      <Prose>
        <p>
          Let the state <Sym k="x" children="x" /> take finitely many values with router-independent probabilities{' '}
          <M>{'\\pi(x)>0'}</M>. Each state has a finite menu <M>{'\\mathcal U(x)'}</M> of actions (single calls, portfolios, whole continuation
          plans) with expected value <M>{'v(x,u)'}</M> and cost <M>{'c(x,u)>0'}</M>, and a router plays <M>{'u'}</M> with probability{' '}
          <M>{'g(u\\mid x)'}</M>. The best a router can do at a price <Sym k="lambda" /> is
        </p>
        <MathBlock>{`${s('Phi')}=\\sum_x \\pi(x)\\max_{u\\in\\mathcal U(x)}\\big[v(x,u)-\\lambda\\,c(x,u)\\big].`}</MathBlock>
      </Prose>

      <div className="mt-8 md:ml-[190px]">
        <Statement
          kind="Theorem"
          n="2"
          name="Efficiency-optimal routing with a quality floor"
          source="Paper §2 · proof in App. A.2"
          main
          proof={
            <>
              For any router, <M>{'\\eta(g)\\ge\\lambda'}</M> exactly when <M>{'\\mathbb E_g[V]-\\lambda\\,\\mathbb E_g[D]\\ge 0'}</M>, so the
              best efficiency is the price at which the best net value <M>{'\\Phi'}</M> reaches zero (Dinkelbach). <M>{'\\Phi'}</M> is a maximum
              of finitely many lines, hence convex and piecewise linear, and the iteration is Newton&rsquo;s method on it, which ends at a root
              after finitely many breakpoints. Under the floor, the Charnes–Cooper change of variables turns the ratio program into a linear
              program over state-action frequencies with one extra constraint; a basic optimal solution randomises in at most one state, and
              the floor&rsquo;s dual variable is the multiplier <M>{'\\kappa'}</M>.
            </>
          }
        >
          <p>
            <span className="mr-2 font-display text-[19px] italic text-accent">(i)</span>
            <M>{'\\Phi'}</M> is convex and strictly decreasing, with unique root <M>{`${s('etaStar')}=\\max_g\\eta(g)`}</M>. A router is optimal
            if and only if it uses only actions maximising <M>{'v(x,u)-\\eta^\\star c(x,u)'}</M> in every state.
          </p>
          <p className="mt-3">
            <span className="mr-2 font-display text-[19px] italic text-accent">(ii)</span>
            The iteration <M>{'\\lambda_0=\\eta_B'}</M>, <M>{'\\lambda_{t+1}=\\eta(g_t)'}</M>, with <M>{'g_t'}</M> a deterministic maximiser of{' '}
            <M>{'J_{\\lambda_t}'}</M>, reaches <M>{'\\eta^\\star'}</M> in finitely many steps, monotonically if the reference policy is admissible.
            Its first step satisfies <M>{'\\Phi(\\eta_B)=\\max_g\\,[\\,Q_g+\\eta_B\\mathcal S_g\\,]'}</M>.
          </p>
          <p className="mt-3">
            <span className="mr-2 font-display text-[19px] italic text-accent">(iii)</span>
            If the reference is admissible, then under <M>{'\\mathbb E_g[V]\\ge\\bar v-\\epsilon'}</M> an optimal router exists that randomises in
            at most one state. A multiplier <M>{`${s('kappa')}\\ge 0`}</M> exists such that every optimal router uses only actions maximising{' '}
            <M>{'(1+\\kappa)\\,v(x,u)-\\eta^\\star_\\epsilon c(x,u)'}</M>, where <M>{'\\eta^\\star_\\epsilon'}</M> is the constrained optimum.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          The key consequence is part (iii). When the floor binds, the constrained optimum is an ordinary <M>{'J_\\lambda'}</M> optimum at
        </p>
        <MathBlock>{`${s('lambdaEps')}=\\frac{\\eta^\\star_\\epsilon}{1+\\kappa},`}</MathBlock>
        <p>
          hence also the budget optimum at its own cost. The ratio objective adds no new point to the frontier. What it does is let the
          reference and the tolerance, rather than a chosen price or budget, select the operating point. Drag the tolerance and watch both
          views agree.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="4"
          title="One operating point, read two ways"
          source={{ kind: 'schematic', note: 'one state, six actions' }}
          caption={
            <>
              Left: the floor <M>{'v\\ge\\bar v-\\epsilon'}</M> meets the frontier at the optimum; its efficiency{' '}
              <M>{'\\eta^\\star_\\epsilon'}</M> is the slope of the blue ray, and its price <M>{'\\lambda_\\epsilon'}</M> is the slope of the
              frontier there (dashed). Right: the same actions as lines. <M>{'\\lambda_\\epsilon'}</M> is a breakpoint of <M>{'\\Phi'}</M>,
              where the two mixed actions tie, and <M>{'\\eta^\\star_\\epsilon'}</M> is where the mixed router&rsquo;s own line crosses zero.
              Hover any action to find it in both panels.
            </>
          }
        >
          <PrimalDual />
        </Plate>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-8 md:ml-[190px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[22px] border border-rule bg-surface p-6 shadow-[var(--shadow)]">
          <div className="smallcaps text-[10.5px] text-accent">On CodeRouterBench · 21 probing cells · zero-loss floor</div>
          <p className="mt-3 font-serif text-[16px] leading-[1.7] text-ink-2">
            The zero-loss policy has multiplier <M>{`\\kappa=${PRICES.crb.kappa}`}</M> and constrained optimum{' '}
            <M>{`\\eta^\\star_\\epsilon=${PRICES.crb.etaStarEps}`}</M> score per dollar, so
          </p>
          <MathBlock compact>{'\\lambda_\\epsilon=\\frac{927.7}{1+5.43}=144.3=4.16\\,\\eta_B.'}</MathBlock>
          <p className="font-serif text-[16px] leading-[1.7] text-ink-2">
            As the theorem predicts, it attains <M>{'\\max_g J_{\\lambda_\\epsilon}'}</M> exactly, equals the budget-constrained quality
            maximiser at its own cost (budget dual 144.3), and equals the minimum-cost policy that meets the floor.
          </p>
        </div>
        <div className="rounded-[22px] border border-rule bg-surface p-6 shadow-[var(--shadow)]">
          <div className="smallcaps text-[10.5px] text-accent">Hand-picked operating points land elsewhere</div>
          <p className="mt-3 font-serif text-[15px] leading-[1.6] text-ink-3">Test-set dollar efficiency against always-Opus, same 21-cell menu.</p>
          <BarList
            className="mt-5"
            labelWidth={150}
            max={34}
            rows={[
              { key: 'floor', label: <span>Floor price <M>{'\\lambda_\\epsilon'}</M></span>, value: 25.52, display: '25.52×', color: 'var(--blue)', emphasis: true, note: 'zero-loss floor, ΔV = −0.0044' },
              { key: 'etaB', label: <span>Price <M>{'\\lambda=\\eta_B'}</M></span>, value: PRICES.handPicked.atEtaB, display: `${PRICES.handPicked.atEtaB}×`, color: 'var(--slate)' },
              { key: 'budget', label: 'Budget = Opus cost', value: PRICES.handPicked.budgetOpus, display: `${PRICES.handPicked.budgetOpus}×`, color: 'var(--slate)' },
            ]}
            ticks={[0, 10, 20]}
            tickFormat={(v) => `${v}×`}
          />
        </div>
      </div>
    </Section>
  );
}
