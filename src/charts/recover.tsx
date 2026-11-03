import { ROBOT, ROUTER_ROBOT, ROUTERS, ROUTERS_ALL, type RouterRow } from '@/data/results';
import { ChartBox, ci, fmt, lin, signed, useHover, vbar, hbar } from './base';

// Table 3: the share of the headroom one learned router captures, per output group; and Figure 4: robot success
// by scene condition, where the router follows whichever policy is better.

const SHORT: Record<string, string> = {
  text: 'Text QA',
  agents: 'Code & agents',
  imggen: 'Image gen.',
  video: 'Video gen.',
  speech: 'Speech gen.',
  all: 'All 16 benchmarks',
  robot: 'Robots',
};

const SHARE_ROWS: (RouterRow & { total?: boolean; sep?: boolean })[] = [...ROUTERS, { ...ROUTERS_ALL, total: true, sep: true }, { ...ROUTER_ROBOT }];

export function RouterShareChart() {
  const { hot, tip, bind } = useHover();
  return (
    <ChartBox
      label="Share of the headroom a learned router captures: text QA minus 3%, code and agents 14%, image generation 5%, video generation 12%, speech generation 0%, all 16 benchmarks 6%, robots 6%."
      height={(W) => 4 + SHARE_ROWS.length * (W < 420 ? 30 : 32) + 14 + 26}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const narrow = W < 420;
        const rh = narrow ? 30 : 32;
        const labelW = narrow ? 112 : 128;
        const x0 = labelW + 14;
        const x1 = W - 44;
        const X = lin(-0.1, 1, x0, x1);
        let y = 4;
        const ys = SHARE_ROWS.map((r) => {
          if (r.sep) y += 14;
          const c = y + rh / 2;
          y += rh;
          return c;
        });
        const bottom = y + 4;
        return (
          <>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line className={t === 0 ? 'zero' : 'grid'} x1={X(t)} x2={X(t)} y1={0} y2={bottom} />
                <text className="tick" x={X(t)} y={bottom + 18} textAnchor="middle">
                  {Math.round(t * 100)}%
                </text>
              </g>
            ))}
            <line x1={0} x2={W} y1={ys[ROUTERS.length] - rh / 2 - 7} y2={ys[ROUTERS.length] - rh / 2 - 7} stroke="var(--hair)" shapeRendering="crispEdges" />
            {SHARE_ROWS.map((r, i) => {
              const cy = ys[i];
              const neg = r.share < 0;
              return (
                <g key={r.key} className={`row${hot === i ? ' on' : ''}`}>
                  <text className={`lbl${r.total ? ' b' : ''}`} x={labelW} y={cy + 4.5} textAnchor="end" style={{ fontSize: narrow ? 13 : 14 }}>
                    {SHORT[r.key]}
                  </text>
                  {r.share !== 0 &&
                    (neg ? (
                      <path d={`M${X(0)},${cy - 6}H${X(r.share) + 4}Q${X(r.share)},${cy - 6} ${X(r.share)},${cy - 2}V${cy + 2}Q${X(r.share)},${cy + 6} ${X(r.share) + 4},${cy + 6}H${X(0)}Z`} fill="var(--c-a)" />
                    ) : (
                      <path d={hbar(X(0), X(r.share), cy, 12)} fill="var(--blue)" />
                    ))}
                  {r.share === 0 && <circle cx={X(0)} cy={cy} r={3} fill="var(--c-a)" />}
                  <text className={`val ${r.total ? 'blue' : 'ink'}`} x={W} y={cy + 4.5} textAnchor="end">
                    {r.share < 0 ? '−' : ''}
                    {Math.round(Math.abs(r.share) * 100)}%
                  </text>
                  <rect
                    className="hit"
                    x={0}
                    y={cy - rh / 2}
                    width={W}
                    height={rh}
                    {...bind(i, () => ({
                      x: Math.max(X(0), X(r.share)),
                      y: cy,
                      title: `${r.label}${r.key === 'robot' ? '' : r.total ? '' : ` (${r.benchmarks})`}`,
                      rows: [
                        { mark: 'hollow', color: 'var(--c-a)', label: 'the fixed candidate', value: r.fixed.toFixed(2) },
                        { mark: 'bar', color: 'var(--blue)', label: 'the learned router', value: r.router.toFixed(2) },
                        { mark: 'dot', color: 'var(--c-a)', label: 'the per-input oracle', value: r.oracle.toFixed(2) },
                      ],
                      note: `${r.inputs.toLocaleString('en-US')} test inputs · router − fixed ${signed(r.diff, 2)}${r.ci ? ` ${ci(r.ci)}` : ''}`,
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

const SERIES = [
  { k: 'meDex', label: 'ME-Dex', color: 'var(--c-a)' },
  { k: 'patchWam', label: 'PatchWAM', color: 'var(--c-b)' },
  { k: 'router', label: 'Router', color: 'var(--blue)' },
] as const;

export const ROBOT_KEY = SERIES;

export function RobotChart() {
  const { hot, tip, bind } = useHover();
  return (
    <ChartBox
      label="Robot success by scene condition. Clean scenes: ME-Dex 78.4%, PatchWAM 81.7%, router 81.6%, oracle 93.3%. Randomized scenes: ME-Dex 62.5%, PatchWAM 45.6%, router 61.5%, oracle 84.4%."
      height={() => 268}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const left = 30;
        const yTop = 10;
        const yBase = 222;
        const Y = lin(0, 100, yBase, yTop);
        const gw = (W - left) / 2;
        const bw = Math.min(46, gw * 0.2);
        const gapIn = Math.min(8, bw * 0.18);
        return (
          <>
            {[0, 25, 50, 75, 100].map((t) => (
              <g key={t}>
                <line className={t === 0 ? 'zero' : 'grid'} x1={left} x2={W} y1={Y(t)} y2={Y(t)} />
                <text className="tick" x={left - 8} y={Y(t) + 4} textAnchor="end">
                  {t}
                </text>
              </g>
            ))}
            {ROBOT.conditions.map((c, gi) => {
              const gx = left + gw * gi + gw / 2;
              const span = 3 * bw + 2 * gapIn;
              const bx = (k: number) => gx - span / 2 + k * (bw + gapIn) + bw / 2;
              const vals = [c.meDex, c.patchWam, c.router];
              return (
                <g key={c.key} className={`row${hot === gi ? ' on' : ''}`}>
                  <line x1={gx - span / 2 - 14} x2={gx + span / 2 + 14} y1={Y(c.oracle)} y2={Y(c.oracle)} stroke="var(--ink3)" strokeWidth={1.25} strokeDasharray="4 3" />
                  <text className="sub" x={gx + span / 2 + 14} y={Y(c.oracle) - 7} textAnchor="end">
                    oracle {c.oracle}
                  </text>
                  {vals.map((v, k) => (
                    <g key={k}>
                      <path d={vbar(bx(k), bw, yBase, Y(v))} fill={SERIES[k].color} />
                      <text className={`val ${k === 2 ? 'blue' : 'ink'}`} x={bx(k)} y={Y(v) - 7} textAnchor="middle" style={{ fontSize: bw < 34 ? 11.5 : 13 }}>
                        {fmt(v, 1)}
                      </text>
                    </g>
                  ))}
                  <text className="lbl" x={gx} y={yBase + 22} textAnchor="middle">
                    {c.label} scenes
                  </text>
                  <text className="sub" x={gx} y={yBase + 39} textAnchor="middle">
                    {c.scenes.toLocaleString('en-US')} scenes
                  </text>
                  <rect
                    className="hit"
                    x={left + gw * gi}
                    y={0}
                    width={gw}
                    height={yBase + 44}
                    {...bind(gi, () => ({
                      x: gx + span / 2,
                      y: Y(c.router),
                      title: `${c.label} scenes`,
                      rows: [
                        ...SERIES.map((s, k) => ({ mark: 'bar' as const, color: s.color, label: s.label, value: `${fmt(vals[k], 1)}%` })),
                        { mark: 'dash' as const, color: 'var(--ink3)', label: 'oracle', value: `${c.oracle}%` },
                      ],
                      note: `Of these ${c.scenes.toLocaleString('en-US')} scenes, the router sends ${c.sentTo.map((s) => `${s.n} to ${s.candidate}`).join(' and ')}.`,
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
