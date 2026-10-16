import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { ACTIONS, ETA_STAR, argmaxAt, dinkelbach, net, pricePath, ratio, type Action } from '@/lib/envelope';
import { clamp, easeInOut, lerp, seg, useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { tex } from '@/lib/tex';
import { TexLabel } from './svg';

// geometry (viewBox units)
const VW = 700;
const VH = 520;
const L = 64;
const R = 672;
const T = 34;
const B = 444;
const LMAX = 4.6;
const YMAX = 1.08;
const YMIN = -0.32;
const X = (l: number) => L + (l / LMAX) * (R - L);
const Y = (y: number) => T + ((YMAX - y) / (YMAX - YMIN)) * (B - T);
const Y0 = Y(0);

// timeline (seconds)
const LINE0 = 0.15;
const LINE_STAGGER = 0.11;
const LINE_DUR = 0.95;
const ENV0 = 1.25;
const ENV_DUR = 1.5;
const HOP0 = 3.0;
const HOP_DUR = 2.05;
const HOLD = 3.6;
const FADE = 0.9;

const steps = dinkelbach(1).filter((s) => Math.abs(s.next - s.l) > 1e-9);
const HOPS_END = HOP0 + steps.length * HOP_DUR;
const LOOP_START = HOP0 - 0.35;
const LOOP_LEN = HOPS_END + HOLD + FADE - LOOP_START;

const lineEnd = (u: Action) => Math.min(LMAX, (u.v - YMIN) / u.c);

function envelopePoints(to = ETA_STAR) {
  const pts: [number, number][] = [];
  for (const p of pricePath(to)) {
    if (!pts.length) pts.push([p.from, net(p.u, p.from)]);
    pts.push([p.to, net(p.u, p.to)]);
  }
  return pts;
}

/** SVG text with an italic math symbol and an optional subscript, set in KaTeX's fonts */
function SvgSym({ x, y, sym, sub, sup, size = 15, anchor = 'middle', fill = 'currentColor', weight }: {
  x: number;
  y: number;
  sym: string;
  sub?: string;
  sup?: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  fill?: string;
  weight?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={size} fontWeight={weight} style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontStyle: 'italic' }}>
      {sym}
      {sub && (
        <tspan dy={size * 0.28} fontSize={size * 0.68} style={{ fontFamily: 'KaTeX_Main, serif', fontStyle: 'normal' }}>
          {sub}
        </tspan>
      )}
      {sup && (
        <tspan dy={sub ? -size * 0.7 : -size * 0.42} fontSize={size * 0.68} style={{ fontFamily: 'KaTeX_Main, serif', fontStyle: 'normal' }}>
          {sup}
        </tspan>
      )}
    </text>
  );
}

interface Props {
  className?: string;
  /** show the hover read-out chip */
  readout?: boolean;
}

/**
 * Fig. 0. Every action is a line v - lambda c. At a price lambda the router takes the highest
 * line; an action's efficiency v/c is where its line crosses zero. Dinkelbach's iteration (Newton's
 * method on Phi) walks from eta_B to eta*. One schematic state.
 */
export function DinkelbachFigure({ className = '', readout = true }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(wrapRef, '80px');
  const reduced = useReducedMotion();
  const [hoverL, setHoverL] = useState<number | null>(null);
  const [clock] = useClock(inView && hoverL === null && !reduced);

  // static figure for reduced motion: everything drawn, construction complete
  const t = reduced ? HOPS_END + 0.5 : clock < LOOP_START ? clock : LOOP_START + ((clock - LOOP_START) % LOOP_LEN);
  const constructionAlpha = reduced ? 1 : 1 - seg(t, HOPS_END + HOLD, FADE * 0.8);

  const env = useMemo(() => envelopePoints(), []);
  const envPath = useMemo(() => env.map(([l, y], i) => `${i ? 'L' : 'M'}${X(l).toFixed(2)},${Y(y).toFixed(2)}`).join(' '), [env]);
  const areaPath = useMemo(() => `${envPath} L${X(ETA_STAR).toFixed(2)},${Y0.toFixed(2)} L${X(0).toFixed(2)},${Y0.toFixed(2)} Z`, [envPath]);

  const envProgress = reduced ? 1 : seg(t, ENV0, ENV_DUR);

  // which hop is live, for the highlighted line
  let activeHop = -1;
  steps.forEach((_, k) => {
    if (t >= HOP0 + k * HOP_DUR) activeHop = k;
  });
  const hoverBest = hoverL !== null ? argmaxAt(hoverL) : null;
  const highlighted = hoverBest ? hoverBest.id : activeHop >= 0 && constructionAlpha > 0.02 ? steps[activeHop].u.id : null;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * VW;
    if (vx < L - 10 || vx > R + 10) return setHoverL(null);
    setHoverL(clamp(((vx - L) / (R - L)) * LMAX, 0.02, LMAX));
  };

  const finalPulse = seg(t, HOPS_END, 0.6);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="h-auto w-full select-none overflow-visible"
        role="img"
        aria-label="Schematic: eight actions drawn as lines of net value against price. Their upper envelope is convex and decreasing. Dinkelbach's iteration starts at the reference efficiency and reaches the optimum eta star in four steps."
        onPointerMove={onMove}
        onPointerLeave={() => setHoverL(null)}
      >
        <defs>
          <linearGradient id="dk-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
          <filter id="dk-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id="dk-clip">
            <rect x={L} y={T - 6} width={R - L} height={B - T + 6} />
          </clipPath>
        </defs>

        {/* axes */}
        <g stroke="var(--ink-4)" strokeWidth={1}>
          <line x1={L} y1={T - 8} x2={L} y2={B} />
        </g>
        <line x1={L} y1={Y0} x2={R + 6} y2={Y0} stroke="var(--ink-2)" strokeWidth={1.2} />
        <text x={L + 8} y={Y0 + 16} textAnchor="start" fill="var(--ink-3)" fontSize={10} letterSpacing={1.4} style={{ fontFamily: 'var(--font-mono)' }}>
          0
        </text>
        <text
          x={18}
          y={(T + Y0) / 2}
          transform={`rotate(-90 18 ${(T + Y0) / 2})`}
          textAnchor="middle"
          fill="var(--ink-3)"
          fontSize={12.5}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          net value v − λc
        </text>
        <text x={R} y={B + 40} textAnchor="end" fill="var(--ink-3)" fontSize={12.5} style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          price λ, in units of the reference efficiency →
        </text>

        {/* area under the envelope: Phi(lambda) > 0, some router still beats this price */}
        <path d={areaPath} fill="url(#dk-area)" opacity={envProgress} />

        {/* the action lines */}
        <g clipPath="url(#dk-clip)">
          {ACTIONS.map((u, i) => {
            const p = reduced ? 1 : seg(t, LINE0 + i * LINE_STAGGER, LINE_DUR);
            const l1 = lineEnd(u);
            const isHi = highlighted === u.id;
            const color = u.reference ? 'var(--amber)' : isHi ? 'var(--blue)' : 'var(--ink)';
            const op = u.reference ? 0.95 : isHi ? 1 : u.dominated ? 0.2 : 0.34;
            const x2 = X(lerp(0, l1, p));
            const y2 = Y(lerp(u.v, net(u, l1), p));
            return (
              <line
                key={u.id}
                x1={X(0)}
                y1={Y(u.v)}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeOpacity={op}
                strokeWidth={isHi ? 2.4 : u.reference ? 1.8 : 1.2}
                strokeLinecap="round"
                style={{ transition: 'stroke-width .25s, stroke-opacity .25s' }}
              />
            );
          })}
        </g>

        {/* envelope Phi: glow + stroke */}
        <path d={envPath} fill="none" stroke="var(--accent)" strokeWidth={7} strokeOpacity={0.22} filter="url(#dk-glow)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - envProgress} />
        <path d={envPath} fill="none" stroke="var(--accent)" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - envProgress} />
        {envProgress > 0.98 && (
          <g opacity={seg(t, ENV0 + ENV_DUR - 0.1, 0.5)}>
            <TexLabel x={X(0.66) + 6} y={Y(net(ACTIONS[2], 0.66)) - 24} t="\Phi(\lambda)" anchor="start" size={19} color="var(--accent)" w={80} h={30} />
          </g>
        )}

        {/* action labels at lambda = 0 */}
        {ACTIONS.map((u, i) => {
          const p = reduced ? 1 : seg(t, LINE0 + i * LINE_STAGGER + 0.2, 0.5);
          const isHi = highlighted === u.id;
          const yy = Y(u.v) + 5 + (u.id === 'B' ? -4 : u.id === 'u1' ? 4 : 0);
          return (
            <g key={u.id} opacity={p * (u.dominated && !isHi ? 0.45 : 1)}>
              {u.reference ? (
                <SvgSym x={L - 12} y={yy} sym="B" size={15} anchor="end" fill="var(--amber)" />
              ) : (
                <SvgSym x={L - 12} y={yy} sym="u" sub={u.label.slice(1)} size={14} anchor="end" fill={isHi ? 'var(--blue)' : 'var(--ink-2)'} />
              )}
            </g>
          );
        })}

        {/* efficiencies v/c: where each undominated line crosses zero */}
        {ACTIONS.filter((u) => !u.dominated).map((u, i) => {
          const p = reduced ? 1 : seg(t, ENV0 + 0.2 + i * 0.08, 0.4);
          return <line key={u.id} x1={X(ratio(u))} y1={Y0 - 4} x2={X(ratio(u))} y2={Y0 + 4} stroke={u.reference ? 'var(--amber)' : 'var(--ink-3)'} strokeWidth={1.2} opacity={p} />;
        })}

        {/* eta_B tick label */}
        <g opacity={reduced ? 1 : seg(t, ENV0 + 0.3, 0.5)}>
          <SvgSym x={X(1)} y={Y0 + 24} sym="η" sub="B" size={15} fill="var(--amber)" />
        </g>

        {/* Dinkelbach construction */}
        <g opacity={constructionAlpha} style={{ pointerEvents: 'none' }}>
          {steps.map((s, k) => {
            const start = HOP0 + k * HOP_DUR;
            if (t < start - 0.05) return null;
            const rise = easeInOut(seg(t, start, 0.55));
            const slide = easeInOut(seg(t, start + 0.62, 0.95));
            const land = seg(t, start + 1.45, 0.45);
            const J = net(s.u, s.l);
            const xs = X(s.l);
            const lx = lerp(s.l, s.next, slide);
            const isLast = k === steps.length - 1;
            return (
              <g key={k}>
                {/* up to the envelope */}
                <line x1={xs} y1={Y0} x2={xs} y2={lerp(Y0, Y(J), rise)} stroke="var(--accent)" strokeWidth={1.3} strokeDasharray="3 4" />
                {/* along the chosen line down to its zero */}
                {slide > 0 && <line x1={xs} y1={Y(J)} x2={X(lx)} y2={Y(net(s.u, lx))} stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" />}
                {rise > 0.98 && <circle cx={xs} cy={Y(J)} r={4} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.8} />}
                {slide > 0 && slide < 1 && <circle cx={X(lx)} cy={Y(net(s.u, lx))} r={4.6} fill="var(--accent)" />}
                {/* landing marker */}
                {land > 0 && (
                  <g opacity={land}>
                    <circle cx={X(s.next)} cy={Y0} r={isLast ? 6 + 10 * (1 - finalPulse) * (finalPulse > 0 ? 1 : 0) : 4.2} fill={isLast ? 'none' : 'var(--accent)'} stroke="var(--accent)" strokeWidth={isLast ? 1.5 : 0} opacity={isLast ? 0.6 + 0.4 * finalPulse : 1} />
                    {isLast ? (
                      <circle cx={X(s.next)} cy={Y0} r={5.2} fill="var(--accent)" />
                    ) : (
                      <SvgSym x={X(s.next)} y={Y0 + 24} sym="λ" sub={String(k + 1)} size={14} fill="var(--accent)" />
                    )}
                  </g>
                )}
              </g>
            );
          })}
          {/* lambda_0 */}
          {t > HOP0 - 0.3 && (
            <g opacity={seg(t, HOP0 - 0.3, 0.3)}>
              <circle cx={X(1)} cy={Y0} r={4.2} fill="var(--accent)" />
              <SvgSym x={X(1)} y={Y0 + 44} sym="λ" sub="0" size={13} fill="var(--accent)" />
            </g>
          )}
        </g>

        {/* eta* : always labelled once the envelope is drawn */}
        <g opacity={reduced ? 1 : seg(t, ENV0 + ENV_DUR - 0.2, 0.6)}>
          <SvgSym x={X(ETA_STAR)} y={Y0 + 26} sym="η" sup="⋆" size={17} fill="var(--accent)" weight={600} />
        </g>

        {/* hover scanline */}
        {hoverL !== null && hoverBest && (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={X(hoverL)} y1={T - 8} x2={X(hoverL)} y2={B} stroke="var(--blue)" strokeWidth={1} strokeDasharray="2 4" />
            <circle cx={X(hoverL)} cy={Y(net(hoverBest, hoverL))} r={5} fill="var(--blue)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {readout && (
        <div
          className={`pointer-events-none absolute right-2 top-1 rounded-xl border border-rule bg-surface/90 px-3 py-2 text-[13px] text-ink-2 shadow-[var(--shadow)] backdrop-blur-md transition-all duration-300 ${hoverL !== null ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}
        >
          {hoverL !== null && hoverBest && (
            <span
              dangerouslySetInnerHTML={{
                __html: tex(
                  `\\lambda = ${hoverL.toFixed(2)}\\,\\eta_B:\\ \\ \\text{best is } ${hoverBest.tex},\\ \\ v-\\lambda c = ${net(hoverBest, hoverL).toFixed(3)}`
                ),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
