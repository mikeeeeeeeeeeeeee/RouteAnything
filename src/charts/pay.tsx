import { CERTIFICATION, FLOOR_SPLITS } from '@/data/results';
import { ChartBox, useHover } from './base';

// Proposition 5 in the data (Appendix C.2): the zero-loss floor on CodeRouterBench, refitted on 200 random halves
// of the probing tasks. One square per split, filled where the floor holds on test.

const BLOCKS = [
  {
    ...FLOOR_SPLITS[0],
    title: 'Fitted',
    big: '12.5%',
    sub: 'hold the floor on test',
    color: 'var(--c-a)',
    tip: {
      title: 'Fitted zero-loss floor',
      rows: [{ mark: 'bar' as const, color: 'var(--c-a)', label: 'splits where the floor holds on test', value: '25 of 200' }],
      note: 'Refitted on a random half of the probing tasks, ε = 0.',
    },
  },
  {
    ...FLOOR_SPLITS[1],
    title: 'Certified',
    big: '100%',
    sub: `hold it, at a median ${CERTIFICATION.medianEff}×`,
    color: 'var(--blue)',
    tip: {
      title: 'Certified floor',
      rows: [
        { mark: 'bar' as const, color: 'var(--blue)', label: 'splits where the floor holds on test', value: '200 of 200' },
        { mark: 'line' as const, color: 'var(--blue)', label: 'median efficiency against always-Opus', value: `${CERTIFICATION.medianEff}×` },
      ],
      note: 'Certified on the other half by Proposition 5, with empirical-Bernstein p-values on the refined price path, α = 0.05.',
    },
  },
];

const COLS = 25;
const ROWS = 8;

export function FloorWaffles() {
  const { hot, tip, bind } = useHover();
  const geom = (W: number) => {
    const side = W >= 640;
    const bw = side ? (W - 56) / 2 : W;
    const gap = side ? 4 : 3;
    const s = Math.min(side ? 12 : 10, Math.floor((bw - (COLS - 1) * gap) / COLS));
    const gridH = ROWS * s + (ROWS - 1) * gap;
    const head = 66;
    return { side, bw, gap, s, gridH, head, blockH: head + gridH };
  };
  return (
    <ChartBox
      label="The zero-loss floor refitted on 200 random halves of CodeRouterBench's probing tasks: fitted, it holds on test in 25 of 200 splits; certified, in all 200, at a median 19.4 times the efficiency of always-Opus."
      height={(W) => {
        const g = geom(W);
        return g.side ? g.blockH : 2 * g.blockH + 36;
      }}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const g = geom(W);
        return BLOCKS.map((b, bi) => {
          const ox = g.side ? bi * (g.bw + 56) : 0;
          const oy = g.side ? 0 : bi * (g.blockH + 36);
          const used = COLS * g.s + (COLS - 1) * g.gap;
          return (
            <g key={b.key} className={`row${hot === bi ? ' on' : ''}`} transform={`translate(${ox} ${oy})`}>
              <text className="lbl b" x={0} y={14} style={{ fontSize: 15 }}>
                {b.title}
              </text>
              <text x={0} y={50}>
                <tspan style={{ font: '600 32px/1 var(--display)', letterSpacing: '-0.02em', fill: bi === 1 ? 'var(--blue)' : 'var(--ink)' }}>{b.big}</tspan>
                <tspan dx={10} style={{ font: '400 13px/1 var(--text)', fill: 'var(--ink2)' }}>
                  {b.sub}
                </tspan>
              </text>
              {Array.from({ length: COLS * ROWS }, (_, k) => {
                const r = Math.floor(k / COLS);
                const c = k % COLS;
                return (
                  <rect
                    key={k}
                    x={c * (g.s + g.gap)}
                    y={g.head + r * (g.s + g.gap)}
                    width={g.s}
                    height={g.s}
                    rx={Math.min(3, g.s / 4)}
                    fill={k < b.held ? b.color : 'var(--fill)'}
                  />
                );
              })}
              <rect className="hit" x={0} y={0} width={Math.max(used, g.bw)} height={g.blockH} {...bind(bi, () => ({ x: ox + used, y: oy + g.head + g.gridH / 2, ...b.tip }))} />
            </g>
          );
        });
      }}
    />
  );
}
