import { useState } from 'react';
import { useNarrow } from '@/lib/hooks';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import teaser from '@/assets/paper/fig1-teaser.webp';
import { Section, Prose } from '@/components/ui/Section';
import { Plate } from '@/components/ui/Plate';
import { Stack } from '@/components/ui/Gather';
import { Fold } from '@/components/ui/Fold';
import { OmniRouter } from '@/components/viz/OmniRouter';
import { ExecutionPlans } from '@/components/viz/ExecutionPlans';
import { abstract } from '@/data/paper';
import { useTokens } from '@/theme/tokens';

type View = 'live' | 'plans' | 'paper';

const CAPTIONS: Record<View, string> = {
  live: 'For each input, the router picks one candidate from the pool for its output type, scoring candidates by value minus priced cost. Each moving segment is an input; hover an input for its benchmarks, or a pool for its candidates.',
  plans:
    'A candidate can be a whole plan: one call, a cascade that pays the primary on every task and the reference only on the rejected ones, or a retry that sees the failing tests. Switch tabs to watch the plan re-route.',
  paper: 'The paper’s Figure 1: one router over every output type, the per-input headroom on the test split, and the efficiency of price routes at a near-zero loss.',
};

export function Overview() {
  const tk = useTokens();
  const narrow = useNarrow();
  const [view, setView] = useState<View>('live');
  return (
    <Section
      id="overview"
      n="1"
      kicker={<span>Introduction · three questions</span>}
      title="For each input, some candidate is best."
      lede="A language model answers a question, an image or video generator renders a prompt, a speech model reads text aloud, and a learned policy controls a robot. A router that chooses well could match the strongest candidate at a fraction of its price, or beat it."
    >
      <div className="md:ml-[190px]">
        <Plate
          fig="1"
          title="One router, every output type"
          source={view === 'paper' ? { kind: 'data', ref: 'the paper’s Fig. 1' } : { kind: 'schematic', note: view === 'live' ? 'after the paper’s Fig. 1a' : 'plans of §2 and §5' }}
          controls={
            <RubberSegment
              items={[
                { value: 'live', label: narrow ? 'Outputs' : 'Every output type' },
                { value: 'plans', label: 'Plans' },
                { value: 'paper', label: narrow ? 'Paper' : 'Paper figure' },
              ]}
              value={view}
              onChange={(v) => setView(v as View)}
              trackColor={tk.surface2}
              thumbColor={tk.ink}
              textColor={tk.ink2}
              activeTextColor={tk.bg}
              size="sm"
              className="font-sans"
              aria-label="Figure view"
            />
          }
          caption={<>{CAPTIONS[view]}</>}
        >
          <Stack
            active={view}
            views={[
              { key: 'live', node: <OmniRouter /> },
              { key: 'plans', node: <ExecutionPlans /> },
              {
                key: 'paper',
                node: (
                  <figure className="flex h-full items-center overflow-hidden rounded-2xl border border-rule bg-white p-3 md:p-5">
                    <img
                      src={teaser}
                      alt="The paper's Figure 1: (a) one router, every output type; (b) per-input headroom on the test split; (c) efficiency at a near-zero loss."
                      className="h-auto w-full"
                      loading="lazy"
                      draggable={false}
                    />
                  </figure>
                ),
              },
            ]}
          />
        </Plate>
      </div>

      <Prose className="mt-8">
        <p>
          The paper runs every candidate of a pool on the same inputs, for 25 benchmarks from text and image understanding to robot manipulation,
          and asks three questions: <em>how much can routing gain, what do learned routers recover, and when does routing pay through price?</em>{' '}
          A short theory frames all three.
        </p>
        <Fold label="Abstract">
          <p>{abstract}</p>
        </Fold>
      </Prose>
    </Section>
  );
}
