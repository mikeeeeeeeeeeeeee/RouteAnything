import { HEADROOM, HEADROOM_ALL, PRICE_ROUTES, groupLabel, type GroupKey } from '@/data/results';
import { ChartBox, ci, hbar, lin, log, signed, useHover } from './base';

// The paper's Figure 1 (b) and (c): per-input potential gain by modality, and the efficiency of price routes at a
// near-zero quality loss. Both panels share one row grid so they stand at the same height side by side.

const SHORT: Record<GroupKey, string> = {
  video: 'Video gen.',
  robot: 'Robots',
  agents: 'Code & agents',
  imggen: 'Image gen.',
  text: 'Text QA',
  imgqa: 'Image-text QA',
  speech: 'Speech gen.',
};

const ROWS = [...HEADROOM]
  .sort((a, b) => b.gap - a.gap)
  .map((r) => ({ key: r.group, label: SHORT[r.group], full: groupLabel(r.group), fixed: r.fixed, oracle: r.oracle, gap: r.gap, inputs: r.inputs, cands: r.candidates, all: false }))
  .concat([{ key: 'all' as GroupKey, label: 'All', full: `All ${HEADROOM_ALL.benchmarks} benchmarks`, fixed: HEADROOM_ALL.fixed, oracle: HEADROOM_ALL.oracle, gap: HEADROOM_ALL.gap, inputs: HEADROOM_ALL.inputs, cands: '3–7', all: true }]);

const rowH = (compact: boolean) => (compact ? 27 : 30);
const SEP = 12;
const AXIS = 28;
/** the height of the row area both panels share */
const rowsArea = (compact: boolean) => (ROWS.length - 1) * rowH(compact) + SEP + rowH(compact);
const heroH = (W: number) => 4 + rowsArea(W < 400) + AXIS;

export function HeroHeadroom() {
  const { hot, tip, bind } = useHover();
  return (
    <ChartBox
      label="Per-input potential gain by modality: the best fixed candidate per benchmark against the per-input oracle, on a 0 to 100 scale."
      height={heroH}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const compact = W < 400;
        const rh = rowH(compact);
        const labelW = compact ? 92 : 108;
        const x0 = labelW + 12;
        const x1 = W - 52;
        const X = lin(60, 100, x0, x1);
        const cy = (i: number) => 4 + i * rh + rh / 2 + (ROWS[i].all ? SEP : 0);
        const bottom = 4 + rowsArea(compact);
        return (
          <>
            {[60, 70, 80, 90, 100].map((t) => (
              <g key={t}>
                <line className="grid" x1={X(t)} x2={X(t)} y1={0} y2={bottom} />
                <text className="tick" x={X(t)} y={bottom + 18} textAnchor="middle">
                  {t}
                </text>
              </g>
            ))}
            <line x1={0} x2={W} y1={4 + (ROWS.length - 1) * rh + SEP / 2} y2={4 + (ROWS.length - 1) * rh + SEP / 2} stroke="var(--hair)" shapeRendering="crispEdges" />
            {ROWS.map((r, i) => {
              const y = cy(i);
              return (
                <g key={r.key} className={`row${hot === i ? ' on' : ''}`}>
                  <text className={`lbl${r.all ? ' b' : ''}`} x={labelW} y={y + 4.5} textAnchor="end" style={{ fontSize: compact ? 13 : 14 }}>
                    {r.label}
                  </text>
                  <line x1={X(r.fixed)} x2={X(r.oracle)} y1={y} y2={y} stroke="var(--blue-soft)" strokeWidth={6} strokeLinecap="round" />
                  <circle cx={X(r.fixed)} cy={y} r={5} fill="var(--page)" stroke="var(--c-a)" strokeWidth={1.75} />
                  <circle cx={X(r.oracle)} cy={y} r={5.5} fill="var(--blue)" stroke="var(--page)" strokeWidth={2} />
                  <text className={`val ${r.all ? 'blue' : 'ink'}`} x={W} y={y + 4.5} textAnchor="end">
                    {signed(r.gap, 1)}
                  </text>
                  <rect
                    className="hit"
                    x={0}
                    y={y - rh / 2}
                    width={W}
                    height={rh}
                    {...bind(i, () => ({
                      x: X(r.oracle),
                      y,
                      title: r.full,
                      rows: [
                        { mark: 'hollow', color: 'var(--c-a)', label: 'Best fixed candidate per benchmark', value: r.fixed.toFixed(2) },
                        { mark: 'dot', color: 'var(--blue)', label: 'Per-input oracle', value: r.oracle.toFixed(2) },
                      ],
                      note: `${r.inputs.toLocaleString('en-US')} test inputs · ${r.cands} candidates · gap ${signed(r.gap, 2)} points`,
                    }))}
                  />
                </g>
              );
            })}
          </>
        );
      }}
    />
  );
}

const EFF = [
  { key: 'code-fit', label: 'Code', unit: '$' },
  { key: 'text-fit', label: 'Text QA', unit: '$' },
  { key: 'img-05', label: 'Image gen.', unit: '$' },
  { key: 'robot', label: 'Robots', unit: 's' },
].map((e) => {
  const r = PRICE_ROUTES.find((p) => p.key === e.key)!;
  const cert = PRICE_ROUTES.find((p) => p.group === r.group && p.kind === 'certified');
  return { ...e, r, cert };
});

export function HeroEfficiency() {
  const { hot, tip, bind } = useHover();
  return (
    <ChartBox
      label="Efficiency of price routes at a near-zero quality loss, against each testbed's reference: 25.5 times on code, 7.1 on text QA, 1.35 on image generation and 1.33 on robots."
      height={heroH}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const compact = W < 400;
        const labelW = compact ? 92 : 108;
        const x0 = labelW + 12;
        const x1 = W - 62;
        const X = log(1, 30, x0, x1);
        const area = rowsArea(compact);
        const rh = area / EFF.length;
        const bottom = 4 + area;
        return (
          <>
            {[1, 3, 10, 30].map((t) => (
              <g key={t}>
                <line className="grid" x1={X(t)} x2={X(t)} y1={0} y2={bottom} />
                <text className="tick" x={X(t)} y={bottom + 18} textAnchor="middle">
                  {t}×
                </text>
              </g>
            ))}
            {EFF.map((e, i) => {
              const y = 4 + i * rh + rh / 2;
              const v = e.r.eff;
              return (
                <g key={e.key} className={`row${hot === i ? ' on' : ''}`}>
                  <text className="lbl" x={labelW} y={y - 2} textAnchor="end" style={{ fontSize: compact ? 13 : 14 }}>
                    {e.label} ({e.unit})
                  </text>
                  <text className="sub" x={labelW} y={y + 14} textAnchor="end">
                    ΔV {signed(e.r.dv ?? 0, 1)} pts
                  </text>
                  <path d={hbar(x0, X(v), y, compact ? 14 : 16)} fill="var(--blue)" />
                  <text className="big" x={X(v) + 8} y={y + 6}>
                    {v}×
                  </text>
                  <rect
                    className="hit"
                    x={0}
                    y={y - rh / 2}
                    width={W}
                    height={rh}
                    {...bind(i, () => ({
                      x: X(v),
                      y,
                      title: e.r.testbed,
                      rows: [
                        { mark: 'bar', color: 'var(--blue)', label: `efficiency against ${e.r.reference.replace(/^Always/, 'always').replace(/^Fixed/, 'the fixed')}`, value: `${v}×` },
                        { mark: 'line', color: 'var(--ink3)', label: 'test-set quality change, points', value: signed(e.r.dv ?? 0, 2) },
                      ],
                      note: `${e.r.route}; 95% interval ${e.r.ci ? ci(e.r.ci) : ''}.${e.cert ? ` Certified: ${e.cert.eff}×, the floor holds in 200 of 200 splits.` : ''}`,
                    }))}
                  />
                </g>
              );
            })}
          </>
        );
      }}
    />
  );
}
