import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Statement } from '@/components/ui/Statement';
import { MathBlock } from '@/components/math/MathBlock';
import { Sym, s } from '@/components/math/Sym';
import { M } from '@/components/math/M';
import { PriceRuler } from '@/components/viz/PriceRuler';
import { PolicyForest } from '@/components/viz/PolicyForest';

export function Reference() {
  return (
    <Section
      id="reference"
      n="4"
      kicker={
        <>
          <span>Proposition 4</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">The reference as yardstick and as input</span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3">Finding 1</span>
        </>
      }
      title="Price structure, not the ratio, decides escalation."
      lede="The reference plays two roles. It is the yardstick that defines Q and the floor, and it is an input that cascades buy on the tasks they reject. Whether it is worth buying depends on prices, not on the objective."
    >
      <div className="md:ml-[190px]">
        <Statement
          kind="Proposition"
          n="4"
          name="The reference as yardstick and as input"
          source="Paper §2 · full statement in App. A.4"
          proof={
            <>
              On the tasks a cascade sends to the reference, the extra value is <M>{'Y_B-Y_P'}</M> and the extra cost is at least{' '}
              <M>{'C_B'}</M>, because the primary is paid either way. Against direct dispatch to the same primary, the cascade therefore
              wins at price <M>{'\\lambda'}</M> only if <M>{'\\lambda\\le\\mu_x(u)'}</M>, which gives (a). For (b), above the admission price no
              reference-calling action is a <M>{'J_\\lambda'}</M> maximiser, and by Theorem 2(iii) every floor optimum is one at{' '}
              <M>{'\\lambda_\\epsilon'}</M>; if <M>{'\\lambda_\\epsilon'}</M> lies above <M>{'\\lambda^B'}</M> the optimum is reference-free.
            </>
          }
        >
          <p>
            Suppose every state offers an action that never calls the reference; a router is <em>reference-free</em> if it plays only such
            actions.
          </p>
          <p className="mt-3">
            <span className="mr-2 font-display text-[19px] italic text-accent">(a)</span>
            An action that calls the reference on an event <M>{'R_u'}</M> maximises <M>{'v-\\lambda c'}</M> only for <M>{'\\lambda'}</M> in a
            closed, possibly empty interval. For a cascade with any verifier, cost <M>{'A\\ge C_P'}</M>, and direct dispatch to its primary on
            the menu, a nonempty interval satisfies
          </p>
          <MathBlock compact>{`\\sup\\Lambda_x(u)\\ \\le\\ \\mu_x(u)=\\frac{\\mathbb E[(Y_B-Y_P)\\mathbf 1_{R_u}\\mid x]}{\\mathbb E[C_B\\mathbf 1_{R_u}\\mid x]}\\ \\le\\ \\frac{\\mathbb E[Y_B\\mid R_u,x]}{\\mathbb E[C_B\\mid R_u,x]}.`}</MathBlock>
          <p>
            <span className="mr-2 font-display text-[19px] italic text-accent">(b)</span>
            Let the <em>admission price</em> <M>{`${s('lambdaB')}`}</M> be the largest of 0 and these suprema, and suppose{' '}
            <M>{'\\lambda^B<\\eta^\\star'}</M>. Let <M>{`${s('deltaB')}`}</M> be the quality change of the <M>{'J_\\lambda'}</M>-maximisers just
            above <M>{'\\lambda^B'}</M>, and <M>{'\\delta^{\\rm free}\\ge\\delta^B'}</M> the largest quality change of a reference-free router.
            Then the ratio optimum, and for <M>{'\\epsilon>-\\delta^B'}</M> every floor optimum, is reference-free; whereas for{' '}
            <M>{'\\epsilon<-\\delta^{\\rm free}'}</M> every router meeting the floor calls the reference.
          </p>
        </Statement>
      </div>

      <Prose className="mt-12">
        <p>
          In words: a cascade&rsquo;s fallback dollar earns at most what the reference earns on the tasks it receives, which caps the price at
          which the reference can be bought. If this admission price lies below the price the floor sets, the reference is{' '}
          <strong>redundant</strong>. If the floor asks for more than any reference-free router can deliver, it is{' '}
          <strong>indispensable</strong>. The two benchmarks land on opposite sides.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="7"
          title="Admission price against floor price"
          source={{ kind: 'data', ref: 'Finding 1 · App. B.2' }}
          caption={
            <>
              Shaded: prices at which some reference-calling action can still be optimal (<M>{'\\lambda\\le\\lambda^B'}</M>). On
              CodeRouterBench&rsquo;s 21 probing cells, <M>{'\\lambda^B=100'}</M> score per dollar (2.9<M>{'\\,\\eta_B'}</M>) lies below the
              zero-loss floor price 144 and far below <M>{'\\eta^\\star=1022'}</M>, so every fitted floor asking less than{' '}
              <M>{'\\delta^B=+0.056'}</M> over Opus is reference-free. On RouterBench no reference-free router comes within 0.097 of
              gpt-4-1106-preview, so the zero-loss policy cascades cheap primaries to it.
            </>
          }
        >
          <PriceRuler />
        </Plate>
      </div>

      <Prose className="mt-16">
        <p>
          <strong>Finding 1.</strong> With states, the dollar-optimal CodeRouterBench policies dispatch to a non-Opus model on every task,
          for both partitions and every fitted floor. The 21-cell unconstrained policy reaches 28.19× Opus&rsquo;s efficiency but loses 0.0201
          mean score; the zero-loss floor gives <strong>25.52× at −0.0044</strong>, whereas the best fixed cascade gains 0.0558 at only 2.00×.
          Without states, every zero-loss policy calls Opus, which then runs on 28.7% of tasks.
        </p>
      </Prose>

      <div className="mt-10 md:ml-[190px]">
        <Plate
          fig="8"
          title="Efficiency, cost and quality favour different policies"
          source={{ kind: 'data', ref: 'Fig. 3 · Table 3' }}
          caption={
            <>
              The 2,919-task CodeRouterBench test set, with fixed-policy paired 95% intervals; dashed lines mark always-Opus (0.4383 at
              11.655 m$ per task). Floors are fitted on probing. Teal rows use no oracle cell labels: cells predicted from the prompt
              (92.9% accuracy), and a direct quality–cost router at its probing zero-loss point. The per-task oracle is an in-sample ceiling.
            </>
          }
        >
          <PolicyForest />
        </Plate>
      </div>

      <Prose className="mt-12">
        <p>
          States add 27% over fixed Qwen3-Max dispatch (20.10× at −0.0416) and recover its loss. Learned quality–cost routers and a{' '}
          <M>{'k'}</M>NN router reach 22.7–24.2× at their zero-loss points, within 0.006 score of the cell-policy frontier at matched cost: the
          floor selects an operating point rather than a better frontier. The multiplier depends on the yardstick: against a per-cell
          best-model yardstick, which scores 0.083 above Opus, the refitted zero-loss policy gives 3.18×.
        </p>
      </Prose>
    </Section>
  );
}
