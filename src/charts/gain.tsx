import { HEADROOM_ALL, LADDER, ROBOT } from '@/data/results';
import { ChartBox, signed, useHover } from './base';

// The paper's Figure 3: of the gap from the best fixed candidate to the per-input oracle, the share the best
// lookup recovers (chosen in hindsight) when it sees the benchmark, the capability type, or the robot task and
// scene. The rest lies within types.

const ROWS = [
  {
    k: 'Per benchmark',
    sub: `${HEADROOM_ALL.benchmarks} benchmarks · gap ${HEADROOM_ALL.gap.toFixed(1)}`,
    share: (HEADROOM_ALL.hindsight - HEADROOM_ALL.fixed) / HEADROOM_ALL.gap,
    shown: '0.4%',
    rest: '99.6%',
    fixed: HEADROOM_ALL.fixed,
    lookup: HEADROOM_ALL.hindsight,
    lookupLabel: 'the best candidate per benchmark, in hindsight',
    oracle: HEADROOM_ALL.oracle,
    note: `${HEADROOM_ALL.inputs.toLocaleString('en-US')} test inputs on which every candidate is scored.`,
  },
  {
    k: 'Per capability type',
    sub: `${LADDER.typed.benchmarks} benchmarks · gap ${(LADDER.typed.oracle - LADDER.typed.fixed).toFixed(1)}`,
    share: (LADDER.typed.perLeaf - LADDER.typed.fixed) / (LADDER.typed.oracle - LADDER.typed.fixed),
    shown: '8%',
    rest: '92%',
    fixed: LADDER.typed.fixed,
    lookup: LADDER.typed.perLeaf,
    lookupLabel: `the best candidate per leaf of a ${LADDER.typed.leaves}-leaf tree`,
    oracle: LADDER.typed.oracle,
    note: `${LADDER.typed.inputs.toLocaleString('en-US')} test inputs of the rule-based capability tree.`,
  },
  {
    k: 'Per task and scene',
    sub: `robots · gap ${(ROBOT.overall.oracle - ROBOT.overall.fixed).toFixed(1)}`,
    share: LADDER.robot.perTaskCondition.shareOfGap,
    shown: '23%',
    rest: '77%',
    fixed: ROBOT.overall.fixed,
    lookup: null,
    lookupLabel: 'the best policy per task and scene condition',
    oracle: ROBOT.overall.oracle,
    note: `${ROBOT.scenes.toLocaleString('en-US')} RoboTwin test scenes, clean and randomized.`,
  },
];

export function HeadroomShare() {
  const { hot, tip, bind } = useHover();
  return (
    <ChartBox
      label="Share of the potential gain the best lookup recovers: 0.4% per benchmark, 8% per capability type, 23% per robot task and scene; the rest lies within types."
      height={(W) => (W < 520 ? 3 * 82 - 10 : 3 * 92 - 14)}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const narrow = W < 520;
        const pitch = narrow ? 82 : 92;
        const bh = narrow ? 30 : 36;
        return ROWS.map((r, i) => {
          const y = i * pitch;
          const barY = y + (narrow ? 14 : 18);
          const sw = Math.max(4, r.share * W);
          const inside = sw > 56;
          return (
            <g key={r.k} className={`row${hot === i ? ' on' : ''}`}>
              <text className="lbl b" x={0} y={y + 10} style={{ fontSize: narrow ? 15 : 17 }}>
                {r.k}
              </text>
              <text className="sub" x={W} y={y + 10} textAnchor="end">
                {r.sub}
              </text>
              <path d={`M${sw + 2},${barY}H${W - 6}Q${W},${barY} ${W},${barY + 6}V${barY + bh - 6}Q${W},${barY + bh} ${W - 6},${barY + bh}H${sw + 2}Z`} fill="var(--fill)" />
              <rect x={0} y={barY} width={sw} height={bh} rx={Math.min(6, sw / 2)} fill="var(--blue)" />
              <text
                x={inside ? 14 : sw + 12}
                y={barY + bh / 2 + 5}
                fill={inside ? '#fff' : 'var(--ink)'}
                style={{ font: `600 ${narrow ? 15 : 17}px/1 var(--display)`, letterSpacing: '-0.01em' }}
              >
                {r.shown}
              </text>
              <text className="sub" x={W - 14} y={barY + bh / 2 + 4.5} textAnchor="end" style={{ fill: 'var(--ink2)', fontSize: narrow ? 12 : 13 }}>
                {r.rest} within types
              </text>
              <rect
                className="hit"
                x={0}
                y={y - 6}
                width={W}
                height={pitch - 4}
                {...bind(i, () => ({
                  x: Math.max(sw, inside ? sw : sw + 48),
                  y: barY + bh / 2,
                  title: r.k,
                  rows: [
                    { mark: 'hollow', color: 'var(--c-a)', label: 'the best fixed candidate', value: r.fixed.toFixed(2) },
                    { mark: 'bar', color: 'var(--blue)', label: r.lookupLabel, value: r.lookup !== null ? r.lookup.toFixed(2) : `${r.shown} of the gap` },
                    { mark: 'dot', color: 'var(--c-a)', label: 'the per-input oracle', value: r.oracle.toFixed(2) },
                  ],
                  note: `${r.note} Gap ${signed(r.oracle - r.fixed, 2)} points.`,
                }))}
              />
            </g>
          );
        });
      }}
    />
  );
}
