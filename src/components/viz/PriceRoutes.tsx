import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { M } from '@/components/math/M';
import { IMAGE_ROUTE, PRICE_FACTS, PRICE_ROUTES, ROBOT, type PriceRouteRow } from '@/data/results';
import { clamp, easeInOut, easeOut, useInView, useReducedMotion } from '@/lib/hooks';
import { logScale, mono, scale } from './svg';

// Finding 6. (a) Table 5: every price route against its testbed's reference, efficiency on a log axis
// and the test-set quality change with its paired 95% interval. (b) Table 9: the half-point image
// route keeps three fixed generators and swaps two for cheaper ones. (c) Router overhead next to
// generation times (§6.1).

const MINUS = '\u2212';
const sgn = (v: number, d = 2) => `${v > 0 ? '+' : v < 0 ? MINUS : ''}${Math.abs(v).toFixed(d)}`;
const span = (c: readonly [number, number]) => `[${sgn(c[0])}, ${sgn(c[1])}]`;
const pct = (v: number) => Math.round(v * 1000) / 10;

const KIND: Record<PriceRouteRow['kind'], string> = { fitted: 'var(--blue)', certified: 'var(--teal)', router: 'var(--blue)' };

function useWidth<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** seconds since `active` first turned on, running until `dur`; replay() starts it again */
function useIntro(active: boolean, dur: number, reduced: boolean) {
  const [t, setT] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setT(dur);
      return;
    }
    let raf = 0;
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const e = Math.max(0, (now - t0) / 1000);
      setT(Math.min(dur, e));
      if (e < dur) raf = requestAnimationFrame(tick);
    };
    setT(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, dur, reduced, run]);
  return [t, () => setRun((r) => r + 1)] as const;
}

const prog = (t: number, start: number, dur: number) => clamp((t - start) / dur);

/** a horizontal bar from x0 to x1, square at the baseline, 4px rounded at the data end */
function barPath(x0: number, x1: number, cy: number, h: number, r = 4) {
  const w = x1 - x0;
  if (w < 0.5) return '';
  const rr = Math.min(r, w, h / 2);
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  return `M${x0},${y0} H${x1 - rr} A${rr},${rr} 0 0 1 ${x1},${y0 + rr} V${y1 - rr} A${rr},${rr} 0 0 1 ${x1 - rr},${y1} H${x0} Z`;
}

/** an HTML label positioned in the chart's pixel space */
function At({ x, y, anchor = 'start', className = '', style, children }: { x: number; y: number; anchor?: 'start' | 'middle' | 'end'; className?: string; style?: CSSProperties; children: ReactNode }) {
  const tx = anchor === 'start' ? '0' : anchor === 'end' ? '-100%' : '-50%';
  return (
    <div className={`pointer-events-none absolute whitespace-nowrap ${className}`} style={{ left: x, top: y, transform: `translate(${tx}, -50%)`, ...style }}>
      {children}
    </div>
  );
}

function Check({ cx, cy, r = 7.5, s = 1 }: { cx: number; cy: number; r?: number; s?: number }) {
  return (
    <g transform={`translate(${cx},${cy}) scale(${s})`}>
      <circle r={r} fill="var(--teal)" stroke="var(--surface)" strokeWidth={2} />
      <path d={`M${-r * 0.42},${0.02 * r} L${-r * 0.1},${r * 0.34} L${r * 0.45},${-r * 0.32}`} fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

type Part = 'routes' | 'image' | 'overhead';

/** Table 5's routes, Table 9's image swaps and the router overhead; `parts` picks which to draw. */
export function PriceRoutes({ parts = ['routes', 'image', 'overhead'] }: { parts?: Part[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const W = useWidth(ref);
  const reduced = useReducedMotion();
  return (
    <div ref={ref}>
      {W > 0 && (
        <>
          {parts.includes('routes') && <RouteChart W={W} reduced={reduced} />}
          {parts.includes('image') && <ImageSwaps W={W} reduced={reduced} />}
          {parts.includes('overhead') && <Overhead W={W} reduced={reduced} />}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (a) Table 5: price routes across testbeds                            */
/* ------------------------------------------------------------------ */

const TESTBEDS = (['code', 'text', 'image', 'robot'] as const).map((g) => {
  const rows = PRICE_ROUTES.filter((r) => r.group === g);
  const [name, bench] = rows[0].testbed.split(' · ');
  return { key: g, name, bench, reference: rows[0].reference, resource: rows[0].resource, rows };
});

const NOTE: Record<string, ReactNode> = {
  'code-fit': (
    <>
      Never calls Opus 4.6: its admission price, <M>{`${PRICE_FACTS.code.lambdaBRel}\\,\\eta_B`}</M>, lies below the floor price, so every task goes to a cheaper
      model. Always calling Qwen3-Max reaches {PRICE_FACTS.code.qwenAlways.eff}× at a {PRICE_FACTS.code.qwenAlways.loss}-point loss.
    </>
  ),
  'code-cert': (
    <>
      Refitted on half of the probing tasks, the fitted floor holds on test in only {pct(PRICE_FACTS.floor.fittedHeld)}% of {PRICE_FACTS.floor.splits} splits;
      certified on the other half, it holds in all {PRICE_FACTS.floor.splits}.
    </>
  ),
  'text-fit': <>The best router that avoids GPT-4 scores {PRICE_FACTS.text.refFreeGap} points below it, so this route cascades cheap primaries to GPT-4.</>,
  'text-cert': <>Certified on the held-out half of the fitting data; the route keeps the floor on test in every one of the 200 halvings.</>,
  'img-05': <>Two of the five benchmarks switch to a cheaper generator (below), cutting test cost by {pct(PRICE_FACTS.image.costCut)}%.</>,
  'img-2': <>A two-point tolerance halves cost.</>,
  robot: (
    <>
      {ROBOT.seconds.router} instead of {ROBOT.seconds.meDex} seconds of policy time per scene, {pct(ROBOT.seconds.saving)}% less, with no loss of success.
    </>
  ),
};

interface RowGeo {
  row: PriceRouteRow;
  i: number;
  top: number;
  bottom: number;
  /** where the marks sit */
  py: number;
  /** narrow layout: the label line */
  ly: number;
}

function chartGeometry(W: number) {
  const wide = W >= 700;
  const rows: RowGeo[] = [];
  const groups: { tb: (typeof TESTBEDS)[number]; top: number; bottom: number }[] = [];
  let i = 0;
  if (wide) {
    const roomy = W >= 820;
    const TB = roomy ? 170 : 152;
    const RL = roomy ? 118 : 112;
    const e0 = TB + RL;
    const txt = W - 136;
    const d1 = txt - 16;
    const avail = d1 - e0 - 34;
    const e1 = e0 + Math.round(avail * (roomy ? 0.56 : 0.5));
    const d0 = e1 + 34;
    const TOP = 44;
    const ROW = 34;
    const GG = 12;
    let y = TOP;
    for (const tb of TESTBEDS) {
      const h = Math.max(tb.rows.length * ROW, 54);
      const pad = (h - tb.rows.length * ROW) / 2;
      tb.rows.forEach((row, k) => {
        const top = y + pad + k * ROW;
        rows.push({ row, i: i++, top, bottom: top + ROW, py: top + ROW / 2, ly: top + ROW / 2 });
      });
      groups.push({ tb, top: y, bottom: y + h });
      y += h + GG;
    }
    const axisY = y - GG + 6;
    return { wide, W, H: axisY + 44, rows, groups, e0, e1, d0, d1, txt, axisY, TB, ex: logScale(1, 50, e0, e1), dx: scale(-3, 3, d0, d1) };
  }
  const mid = Math.round(W / 2);
  const e0 = 0;
  const e1 = mid - 14;
  const d0 = mid + 14;
  const d1 = W;
  const TOP = 40;
  const HEAD = 42;
  const ROW = 48;
  const GG = 10;
  let y = TOP;
  for (const tb of TESTBEDS) {
    const gTop = y;
    y += HEAD;
    tb.rows.forEach((row) => {
      rows.push({ row, i: i++, top: y, bottom: y + ROW, py: y + 33, ly: y + 12 });
      y += ROW;
    });
    groups.push({ tb, top: gTop, bottom: y });
    y += GG;
  }
  const axisY = y - GG + 4;
  return { wide, W, H: axisY + 40, rows, groups, e0, e1, d0, d1, txt: W, axisY, TB: 0, ex: logScale(1, 50, e0, e1), dx: scale(-3, 3, d0, d1) };
}

function RouteChart({ W, reduced }: { W: number; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-60px', true);
  const [t] = useIntro(inView, 2.8, reduced);
  const [hover, setHover] = useState<string | null>(null);
  const G = chartGeometry(W);
  const { wide, ex, dx } = G;
  const EFF_TICKS = [1, 3, 10, 30];
  const DV_TICKS = [-2, -1, 0, 1, 2];
  const grid = prog(t, 0, 0.5);
  const dim = (k: string) => (hover && hover !== k ? 0.3 : 1);

  // gridlines run through the row bands only (in the narrow layout the testbed heads sit between them)
  const bands = wide ? [{ top: G.rows[0].top - 6, bottom: G.axisY }] : G.rows.map((r) => ({ top: r.py - 13, bottom: r.py + 13 }));

  return (
    <div ref={ref}>
      <div className="relative" style={{ height: G.H }}>
        <svg width={W} height={G.H} className="absolute left-0 top-0 overflow-visible" role="img" aria-label="Efficiency and quality change of the price routes on four testbeds (Table 5)">
          {/* row highlight */}
          {G.rows.map((r) => (
            <rect
              key={`hl-${r.row.key}`}
              x={wide ? 0 : -8}
              y={wide ? r.top + 1 : r.top - 2}
              width={wide ? W : W + 16}
              height={wide ? r.bottom - r.top - 2 : r.bottom - r.top + 2}
              rx={8}
              fill="var(--surface-2)"
              opacity={hover === r.row.key ? 1 : 0}
              style={{ transition: 'opacity .25s' }}
            />
          ))}
          {/* testbed separators */}
          {G.groups.slice(1).map((g) => (
            <line key={`sep-${g.tb.key}`} x1={0} x2={W} y1={g.top - (wide ? 6 : 5)} y2={g.top - (wide ? 6 : 5)} stroke="var(--rule)" />
          ))}

          {/* grids */}
          <g opacity={grid}>
            {bands.map((b, bi) => (
              <g key={bi}>
                {/* the reference sits at 1x and at a quality change of 0 */}
                {EFF_TICKS.map((v) => (
                  <line key={`e${v}`} x1={ex(v)} x2={ex(v)} y1={b.top} y2={b.bottom} stroke={v === 1 ? 'var(--amber)' : 'var(--rule)'} strokeWidth={v === 1 ? 1.5 : 1} />
                ))}
                {DV_TICKS.map((v) => (
                  <line key={`d${v}`} x1={dx(v)} x2={dx(v)} y1={b.top} y2={b.bottom} stroke={v === 0 ? 'var(--amber)' : 'var(--rule)'} strokeWidth={v === 0 ? 1.5 : 1} />
                ))}
              </g>
            ))}
            {EFF_TICKS.map((v) => (
              <text key={`et${v}`} x={ex(v)} y={G.axisY + 14} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
                {v}×
              </text>
            ))}
            {DV_TICKS.map((v) => (
              <text key={`dt${v}`} x={dx(v)} y={G.axisY + 14} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
                {v === 0 ? '0' : sgn(v, 0)}
              </text>
            ))}
          </g>

          {/* marks */}
          {G.rows.map((r) => {
            const { row, i, py } = r;
            const col = KIND[row.kind];
            const pb = easeOut(prog(t, 0.2 + 0.09 * i, 1.15));
            const xEnd = ex(1) + (ex(row.eff) - ex(1)) * pb;
            const pd = easeOut(prog(t, 0.65 + 0.09 * i, 0.9));
            const pw = easeOut(prog(t, 1.2 + 0.09 * i, 0.55));
            const xDot = row.dv !== null ? dx(0) + (dx(row.dv) - dx(0)) * pd : 0;
            return (
              <g key={row.key} opacity={dim(row.key)} style={{ transition: 'opacity .25s' }}>
                <path d={barPath(ex(1), xEnd, py, wide ? 14 : 12)} fill={col} />
                {wide && (
                  <text x={ex(row.eff) + 6} y={py + 4} fontSize={11} fill="var(--ink-2)" stroke="var(--surface)" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke" style={mono} opacity={prog(t, 1.05 + 0.09 * i, 0.4)}>
                    {row.eff}×
                  </text>
                )}
                {row.dv !== null && row.ci ? (
                  <g>
                    <g opacity={pw}>
                      <line x1={dx(row.dv) + (dx(row.ci[0]) - dx(row.dv)) * pw} x2={dx(row.dv) + (dx(row.ci[1]) - dx(row.dv)) * pw} y1={py} y2={py} stroke={col} strokeWidth={2} strokeLinecap="round" />
                      <line x1={dx(row.ci[0])} x2={dx(row.ci[0])} y1={py - 4.5} y2={py + 4.5} stroke={col} strokeWidth={2} strokeLinecap="round" opacity={pw >= 0.98 ? 1 : 0} />
                      <line x1={dx(row.ci[1])} x2={dx(row.ci[1])} y1={py - 4.5} y2={py + 4.5} stroke={col} strokeWidth={2} strokeLinecap="round" opacity={pw >= 0.98 ? 1 : 0} />
                    </g>
                    <circle cx={xDot} cy={py} r={4.6} fill={col} stroke="var(--surface)" strokeWidth={2} opacity={prog(t, 0.6 + 0.09 * i, 0.2)} />
                  </g>
                ) : (
                  <Check cx={dx(0) + 11} cy={py} s={easeOut(prog(t, 1.1 + 0.09 * i, 0.45))} />
                )}
              </g>
            );
          })}

          {/* hit targets */}
          {G.rows.map((r) => (
            <rect
              key={`hit-${r.row.key}`}
              x={0}
              y={r.top}
              width={W}
              height={r.bottom - r.top}
              fill="transparent"
              onMouseEnter={() => setHover(r.row.key)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        {/* panel titles */}
        <At x={G.e0} y={14} className="font-sans text-[12.5px] font-semibold text-ink">
          Efficiency <M className="ml-0.5 font-normal">{'\\eta/\\eta_B'}</M>
        </At>
        <At x={G.d0} y={14} className="font-sans text-[12.5px] font-semibold text-ink">
          Quality change <M className="ml-0.5 font-normal">{'\\Delta V'}</M>
        </At>
        {wide && (
          <At x={G.txt} y={14} className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">
            points, 95% CI
          </At>
        )}
        <At x={G.e1} y={G.axisY + 31} anchor="end" className="font-sans text-[11px] text-ink-3">
          against the reference, log scale
        </At>
        <At x={G.d1} y={G.axisY + 31} anchor="end" className="font-sans text-[11px] text-ink-3">
          points on a 0–100 scale
        </At>

        {/* testbed heads */}
        {G.groups.map((g) => {
          const faded = hover && !g.tb.rows.some((r) => r.key === hover) ? 0.3 : 1;
          const ref = (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-ink-2">
              <span className="inline-block h-[7px] w-[7px] rounded-[2px]" style={{ background: 'var(--amber)' }} />
              {g.tb.reference}
            </span>
          );
          return wide ? (
            <div key={g.tb.key} className="pointer-events-none absolute left-0 transition-opacity duration-300" style={{ top: g.top + (g.bottom - g.top) / 2, transform: 'translateY(-50%)', width: G.TB - 12, opacity: faded }}>
              <div className="font-sans text-[13.5px] font-semibold leading-tight text-ink">
                {g.tb.name} <span className="font-normal text-ink-3">({g.tb.resource})</span>
              </div>
              {g.tb.bench && <div className="mt-[2px] font-sans text-[12px] leading-tight text-ink-2">{g.tb.bench}</div>}
              <div className="mt-[5px]">{ref}</div>
            </div>
          ) : (
            <div key={g.tb.key} className="pointer-events-none absolute left-0 right-0 transition-opacity duration-300" style={{ top: g.top, opacity: faded }}>
              <div className="font-sans text-[13px] font-semibold leading-tight text-ink">
                {g.tb.name}
                {g.tb.bench && <span className="font-normal text-ink-2"> · {g.tb.bench}</span>} <span className="font-normal text-ink-3">({g.tb.resource})</span>
              </div>
              <div className="mt-[4px]">{ref}</div>
            </div>
          );
        })}

        {/* route labels and values */}
        {G.rows.map((r) => {
          const { row, i } = r;
          const label = (
            <span className="inline-flex items-center gap-2 font-sans text-[12.5px] text-ink-2">
              <span className="inline-block h-[9px] w-[9px] rounded-[2.5px]" style={{ background: KIND[row.kind] }} />
              <RouteName route={row.route} />
            </span>
          );
          const value =
            row.dv !== null && row.ci ? (
              <span className="num">
                <span className="text-[11.5px] text-ink">{sgn(row.dv)}</span> <span className="text-[10.5px] text-ink-3">{span(row.ci)}</span>
              </span>
            ) : (
              <span className="num text-[11px] text-ink-2">{row.held}</span>
            );
          const fade = { opacity: dim(row.key) * prog(t, 1.1 + 0.09 * i, 0.45), transition: 'opacity .25s' };
          return wide ? (
            <div key={row.key}>
              <At x={G.TB} y={r.py} style={{ opacity: dim(row.key), transition: 'opacity .25s' }}>
                {label}
              </At>
              <At x={G.txt} y={r.py} style={fade}>
                {value}
              </At>
            </div>
          ) : (
            <div key={row.key}>
              <At x={0} y={r.ly} style={{ opacity: dim(row.key), transition: 'opacity .25s' }}>
                {label}
              </At>
              <At x={W} y={r.ly} anchor="end" style={fade}>
                <span className="num text-[11px] text-ink">{row.eff}×</span>
                <span className="mx-1.5 text-ink-4">·</span>
                {value}
              </At>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-[11.5px] text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[12px] w-[1.5px]" style={{ background: 'var(--amber)' }} />
          reference: <span className="num text-[10.5px]">1×</span>, <M>{'\\Delta V=0'}</M>
        </span>
        <Key color="var(--blue)">fitted route or router</Key>
        <Key color="var(--teal)">certified route, median of 200 halvings</Key>
        <span className="flex items-center gap-1.5">
          <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden>
            <line x1={2} x2={24} y1={5} y2={5} stroke="var(--ink-3)" strokeWidth={2} strokeLinecap="round" />
            <line x1={2} x2={2} y1={1} y2={9} stroke="var(--ink-3)" strokeWidth={2} strokeLinecap="round" />
            <line x1={24} x2={24} y1={1} y2={9} stroke="var(--ink-3)" strokeWidth={2} strokeLinecap="round" />
            <circle cx={11} cy={5} r={3.6} fill="var(--ink-3)" stroke="var(--surface)" strokeWidth={1.5} />
          </svg>
          paired 95% interval
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden>
            <Check cx={0} cy={0} r={6.5} />
          </svg>
          floor held in 200 of 200
        </span>
      </div>

      {/* read-out: all messages share one grid cell, so the longest sets the height and hovering never moves the page */}
      <div className="mt-3 grid border-t border-rule pt-2.5 font-sans text-[12.5px] leading-[1.55] text-ink-2">
        <p className="text-ink-3 transition-opacity duration-200" style={{ gridArea: '1 / 1', opacity: hover ? 0 : 1 }} aria-hidden={!!hover}>
          Each route is measured against its testbed’s{' '}
          <span className="whitespace-nowrap">
            reference <span className="mx-[2px] inline-block h-[7px] w-[7px] rounded-[2px] align-middle" style={{ background: 'var(--amber)' }} />.
          </span>{' '}
          Fitted routes meet the floor on fitting data; certified routes are medians over 200 random halvings of it. Hover a route for what it does.
        </p>
        {PRICE_ROUTES.map((row) => (
          <p key={row.key} className="transition-opacity duration-200" style={{ gridArea: '1 / 1', opacity: hover === row.key ? 1 : 0 }} aria-hidden={hover !== row.key}>
            <b className="font-semibold text-ink">
              {row.testbed}, <RouteName route={row.route} lower />:
            </b>{' '}
            <span className="num">{row.eff}×</span> the reference’s efficiency{' '}
            {row.dv !== null && row.ci ? (
              <>
                at <span className="num">{sgn(row.dv)}</span> points <span className="num text-ink-3">{span(row.ci)}</span>.
              </>
            ) : (
              <>
                (median), with <M>{'\\Delta V\\ge 0'}</M> on test in 200 of 200 halvings.
              </>
            )}{' '}
            <span className="text-ink-3">{NOTE[row.key]}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

/** "Fitted, ε = 0" with the tolerance set as maths, as in the paper */
function RouteName({ route, lower = false }: { route: string; lower?: boolean }) {
  const [what, eps] = route.split(', ');
  const name = lower ? what.charAt(0).toLowerCase() + what.slice(1) : what;
  return (
    <span>
      {name}
      {eps && (
        <>
          , <M>{eps.replace('ε', '\\epsilon')}</M>
        </>
      )}
    </span>
  );
}

function Key({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-[9px] w-[9px] rounded-[2.5px]" style={{ background: color }} />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* (b) Table 9: what the half-point image route moved                   */
/* ------------------------------------------------------------------ */

const SWITCHED = IMAGE_ROUTE.filter((r) => r.route.candidate !== r.fixed.candidate);
const PROMPTS = IMAGE_ROUTE.reduce((s, r) => s + r.prompts, 0);
const ROUTE_05 = PRICE_ROUTES.find((r) => r.key === 'img-05')!;
const fmtN = (n: number) => n.toLocaleString('en-US');
const swapAt = (k: number) => 0.75 + 0.6 * k;

function ImageSwaps({ W, reduced }: { W: number; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-80px', true);
  const [t, replay] = useIntro(inView, 4.6, reduced);
  const [hover, setHover] = useState<number | null>(null);
  const wide = W >= 640;

  const Q = wide ? 172 : 0;
  const P0 = wide ? 178 : 6;
  const P1 = wide ? W - Q - 44 : W - 10;
  const px = scale(0, 220, P0, P1);
  const TOP = wide ? 26 : 8;
  const ROW = wide ? 60 : 76;
  const axisY = TOP + IMAGE_ROUTE.length * ROW + 2;
  const H = axisY + 34;

  const rows = IMAGE_ROUTE.map((r, i) => {
    const top = TOP + i * ROW;
    const cy = wide ? top + 35 : top + 54;
    const k = SWITCHED.indexOf(r);
    const moved = k >= 0;
    const xf = px(r.fixed.m);
    const xr = px(r.route.m);
    const q = moved ? easeInOut(prog(t, swapAt(k), 1.25)) : 0;
    const near = Math.abs(xf - xr) < 150;
    // labels near the right edge hang to the left of their mark
    const side = (xx: number): 'start' | 'middle' | 'end' => (xx + 70 > P1 + 30 ? 'end' : xx - 70 < P0 - 10 ? 'start' : 'middle');
    return {
      r,
      i,
      top,
      cy,
      k,
      moved,
      xf,
      xr,
      q,
      x: xf + (xr - xf) * q,
      near,
      fixedAnchor: moved && near ? ('start' as const) : side(xf),
      routeAnchor: near ? ('end' as const) : side(xr),
      show: prog(t, 0.1 + 0.07 * i, 0.4),
      arrive: moved ? prog(t, swapAt(k) + 0.8, 0.5) : 0,
      done: moved ? prog(t, swapAt(k) + 1.1, 0.45) : 0,
      dim: hover !== null && hover !== i ? 0.3 : 1,
    };
  });

  return (
    <div ref={ref} className="mt-11">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-2">What the half-point image route moved · Table 9</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[11.5px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden>
              <circle r={4.2} fill="var(--surface)" stroke="var(--amber)" strokeWidth={2} />
            </svg>
            fixed generator
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden>
              <circle r={4.6} fill="var(--blue)" />
            </svg>
            route’s generator
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden>
              <circle r={4.6} fill="var(--amber)" />
            </svg>
            kept
          </span>
          <button
            type="button"
            onClick={replay}
            className="rounded-full border border-rule px-2.5 py-[3px] font-sans text-[11px] text-ink-2 transition-colors hover:border-blue hover:text-blue"
          >
            Replay
          </button>
        </span>
      </div>

      <div className="relative mt-3" style={{ height: H }}>
        <svg width={W} height={H} className="absolute left-0 top-0 overflow-visible" role="img" aria-label="Fixed generator and half-point route on five image benchmarks: price per image and test quality (Table 9)">
          {rows.map((g) => (
            <rect key={`hl-${g.i}`} x={wide ? 0 : -8} y={g.top + 2} width={wide ? W : W + 16} height={ROW - 4} rx={8} fill="var(--surface-2)" opacity={hover === g.i ? 1 : 0} style={{ transition: 'opacity .25s' }} />
          ))}
          {[0, 50, 100, 150, 200].map((v) => (
            <g key={v}>
              {wide ? (
                <line x1={px(v)} x2={px(v)} y1={TOP} y2={axisY} stroke={v === 0 ? 'var(--ink-4)' : 'var(--rule)'} />
              ) : (
                rows.map((g) => <line key={g.i} x1={px(v)} x2={px(v)} y1={g.cy - 11} y2={g.cy + 11} stroke={v === 0 ? 'var(--ink-4)' : 'var(--rule)'} />)
              )}
              <text x={px(v)} y={axisY + 14} textAnchor="middle" fontSize={10.5} fill="var(--ink-3)" style={mono}>
                {v}
              </text>
            </g>
          ))}
          {rows.map((g) => (
            <g key={g.r.bench} opacity={g.dim} style={{ transition: 'opacity .25s' }}>
              {g.moved ? (
                <g opacity={g.show}>
                  {/* the trail from the fixed generator's price to the route's */}
                  <line x1={g.xf - 6} x2={Math.min(g.xf - 6, g.x + 6)} y1={g.cy} y2={g.cy} stroke="var(--blue)" strokeWidth={1.6} strokeOpacity={0.5} />
                  {Math.abs(g.xf - g.x) > 24 && (
                    <path d={`M${g.x + 14},${g.cy - 4} L${g.x + 9.5},${g.cy} L${g.x + 14},${g.cy + 4}`} fill="none" stroke="var(--blue)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.75} />
                  )}
                  <circle cx={g.xf} cy={g.cy} r={5} fill={g.q > 0.12 ? 'var(--surface)' : 'var(--amber)'} stroke="var(--amber)" strokeWidth={2} style={{ transition: 'fill .35s' }} />
                  <circle cx={g.x} cy={g.cy} r={5.4} fill="var(--blue)" stroke="var(--surface)" strokeWidth={2} opacity={clamp(g.q / 0.1)} />
                </g>
              ) : (
                <circle cx={g.xf} cy={g.cy} r={5} fill="var(--amber)" stroke="var(--amber)" strokeWidth={2} opacity={g.show} />
              )}
              <rect x={0} y={g.top} width={W} height={ROW} fill="transparent" onMouseEnter={() => setHover(g.i)} onMouseLeave={() => setHover(null)} />
            </g>
          ))}
        </svg>

        {wide && (
          <>
            <At x={0} y={7} className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3">
              Benchmark
            </At>
            <At x={P0} y={7} className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3">
              Generator
            </At>
            <At x={W - Q} y={7} className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3">
              Test quality
            </At>
          </>
        )}
        <At x={P1} y={axisY + 30} anchor="end" className="font-sans text-[11px] text-ink-3">
          m$ per image
        </At>

        {rows.map((g) => {
          const { r } = g;
          const dq = r.route.q - r.fixed.q;
          const delta = (
            <span className="inline-flex items-center gap-1.5">
              <svg width="8" height="7" viewBox="0 0 8 7" aria-hidden>
                <path d="M0.5,0.5 H7.5 L4,6.5 Z" fill="var(--coral)" />
              </svg>
              {sgn(dq)} points
            </span>
          );
          const fade = { opacity: g.dim, transition: 'opacity .25s' };
          if (wide) {
            return (
              <div key={r.bench} style={fade}>
                <At x={0} y={g.top + 30} style={{ opacity: g.show }}>
                  <div className={`font-sans text-[13px] leading-tight ${g.moved ? 'font-semibold text-ink' : 'text-ink-2'}`}>{r.bench}</div>
                  <div className="num mt-[5px] text-[10.5px] leading-none text-ink-3">{fmtN(r.prompts)} test prompts</div>
                </At>
                {/* candidate labels ride with their marks */}
                <At x={g.moved && g.near ? (g.xf + g.xr) / 2 + 5 : g.xf} y={g.cy - 16} anchor={g.fixedAnchor} style={{ opacity: g.show }}>
                  <ArmTag candidate={r.fixed.candidate} m={r.fixed.m} tone={g.moved && g.q > 0.02 ? 'muted' : 'normal'} />
                </At>
                {g.moved && (
                  <>
                    <At x={g.near ? (g.xf + g.xr) / 2 - 5 : g.xr} y={g.cy - 16} anchor={g.routeAnchor} style={{ opacity: g.arrive }}>
                      <ArmTag candidate={r.route.candidate} m={r.route.m} tone="strong" />
                    </At>
                    <At x={g.near ? g.xf + 12 : (g.xf + g.xr) / 2} y={g.cy + (g.near ? 0 : 15)} anchor={g.near ? 'start' : 'middle'} className="num text-[10.5px] text-ink-2" style={{ opacity: g.done }}>
                      {sgn(r.route.m - r.fixed.m, 1)} m$
                    </At>
                  </>
                )}
                <At x={W - Q} y={g.top + 30} style={{ opacity: g.show }}>
                  <div className="num leading-none">
                    <span className={`text-[12px] ${g.moved ? 'text-ink-3' : 'text-ink-2'}`}>{r.fixed.q.toFixed(2)}</span>
                    {g.moved && (
                      <span style={{ opacity: g.done }}>
                        <span className="mx-1 text-ink-4">→</span>
                        <span className="text-[12px] text-ink">{r.route.q.toFixed(2)}</span>
                      </span>
                    )}
                  </div>
                  <div className={`mt-[6px] font-mono text-[10.5px] leading-none ${g.moved ? 'text-ink-2' : 'text-ink-4'}`} style={{ opacity: g.moved ? g.done : 1 }}>
                    {g.moved ? delta : 'kept'}
                  </div>
                </At>
              </div>
            );
          }
          return (
            <div key={r.bench} style={fade}>
              <At x={0} y={g.top + 12} style={{ opacity: g.show }}>
                <span className={`font-sans text-[12.5px] ${g.moved ? 'font-semibold text-ink' : 'text-ink-2'}`}>{r.bench}</span>
              </At>
              <At x={W} y={g.top + 12} anchor="end" className="num text-[11px] text-ink-2" style={{ opacity: g.show }}>
                {r.fixed.q.toFixed(2)}
                {g.moved && (
                  <span style={{ opacity: g.done }}>
                    {' → '}
                    <span className="text-ink">{r.route.q.toFixed(2)}</span>
                    <span className="ml-1.5 inline-flex items-center gap-1 text-ink-2">
                      <svg width="7" height="6" viewBox="0 0 8 7" aria-hidden>
                        <path d="M0.5,0.5 H7.5 L4,6.5 Z" fill="var(--coral)" />
                      </svg>
                      {sgn(dq)}
                    </span>
                  </span>
                )}
              </At>
              <At x={0} y={g.top + 31} className="font-sans text-[11.5px] text-ink-2" style={{ opacity: g.show }}>
                {r.fixed.candidate} <span className="num text-[10.5px] text-ink-3">{r.fixed.m.toFixed(1)}</span>
                {g.moved ? (
                  <span style={{ opacity: g.arrive }}>
                    <span className="mx-1 text-ink-4">→</span>
                    <span className="font-medium text-ink">{r.route.candidate}</span> <span className="num text-[10.5px] text-ink-3">{r.route.m.toFixed(1)}</span>
                  </span>
                ) : (
                  <span className="text-ink-4"> · kept</span>
                )}
              </At>
            </div>
          );
        })}
      </div>

      <Pooled t={t} start={swapAt(SWITCHED.length - 1) + 1.45} wide={wide} />
    </div>
  );
}

function ArmTag({ candidate, m, tone }: { candidate: string; m: number; tone: 'normal' | 'muted' | 'strong' }) {
  return (
    <span className="font-sans text-[11.5px] leading-none">
      <span className={tone === 'strong' ? 'font-medium text-ink' : tone === 'muted' ? 'text-ink-3' : 'text-ink-2'} style={{ transition: 'color .4s' }}>
        {candidate}
      </span>
      <span className="num ml-1 text-[10.5px] text-ink-3">{m.toFixed(1)}</span>
    </span>
  );
}

function Pooled({ t, start, wide }: { t: number; start: number; wide: boolean }) {
  const cut = PRICE_FACTS.image.costCut;
  const p = easeInOut(prog(t, start, 1.1));
  // the strip is there from the start at the fixed generators' cost; it shrinks once both swaps land
  const show = prog(t, 0.45, 0.5);
  const done = prog(t, start + 0.9, 0.4);
  return (
    <div className="mt-3 rounded-[12px] border border-rule bg-surface-2 px-4 py-3.5" style={{ opacity: Math.max(0.0001, show) }}>
      <div className={`grid items-center gap-x-6 gap-y-3 ${wide ? 'grid-cols-[132px_minmax(0,1fr)_auto]' : 'grid-cols-1'}`}>
        <div>
          <div className="font-sans text-[13px] font-semibold text-ink">Pooled</div>
          <div className="num mt-[3px] text-[10.5px] text-ink-3">{fmtN(PROMPTS)} test prompts</div>
        </div>
        <div>
          <div className="relative h-[14px]">
            {/* the fixed generators' cost is the whole track */}
            <div className="absolute inset-y-0 left-0 right-0 rounded-r-[4px] border border-amber/50 bg-amber-wash" />
            <div className="absolute inset-y-0 left-0 rounded-r-[4px] bg-blue" style={{ width: `${100 - cut * 100 * p}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between font-sans text-[11px] text-ink-3">
            <span>half-point route</span>
            <span>fixed generators = 100%</span>
          </div>
        </div>
        <div className="flex items-baseline gap-5" style={{ opacity: done }}>
          <div>
            <div className="font-display text-[30px] font-semibold leading-none text-ink">{MINUS}{pct(cut)}%</div>
            <div className="mt-1 font-sans text-[11px] text-ink-3">test cost</div>
          </div>
          <div>
            <div className="font-display text-[30px] font-semibold leading-none text-ink">{sgn(PRICE_FACTS.image.loss * -1)}</div>
            <div className="mt-1 font-sans text-[11px] text-ink-3">
              points <span className="num text-[10.5px]">{span(ROUTE_05.ci!)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (c) router overhead against generation time                          */
/* ------------------------------------------------------------------ */

function Overhead({ W, reduced }: { W: number; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-40px', true);
  const [t] = useIntro(inView, 1.8, reduced);
  const o = PRICE_FACTS.overhead;
  const wide = W >= 640;
  const X0 = wide ? 178 : 6;
  const X1 = W - (wide ? 16 : 10);
  const x = logScale(0.1, 1000, X0, X1);
  const cy = wide ? 30 : 12;
  const H = wide ? 52 : 34;
  const bands = [
    { key: 'image', label: 'an image', r: o.imageSeconds, d: 0.35 },
    { key: 'video', label: 'a video', r: o.videoSeconds, d: 0.55 },
  ];
  const pop = easeOut(prog(t, 0.1, 0.45));
  const xr = x(o.routerSeconds);
  const routerLabel = (
    <>
      router <span className="num text-[10.5px] text-ink-3">{o.routerSeconds} s</span>
    </>
  );
  const bandLabel = (b: (typeof bands)[number]) => (
    <>
      {b.label}{' '}
      <span className="num text-[10.5px] text-ink-3">
        {b.r[0]}–{b.r[1]} s
      </span>
    </>
  );
  return (
    <div ref={ref} className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-2">Router overhead</span>
        <span className="font-sans text-[11.5px] text-ink-3">
          a 4B router decides in {o.routerSeconds} s on one {o.gpu} GPU
        </span>
      </div>
      <div className="relative mt-2" style={{ height: H }}>
        {wide && (
          <div className="absolute left-0 -translate-y-1/2 font-sans text-[12px] leading-snug text-ink-2" style={{ top: cy }}>
            Seconds per output
            <div className="text-[11px] text-ink-3">log scale</div>
          </div>
        )}
        <svg width={W} height={H} className="absolute left-0 top-0 overflow-visible" role="img" aria-label={`Router decision ${o.routerSeconds} seconds against ${o.imageSeconds.join('–')} seconds per image and ${o.videoSeconds.join('–')} seconds per video`}>
          <line x1={X0} x2={X1} y1={cy} y2={cy} stroke="var(--rule-2)" />
          {[0.1, 1, 10, 100, 1000].map((v) => (
            <g key={v}>
              <line x1={x(v)} x2={x(v)} y1={cy - 3} y2={cy + 3} stroke="var(--ink-4)" />
              <text x={x(v)} y={cy + 17} textAnchor={v === 1000 && !wide ? 'end' : v === 0.1 && !wide ? 'start' : 'middle'} dx={v === 1000 && !wide ? 6 : v === 0.1 && !wide ? -4 : 0} fontSize={10} fill="var(--ink-3)" style={mono}>
                {v >= 1000 ? '1,000' : v} s
              </text>
            </g>
          ))}
          {bands.map((b) => {
            const p = easeOut(prog(t, b.d, 0.8));
            const a = x(b.r[0]);
            const w = (x(b.r[1]) - a) * p;
            return <rect key={b.key} x={a} y={cy - 5} width={Math.max(0, w)} height={10} rx={Math.min(5, w / 2)} fill="var(--slate)" opacity={p > 0 ? 0.8 : 0} />;
          })}
          <circle cx={xr} cy={cy} r={5 * pop} fill="var(--blue)" stroke="var(--surface)" strokeWidth={2} />
        </svg>
        {wide && (
          <>
            <At x={xr - 3} y={cy - 16} className="font-sans text-[11.5px] text-ink-2" style={{ opacity: prog(t, 0.2, 0.4) }}>
              {routerLabel}
            </At>
            {bands.map((b, i) => (
              <At
                key={b.key}
                x={i === 0 ? x(b.r[1]) : x(b.r[0])}
                y={cy - 16}
                anchor={i === 0 ? 'end' : 'start'}
                className="font-sans text-[11.5px] text-ink-2"
                style={{ opacity: prog(t, b.d + 0.5, 0.4) }}
              >
                {bandLabel(b)}
              </At>
            ))}
          </>
        )}
      </div>
      {!wide && (
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11.5px] text-ink-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[9px] w-[9px] rounded-full" style={{ background: 'var(--blue)' }} />
            {routerLabel}
          </span>
          {bands.map((b) => (
            <span key={b.key} className="flex items-center gap-1.5">
              <span className="inline-block h-[8px] w-[16px] rounded-full" style={{ background: 'var(--slate)', opacity: 0.8 }} />
              {bandLabel(b)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
