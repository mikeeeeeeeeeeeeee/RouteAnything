import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { PrimalDual } from '@/components/viz/PrimalDual';
import { DinkelbachFigure } from '@/components/viz/DinkelbachFigure';
import { BarList } from '@/components/viz/BarList';
import { PRICES } from '@/data/results';

export function Optimal() {
  return (
    <Section
      id="optimal"
      n="2"
      kicker={
        <>
          <span>Theorem 2</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Optimal routing at a price and under a floor</span>
        </>
      }
      title="Play the arm with the highest value minus priced cost."
      lede="Maximising efficiency under a quality floor looks like a new kind of problem. It is not: it is routing at one price, and the reference and the tolerance, not a hand-picked price or budget, set that price."
    >
      <Prose>
        <p>
          Let the state take finitely many values, each with probability <M>{'\\pi(s)>0'}</M>, let the menu depend on the input only through
          the state, and let costs be positive. At a price <M>{'\\lambda'}</M>, the best any router can do is
        </p>
        <MathBlock>{`${s('Phi')}=\\sum_s \\pi(s)\\max_{u}\\big[v(s,u)-\\lambda\\,c(s,u)\\big].`}</MathBlock>
      </Prose>

      <div className="mt-8 md:ml-[190px]">
        <Statement
          kind="Theorem"
          n="2"
          name="Optimal routing at a price and under a floor"
          source="Paper §2 · proof in App. A.2"
          main
          proof={
            <>
              For any router, <M>{'\\mathbb E_g[V-\\lambda D]=\\mathbb E_g[D]\\,(\\eta(g)-\\lambda)'}</M>, so <M>{'\\Phi(\\lambda)\\ge 0'}</M>{' '}
              exactly when some router reaches efficiency <M>{'\\lambda'}</M> (Dinkelbach). Each state contributes a maximum of finitely many
              lines with negative slopes, so <M>{'\\Phi'}</M> is convex, piecewise linear and strictly decreasing, and its unique root is the
              highest efficiency. State by state, a linear objective is maximised exactly by routers that put all their mass on its maximisers.
              Under the floor, the problem at the constrained optimum <M>{'\\eta^\\star_\\epsilon'}</M> is a linear program with one extra
              constraint; strong duality supplies the multiplier <M>{'\\kappa'}</M>, and every constrained optimum maximises{' '}
              <M>{'(1+\\kappa)\\,v-\\eta^\\star_\\epsilon c'}</M>, which is <M>{'J_\\lambda'}</M> at <M>{'\\lambda_\\epsilon'}</M>.
            </>
          }
        >
          <p>
            <span className="mr-2 font-display text-[19px] italic text-accent">(i)</span>A router maximises <M>{'J_\\lambda'}</M> if and only
            if, in every state, it plays only arms maximising <M>{'v(s,u)-\\lambda c(s,u)'}</M>. The highest efficiency{' '}
            <M>{`${s('etaStar')}=\\max_g\\eta(g)`}</M> is the unique root of <M>{'\\Phi'}</M>, and the efficiency-optimal routers are exactly the
            maximisers of <M>{'J_{\\eta^\\star}'}</M>.
          </p>
          <p className="mt-3">
            <span className="mr-2 font-display text-[19px] italic text-accent">(ii)</span>If the reference is itself a router and{' '}
            <M>{'\\epsilon\\ge0'}</M>, an efficiency-optimal router under the floor <M>{'Q\\ge-\\epsilon'}</M> exists, and for some{' '}
            <M>{`${s('kappa')}\\ge 0`}</M> every such router maximises <M>{'J_\\lambda'}</M> at
          </p>
          <MathBlock compact>{`${s('lambdaEps')}=\\frac{\\eta^\\star_\\epsilon}{1+\\kappa},`}</MathBlock>
          <p>
            where <M>{'\\eta^\\star_\\epsilon'}</M> is the constrained optimum.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          Part (ii) says that maximising efficiency under a floor yields no new kind of router: it is routing at one price, set by the
          reference and the tolerance rather than by hand or by a budget. Without recorded costs, the rule is simply to play the arm with the
          highest expected value given the state. Dinkelbach&rsquo;s method, which the proof uses, turns the search for{' '}
          <M>{'\\eta^\\star'}</M> into a walk down the upper envelope of lines.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="4"
          title="Every arm is a line; Dinkelbach walks down the envelope"
          source={{ kind: 'schematic', note: 'one state, six arms' }}
          caption={
            <>
              At price <M>{'\\lambda'}</M>, arm <M>{'u'}</M> is worth <M>{'v-\\lambda c'}</M>, a line. A router takes the highest line, so the
              best it can do is the upper envelope <M>{'\\Phi(\\lambda)'}</M>: convex, strictly decreasing, and zero exactly at the highest
              efficiency <M>{'\\eta^\\star'}</M>. Dinkelbach&rsquo;s method starts at the reference&rsquo;s efficiency <M>{'\\eta_B'}</M>, takes
              the best line there, and jumps to that line&rsquo;s own efficiency, reaching <M>{'\\eta^\\star'}</M> in finitely many steps. Sweep
              the figure to scan the price.
            </>
          }
        >
          <DinkelbachFigure />
        </Plate>
      </div>

      <Prose className="mt-12">
        <p>
          When the floor binds, the constrained optimum is an ordinary <M>{'J_\\lambda'}</M> optimum at <M>{'\\lambda_\\epsilon'}</M>, hence
          also the quality maximiser at its own budget. The ratio objective adds no new point to the frontier; what it does is let the
          reference and the tolerance, rather than a chosen price or budget, select the operating point. Drag the tolerance and watch both
          views agree.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="5"
          title="One operating point, read two ways"
          source={{ kind: 'schematic', note: 'one state, six arms' }}
          caption={
            <>
              Left: the floor <M>{'v\\ge\\bar v-\\epsilon'}</M> meets the frontier at the optimum; its efficiency{' '}
              <M>{'\\eta^\\star_\\epsilon'}</M> is the slope of the blue ray, and its price <M>{'\\lambda_\\epsilon'}</M> is the slope of the
              frontier there (dashed). Right: the same arms as lines. <M>{'\\lambda_\\epsilon'}</M> is a breakpoint of <M>{'\\Phi'}</M>, where
              the two mixed arms tie, and <M>{'\\eta^\\star_\\epsilon'}</M> is where the mixed router&rsquo;s own line crosses zero. Hover any
              arm to find it in both panels.
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
            It maximises <M>{'J_{\\lambda_\\epsilon}'}</M>, as Theorem 2(ii) predicts, and is therefore also the quality maximiser at its own
            budget and, since <M>{'\\kappa>0'}</M>, the cheapest policy that meets the floor.
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
