import { useState, type PointerEvent } from 'react';
import { HEADROOM_ALL, LADDER } from '@/data/results';
import { ChartBox, fmt, lin, useHover, vbar, hbar, type TipData } from './base';

// Four small schematics, one per result of the paper's Section 2. They are drawings of the statements, not data;
// where the paper measures a rung or a value, the tooltip gives the number.

/* ------------------------------------------------------------------ */
/* Theorem 2: each candidate's worth v − λc is a line in the price λ;  */
/* the best router follows the upper envelope                          */
/* ------------------------------------------------------------------ */

const LINES = [
  { k: 'A', v: 0.95, c: 0.55 },
  { k: 'B', v: 0.82, c: 0.3 },
  { k: 'C', v: 0.62, c: 0.15 },
  { k: 'D', v: 0.42, c: 0.07 },
];
const worth = (u: (typeof LINES)[number], l: number) => u.v - l * u.c;
const bestAt = (l: number) => LINES.reduce((a, b) => (worth(b, l) > worth(a, l) ? b : a));
/** the envelope's root, the highest efficiency: D's v / c */
const ETA = 6;
/** the B–C kink, where a router under a floor mixes two candidates at one price */
const LAM_EPS = 4 / 3;
const KINKS = [0, 0.52, LAM_EPS, 2.5, ETA];

export function EnvelopeMini() {
  const [lam, setLam] = useState<number | null>(null);
  const [tip, setTip] = useState<TipData | null>(null);
  return (
    <ChartBox
      label="Each candidate's value minus priced cost is a line falling with the price. The best router follows their upper envelope, whose root is the highest efficiency eta star; under a quality floor it routes at one price, lambda epsilon."
      height={() => 184}
      hot={null}
      tip={tip}
      draw={(W) => {
        const x0 = 22;
        const x1 = W - 6;
        const yTop = 8;
        const yBot = 160;
        const X = lin(0, 6.8, x0, x1);
        const Y = lin(-0.22, 1.06, yBot, yTop);
        const Xi = (px: number) => ((px - x0) / (x1 - x0)) * 6.8;
        const env = KINKS.map((l) => `${X(l)},${Y(worth(bestAt(Math.min(l + 1e-9, ETA)), l))}`).join(' ');
        const move = (e: PointerEvent<SVGRectElement>) => {
          const r = e.currentTarget.getBoundingClientRect();
          const l = Math.max(0, Math.min(6.8, Xi(e.clientX - r.left + x0)));
          const u = bestAt(l);
          const j = worth(u, l);
          setLam(l);
          setTip({
            x: X(l),
            y: Y(j),
            title: (
              <>
                At price <i>λ</i> = {l.toFixed(2)}
              </>
            ),
            rows: [
              { mark: 'line', color: 'var(--blue)', label: 'the best router plays', value: u.k },
              { mark: 'dot', color: 'var(--blue)', label: 'value minus priced cost', value: fmt(j, 2) },
            ],
            note: l > ETA ? 'Past η★ every candidate is worth less than nothing.' : l < LAM_EPS && l > 1.2 ? 'Near λε the router under the floor mixes B and C.' : undefined,
          });
        };
        const leave = () => {
          setLam(null);
          setTip(null);
        };
        return (
          <>
            <line className="zero" x1={x0} x2={x1} y1={Y(0)} y2={Y(0)} />
            {LINES.map((u) => {
              const end = Math.min(6.8, (u.v + 0.22) / u.c);
              return <line key={u.k} x1={X(0)} y1={Y(u.v)} x2={X(end)} y2={Y(worth(u, end))} stroke="var(--c-line)" strokeWidth={1.25} />;
            })}
            <polyline points={env} fill="none" stroke="var(--blue)" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
            {LINES.map((u) => (
              <text key={u.k} className="sub" x={x0 - 7} y={Y(u.v) + 4} textAnchor="end" style={{ fill: 'var(--ink2)' }}>
                {u.k}
              </text>
            ))}
            {/* the floor's price */}
            <line x1={X(LAM_EPS)} x2={X(LAM_EPS)} y1={Y(worth(LINES[1], LAM_EPS)) + 6} y2={yBot + 4} stroke="var(--ink3)" strokeDasharray="3 3" />
            <circle cx={X(LAM_EPS)} cy={Y(worth(LINES[1], LAM_EPS))} r={4} fill="var(--blue)" stroke="var(--page)" strokeWidth={2} />
            <text className="sub" x={X(LAM_EPS)} y={yBot + 20} textAnchor="middle" style={{ fill: 'var(--ink2)' }}>
              <tspan fontStyle="italic">λ</tspan>
              <tspan fontSize="9" dy="3" fontStyle="italic">
                ε
              </tspan>
            </text>
            {/* the root: the highest efficiency */}
            <circle cx={X(ETA)} cy={Y(0)} r={4.5} fill="var(--page)" stroke="var(--blue)" strokeWidth={1.75} />
            <text className="sub" x={X(ETA)} y={Y(0) - 11} textAnchor="middle" style={{ fill: 'var(--ink2)' }}>
              <tspan fontStyle="italic">η</tspan>★
            </text>
            <text className="sub" x={x1} y={yBot + 20} textAnchor="end">
              price <tspan fontStyle="italic">λ</tspan> →
            </text>
            <text className="sub" x={x0 + 4} y={yTop + 4}>
              <tspan fontStyle="italic">v</tspan> − <tspan fontStyle="italic">λc</tspan>
            </text>
            {lam !== null && (
              <g pointerEvents="none">
                <line x1={X(lam)} x2={X(lam)} y1={yTop} y2={yBot} stroke="var(--hair)" />
                <circle cx={X(lam)} cy={Y(worth(bestAt(lam), lam))} r={4.5} fill="var(--blue)" stroke="var(--page)" strokeWidth={2} />
              </g>
            )}
            <rect
              className="hit"
              x={x0}
              y={yTop}
              width={x1 - x0}
              height={yBot - yTop}
              style={{ touchAction: 'pan-y' }}
              onPointerMove={move}
              onPointerDown={move}
              onPointerLeave={(e) => e.pointerType !== 'touch' && leave()}
            />
          </>
        );
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Proposition 3: the information ladder                                */
/* ------------------------------------------------------------------ */

const RUNGS = [
  {
    k: 'Benchmark',
    h: 0.28,
    tip: {
      title: 'Seeing the benchmark',
      rows: [{ mark: 'bar' as const, color: 'var(--c-bar)', label: 'the best fixed candidate, 24 benchmarks', value: HEADROOM_ALL.fixed.toFixed(2) }],
      note: 'The lowest rung, measured.',
    },
  },
  {
    k: 'Type',
    h: 0.36,
    tip: {
      title: 'Seeing a capability type',
      rows: [
        { mark: 'bar' as const, color: 'var(--c-bar)', label: 'the best candidate per leaf, in hindsight', value: LADDER.typed.perLeaf.toFixed(2) },
        { mark: 'hollow' as const, color: 'var(--c-a)', label: 'the fixed candidate, same 18 benchmarks', value: LADDER.typed.fixed.toFixed(2) },
      ],
      note: `About ${Math.round(LADDER.typed.betweenTypesShare * 100)}% of the gap lies between types.`,
    },
  },
  {
    k: 'Input',
    h: 0.64,
    tip: {
      title: 'Seeing the input',
      rows: [{ mark: 'bar' as const, color: 'var(--blue)', label: 'reached by regressing outcomes (Prop. 4)', value: 'V★(x)' }],
      note: 'Any router that reads the input bounds this rung from below.',
    },
  },
  {
    k: 'Oracle',
    h: 1,
    tip: {
      title: 'Seeing the outcome',
      rows: [{ mark: 'dash' as const, color: 'var(--c-a)', label: 'the best candidate on each input, 24 benchmarks', value: HEADROOM_ALL.oracle.toFixed(2) }],
      note: 'Above the top rung by outcome noise that no router can predict.',
    },
  },
];

export function LadderMini() {
  const { hot, tip, bind } = useHover();
  return (
    <ChartBox
      label="Four rungs, rising: a router that sees the benchmark, a capability type, the input, and the oracle that sees the outcome. The gap between the input rung and the oracle is outcome noise."
      height={() => 196}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const yBase = 164;
        const yTop = 10;
        const Y = lin(0, 1, yBase, yTop);
        const col = W / RUNGS.length;
        const bw = Math.min(56, col * 0.56);
        const cx = (i: number) => col * i + col / 2;
        return (
          <>
            <line className="zero" x1={0} x2={W} y1={yBase} y2={yBase} />
            <line x1={cx(2) + bw / 2} x2={cx(3) - bw / 2} y1={Y(RUNGS[2].h)} y2={Y(RUNGS[2].h)} stroke="var(--ink3)" strokeDasharray="2 3" />
            {RUNGS.map((r, i) => (
              <g key={r.k} className={`row${hot === i ? ' on' : ''}`}>
                {i < 3 ? (
                  <path d={vbar(cx(i), bw, yBase, Y(r.h), 6)} fill={i === 2 ? 'var(--blue)' : 'var(--c-bar)'} />
                ) : (
                  <>
                    <path d={vbar(cx(i), bw, yBase, Y(r.h), 6)} fill="none" stroke="var(--c-a)" strokeWidth={1.25} strokeDasharray="4 3" />
                    <text className="sub" x={cx(i)} y={(Y(RUNGS[2].h) + Y(1)) / 2 + 4} textAnchor="middle">
                      noise
                    </text>
                  </>
                )}
                <text className="sub" x={cx(i)} y={yBase + 20} textAnchor="middle" style={{ fill: i === 2 ? 'var(--ink)' : 'var(--ink2)' }}>
                  {r.k}
                </text>
                <rect className="hit" x={col * i} y={0} width={col} height={yBase + 28} {...bind(i, () => ({ x: cx(i) + bw / 2, y: Y(r.h) + 16, ...r.tip }))} />
              </g>
            ))}
          </>
        );
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Proposition 4(b): a winner label can favor the candidate that wins  */
/* more often but delivers less                                         */
/* ------------------------------------------------------------------ */

const A = 0.9;
const B = 0.6;

export function WinnerMini() {
  const { hot, tip, bind } = useHover();
  const rows = [
    {
      k: 'Winner label',
      sub: 'plays B',
      v: B,
      color: 'var(--c-a)',
      tip: {
        title: 'Trained to name the winner',
        rows: [
          { mark: 'bar' as const, color: 'var(--c-a)', label: 'B wins: it delivers 1 whenever it succeeds', value: '60%' },
          { mark: 'bar' as const, color: 'var(--c-a)', label: 'value delivered', value: B.toFixed(2) },
        ],
        note: 'The label sees who wins, not by how much.',
      },
    },
    {
      k: 'Outcome regression',
      sub: 'plays A',
      v: A,
      color: 'var(--blue)',
      tip: {
        title: 'Trained on each candidate’s outcome',
        rows: [
          { mark: 'bar' as const, color: 'var(--blue)', label: 'value delivered', value: A.toFixed(2) },
          { mark: 'bar' as const, color: 'var(--c-a)', label: 'what the winner label gives up', value: fmt(B - A, 2) },
        ],
        note: 'It estimates each candidate’s expected value and plays the larger.',
      },
    },
  ];
  return (
    <ChartBox
      label="Candidate A always delivers 0.9; candidate B delivers 1 with probability 0.6. A winner label picks B and delivers 0.6; outcome regression picks A and delivers 0.9."
      height={() => 196}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const X = lin(0, 1, 0, W - 44);
        const y0 = 50;
        const pitch = 56;
        const bh = 16;
        const axisY = y0 + 2 * pitch - 6;
        return (
          <>
            <text className="sub" x={0} y={12} style={{ fill: 'var(--ink2)' }}>
              A always delivers 0.9.
            </text>
            <text className="sub" x={0} y={29} style={{ fill: 'var(--ink2)' }}>
              B delivers 1 with probability 0.6, else 0.
            </text>
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <line className="grid" x1={X(t)} x2={X(t)} y1={y0 - 4} y2={axisY} />
                <text className="tick" x={X(t)} y={axisY + 16} textAnchor={t === 0 ? 'start' : 'middle'}>
                  {t === 0 ? '0' : t === 1 ? '1' : '.5'}
                </text>
              </g>
            ))}
            {rows.map((r, i) => {
              const y = y0 + i * pitch;
              return (
                <g key={r.k} className={`row${hot === i ? ' on' : ''}`}>
                  <text className="lbl" x={0} y={y + 8} style={{ fontSize: 14, fontWeight: 600 }}>
                    {r.k}
                    <tspan dx={8} style={{ font: '400 12px var(--text)', fill: 'var(--ink3)' }}>
                      {r.sub}
                    </tspan>
                  </text>
                  <path d={hbar(0, X(r.v), y + 24, bh)} fill={r.color} />
                  {i === 0 && <rect x={X(B) + 2} y={y + 24 - bh / 2 + 0.5} width={X(A) - X(B) - 2} height={bh - 1} rx={4} fill="none" stroke="var(--ink3)" strokeDasharray="3 3" />}
                  <text className="val ink" x={X(i === 0 ? A : r.v) + 8} y={y + 28.5}>
                    {i === 0 ? fmt(B - A, 2) : r.v.toFixed(2)}
                  </text>
                  <rect className="hit" x={0} y={y - 8} width={W} height={pitch - 4} {...bind(i, () => ({ x: X(r.v), y: y + 24, ...r.tip }))} />
                </g>
              );
            })}
          </>
        );
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Proposition 5: test the routers on the price path in order, stop at */
/* the first failure                                                    */
/* ------------------------------------------------------------------ */

type Step = 'ref' | 'pass' | 'cert' | 'fail' | 'skip';
const STEPS: { k: string; s: Step; title: string; note: string }[] = [
  { k: 'B', s: 'ref', title: 'The reference', note: 'Played when the first router already fails its test.' },
  { k: '1', s: 'pass', title: 'g1 passes', note: 'Its loss on fresh inputs stays within the tolerance; the test moves on to a cheaper router.' },
  { k: '2', s: 'pass', title: 'g2 passes', note: 'Each router is tested at the full level α.' },
  { k: '3', s: 'cert', title: 'g3, the certified router', note: 'The last router before the first failure. It breaks the floor with probability at most α.' },
  { k: '4', s: 'fail', title: 'g4 fails', note: 'The test stops here.' },
  { k: '5', s: 'skip', title: 'g5 is never tested', note: 'Routers past the first failure are not tested, so no multiplicity correction is needed.' },
];

export function CertifyMini() {
  const { hot, tip, bind } = useHover();
  return (
    <ChartBox
      label="Routers g1 to g5 on the fitted price path are tested in order on fresh inputs: g1, g2 and g3 pass, g4 fails, so g3 is certified and g5 is never tested. If g1 fails, the reference is played."
      height={() => 196}
      hot={hot}
      tip={tip}
      draw={(W) => {
        const gap = Math.min(14, W * 0.03);
        const lead = Math.min(26, W * 0.06);
        const s = Math.min(50, (W - lead - 5 * gap) / 6);
        const ox = Math.max(0, (W - (6 * s + lead + 4 * gap)) / 2);
        const x = (i: number) => ox + (i === 0 ? 0 : s + lead + (i - 1) * (s + gap));
        const cy = 92;
        const glyphY = cy - s / 2 - 20;
        return (
          <>
            {/* the price path under the routers */}
            <line x1={x(1)} x2={x(5) + s} y1={cy + s / 2 + 34} y2={cy + s / 2 + 34} stroke="var(--hair)" />
            <path d={`M${x(5) + s - 6},${cy + s / 2 + 30} l6,4 l-6,4`} fill="none" stroke="var(--ink3)" strokeWidth={1.25} />
            <text className="sub" x={x(1)} y={cy + s / 2 + 52}>
              price <tspan fontStyle="italic">λ</tspan> along the fitted path
            </text>
            <text className="sub" x={x(0) + s / 2} y={glyphY + 4} textAnchor="middle" style={{ fontSize: 11 }}>
              <tspan fontStyle="italic">p</tspan> ≤ <tspan fontStyle="italic">α</tspan>?
            </text>
            {STEPS.map((st, i) => {
              const fill = st.s === 'cert' ? 'var(--blue)' : st.s === 'ref' || st.s === 'skip' ? 'none' : 'var(--band)';
              const ink = st.s === 'cert' ? '#fff' : st.s === 'skip' ? 'var(--ink3)' : st.s === 'fail' ? 'var(--ink2)' : 'var(--ink)';
              const cx = x(i) + s / 2;
              return (
                <g key={st.k} className={`row${hot === i ? ' on' : ''}`}>
                  <rect
                    x={x(i) + 0.5}
                    y={cy - s / 2}
                    width={s - 1}
                    height={s}
                    rx={12}
                    fill={fill}
                    stroke={st.s === 'ref' ? 'var(--c-a)' : st.s === 'skip' ? 'var(--hair)' : 'none'}
                    strokeWidth={1.25}
                    strokeDasharray={st.s === 'skip' ? '3 3' : undefined}
                  />
                  <text x={cx} y={cy + 5.5} textAnchor="middle" fill={ink} style={{ font: 'italic 400 16px/1 var(--text)' }}>
                    g<tspan fontSize="11" dy="3" fontStyle="normal">
                      {st.k}
                    </tspan>
                  </text>
                  {(st.s === 'pass' || st.s === 'cert') && (
                    <path d={`M${cx - 6},${glyphY} l4,4 l8,-8`} fill="none" stroke="var(--blue)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  {st.s === 'fail' && <path d={`M${cx - 5},${glyphY - 5} l10,10 M${cx + 5},${glyphY - 5} l-10,10`} stroke="var(--ink2)" strokeWidth={2} strokeLinecap="round" />}
                  {st.s === 'skip' && <line x1={cx - 5} x2={cx + 5} y1={glyphY} y2={glyphY} stroke="var(--ink3)" strokeWidth={2} strokeLinecap="round" />}
                  {st.s === 'cert' && (
                    <text className="sub" x={cx} y={cy + s / 2 + 18} textAnchor="middle" style={{ fill: 'var(--ink)', fontWeight: 600 }}>
                      certified
                    </text>
                  )}
                  {st.s === 'ref' && (
                    <text className="sub" x={cx} y={cy + s / 2 + 18} textAnchor="middle">
                      reference
                    </text>
                  )}
                  <rect className="hit" x={x(i) - gap / 2} y={0} width={s + gap} height={cy + s / 2 + 24} {...bind(i, () => ({ x: x(i) + s, y: cy, title: st.title, rows: [], note: st.note }))} />
                </g>
              );
            })}
          </>
        );
      }}
    />
  );
}
