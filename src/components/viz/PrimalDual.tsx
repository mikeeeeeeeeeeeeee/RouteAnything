import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Slider } from '@/components/ui/Slider';
import { ACTIONS, ETA_STAR, net, pricePath, type Action } from '@/lib/envelope';
import { FRONTIER, floorOptimum } from '@/lib/frontier';
import { tex } from '@/lib/tex';
import { useTokens } from '@/theme/tokens';
import { TexLabel, mono, scale } from './svg';

// Theorem 2(iii), seen twice. Left: actions as points (cost, value); the floor is a horizontal
// line, the optimum is where it meets the frontier, its efficiency is the slope of the ray from the
// origin and its price is the slope of the frontier there. Right: the same actions as lines
// v - lambda c; the price is a breakpoint of Phi and the efficiency is where the mixed line
// crosses zero. Both panels show the same two numbers, and lambda_eps = eta*_eps / (1 + kappa).

const W = 470;
const H = 400;
const M = { l: 50, r: 18, t: 22, b: 46 };

const cx = scale(0, 1.08, M.l, W - M.r);
const vy = scale(0, 1.08, H - M.b, M.t);
const LMAX = 4.6;
const lx = scale(0, LMAX, M.l, W - M.r);
const jy = scale(-0.32, 1.08, H - M.b, M.t);

export function PrimalDual() {
  const tk = useTokens();
  const [eps, setEps] = useState(30); // percent of v̄
  const [hover, setHover] = useState<string | null>(null);
  const o = useMemo(() => floorOptimum(eps / 100), [eps]);
  const used = new Set([o.hi.id, o.lo.id]);
  const isUsed = (u: Action) => used.has(u.id);
  const interval = o.lambda[1] - o.lambda[0] > 1e-6;

  const env = useMemo(() => {
    const pts: [number, number][] = [];
    for (const p of pricePath(ETA_STAR)) {
      if (!pts.length) pts.push([p.from, net(p.u, p.from)]);
      pts.push([p.to, net(p.u, p.to)]);
    }
    return pts.map(([l, y], i) => `${i ? 'L' : 'M'}${lx(l)},${jy(y)}`).join(' ');
  }, []);

  const frontierPath = FRONTIER.map((u, i) => `${i ? 'L' : 'M'}${cx(u.c)},${vy(u.v)}`).join(' ');
  const floorV = 1 - eps / 100;
  const lamMid = (o.lambda[0] + o.lambda[1]) / 2;
  // supporting line through the operating point at the price lambda_eps
  const sup = (c: number) => o.v + lamMid * (c - o.c);
  const kappaTxt = o.binding
    ? interval
      ? `\\kappa\\in[${o.kappa[0].toFixed(2)},\\,${isFinite(o.kappa[1]) ? o.kappa[1].toFixed(2) : '\\infty'}]`
      : `\\kappa=${o.kappa[0].toFixed(2)}`
    : '\\kappa=0';
  const lamTxt = interval ? `\\lambda_\\epsilon\\in[${o.lambda[0].toFixed(2)},\\,${o.lambda[1].toFixed(2)}]` : `\\lambda_\\epsilon=${o.lambda[0].toFixed(2)}`;

  const mixLabel = o.hi.id === o.lo.id ? `${o.hi.tex}\\ \\text{alone}` : `${(o.w * 100).toFixed(0)}\\%\\ ${o.hi.tex} + ${((1 - o.w) * 100).toFixed(0)}\\%\\ ${o.lo.tex}`;

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---------- primal ---------- */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="smallcaps text-[10.5px] text-ink-3">Actions as points</span>
            <span className="text-[13px] text-ink-3" dangerouslySetInnerHTML={{ __html: tex('(c,\\ v)') }} />
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="Actions as points in the cost-value plane, with the floor and the operating point">
            <defs>
              <clipPath id="pd-clip-l">
                <rect x={M.l} y={M.t - 4} width={W - M.r - M.l + 4} height={H - M.b - M.t + 4} />
              </clipPath>
              <clipPath id="pd-clip-r">
                <rect x={M.l} y={M.t - 4} width={W - M.r - M.l + 4} height={H - M.b - M.t + 4} />
              </clipPath>
            </defs>
            {/* feasible region above the floor */}
            <rect x={M.l} y={vy(1.08)} width={W - M.r - M.l} height={vy(floorV) - vy(1.08)} fill="var(--teal-wash)" opacity={0.7} />
            <line x1={M.l} y1={vy(floorV)} x2={W - M.r} y2={vy(floorV)} stroke="var(--coral)" strokeWidth={1.6} strokeDasharray="7 5" />
            <TexLabel x={W - M.r - 4} y={vy(floorV) + 14} t="v = \bar v-\epsilon" anchor="end" size={13} color="var(--coral)" />

            {/* axes */}
            <line x1={M.l} y1={H - M.b} x2={W - M.r} y2={H - M.b} stroke="var(--ink-4)" />
            <line x1={M.l} y1={M.t} x2={M.l} y2={H - M.b} stroke="var(--ink-4)" />
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <text x={cx(t)} y={H - M.b + 18} textAnchor="middle" fontSize={11} fill="var(--ink-3)" style={mono}>
                  {t}
                </text>
                <text x={M.l - 8} y={vy(t) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" style={mono}>
                  {t}
                </text>
              </g>
            ))}
            <TexLabel x={W - M.r} y={H - 10} t="\text{cost } c/\bar c\ \to" anchor="end" size={13} color="var(--ink-3)" w={180} />
            <TexLabel x={M.l + 6} y={M.t + 4} t="\uparrow\ \text{value } v/\bar v" anchor="start" size={13} color="var(--ink-3)" w={180} />

            <g clipPath="url(#pd-clip-l)">
            {/* efficiency ray (slope eta*_eps) */}
            <motion.line
              x1={cx(0)}
              y1={vy(0)}
              animate={{ x2: cx(Math.min(1.08, 1.08 / o.etaEps)), y2: vy(Math.min(1.08, o.etaEps * 1.08)) }}
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
              stroke="var(--blue)"
              strokeWidth={1.6}
            />
            {/* supporting line (slope lambda_eps) */}
            <motion.line
              animate={{ x1: cx(0), y1: vy(sup(0)), x2: cx(1.08), y2: vy(sup(1.08)) }}
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
              stroke="var(--accent)"
              strokeWidth={1.4}
              strokeDasharray="5 4"
            />
            </g>

            {/* frontier */}
            <path d={frontierPath} fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeLinejoin="round" />

            {/* actions */}
            {ACTIONS.map((u) => {
              const on = hover === u.id || isUsed(u);
              return (
                <g key={u.id} onMouseEnter={() => setHover(u.id)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                  <circle cx={cx(u.c)} cy={vy(u.v)} r={14} fill="transparent" />
                  <circle
                    cx={cx(u.c)}
                    cy={vy(u.v)}
                    r={u.reference ? 6.5 : 5}
                    fill={u.reference ? 'var(--surface)' : on ? 'var(--blue)' : u.dominated ? 'var(--surface)' : 'var(--ink)'}
                    stroke={u.reference ? 'var(--amber)' : u.dominated ? 'var(--ink-4)' : 'var(--surface)'}
                    strokeWidth={u.reference ? 2.2 : 1.6}
                  />
                  <TexLabel
                    x={cx(u.c) + (u.id === 'B' ? -10 : 9)}
                    y={vy(u.v) - 12}
                    t={u.tex}
                    anchor={u.id === 'B' ? 'end' : 'start'}
                    size={13}
                    w={40}
                    color={u.reference ? 'var(--amber)' : on ? 'var(--blue)' : u.dominated ? 'var(--ink-4)' : 'var(--ink-2)'}
                  />
                </g>
              );
            })}

            {/* operating point */}
            <motion.g animate={{ x: cx(o.c), y: vy(o.v) }} transition={{ type: 'spring', stiffness: 220, damping: 26 }}>
              <circle r={15} fill="var(--blue)" opacity={0.14} />
              <circle r={6.5} fill="var(--blue)" stroke="var(--surface)" strokeWidth={2.2} />
            </motion.g>

            {/* slope legends */}
            <g transform={`translate(${W - M.r - 196}, ${vy(0.36)})`}>
              <rect width={190} height={52} rx={10} fill="var(--surface)" stroke="var(--rule)" />
              <line x1={12} y1={18} x2={34} y2={18} stroke="var(--blue)" strokeWidth={1.8} />
              <TexLabel x={42} y={18} t="\text{slope } \eta^\star_\epsilon\ (\text{efficiency})" anchor="start" size={12} w={150} color="var(--ink-2)" />
              <line x1={12} y1={37} x2={34} y2={37} stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="5 4" />
              <TexLabel x={42} y={37} t="\text{slope } \lambda_\epsilon\ (\text{price})" anchor="start" size={12} w={150} color="var(--ink-2)" />
            </g>
          </svg>
        </div>

        {/* ---------- dual ---------- */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="smallcaps text-[10.5px] text-ink-3">The same actions as lines</span>
            <span className="text-[13px] text-ink-3" dangerouslySetInnerHTML={{ __html: tex('v-\\lambda c') }} />
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="The same actions as lines of net value against price, with the envelope, the floor price and the constrained efficiency">
            <defs>
              <clipPath id="pd-clip-d">
                <rect x={M.l} y={M.t - 4} width={W - M.r - M.l + 4} height={H - M.b - M.t + 4} />
              </clipPath>
            </defs>
            {/* lambda interval or point */}
            {interval ? (
              <rect x={lx(o.lambda[0])} y={M.t} width={Math.max(2, lx(o.lambda[1]) - lx(o.lambda[0]))} height={H - M.b - M.t} fill="var(--accent-wash)" />
            ) : null}
            <motion.line
              animate={{ x1: lx(lamMid), x2: lx(lamMid) }}
              y1={M.t}
              y2={H - M.b}
              stroke="var(--accent)"
              strokeWidth={1.3}
              strokeDasharray="4 4"
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
            />

            {/* axes */}
            <line x1={M.l} y1={jy(0)} x2={W - M.r} y2={jy(0)} stroke="var(--ink-2)" strokeWidth={1.1} />
            <line x1={M.l} y1={M.t} x2={M.l} y2={H - M.b} stroke="var(--ink-4)" />
            {[0, 1, 2, 3, 4].map((t) => (
              <text key={t} x={lx(t)} y={H - M.b + 18} textAnchor="middle" fontSize={11} fill="var(--ink-3)" style={mono}>
                {t}
              </text>
            ))}
            <TexLabel x={W - M.r} y={H - 10} t="\text{price } \lambda/\eta_B\ \to" anchor="end" size={13} color="var(--ink-3)" w={180} />

            {/* lines */}
            <g clipPath="url(#pd-clip-d)">
              {ACTIONS.map((u) => {
                const on = hover === u.id || isUsed(u);
                const l1 = Math.min(LMAX, (u.v + 0.32) / u.c);
                return (
                  <line
                    key={u.id}
                    x1={lx(0)}
                    y1={jy(u.v)}
                    x2={lx(l1)}
                    y2={jy(net(u, l1))}
                    stroke={u.reference ? 'var(--amber)' : on ? 'var(--blue)' : 'var(--ink)'}
                    strokeOpacity={u.reference ? 0.9 : on ? 1 : u.dominated ? 0.18 : 0.3}
                    strokeWidth={on ? 2.2 : 1.1}
                    onMouseEnter={() => setHover(u.id)}
                    onMouseLeave={() => setHover(null)}
                    className="cursor-pointer"
                    style={{ transition: 'stroke-opacity .25s, stroke-width .25s' }}
                  />
                );
              })}
            </g>
            <path d={env} fill="none" stroke="var(--accent)" strokeWidth={2.4} strokeLinejoin="round" />
            <TexLabel x={lx(0.62)} y={jy(net(ACTIONS[2], 0.62)) - 20} t="\Phi(\lambda)" anchor="start" size={15} color="var(--accent)" w={60} />

            {/* the mixed router's own line, crossing zero at eta*_eps */}
            <motion.line
              animate={{
                x1: lx(0),
                y1: jy(o.v),
                x2: lx(Math.min(LMAX, (o.v + 0.32) / o.c)),
                y2: jy(o.v - Math.min(LMAX, (o.v + 0.32) / o.c) * o.c),
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
              stroke="var(--blue)"
              strokeWidth={1.6}
              strokeDasharray="6 4"
            />
            <motion.g animate={{ x: lx(Math.min(LMAX, o.etaEps)), y: jy(0) }} transition={{ type: 'spring', stiffness: 200, damping: 28 }}>
              <circle r={6} fill="var(--blue)" stroke="var(--surface)" strokeWidth={2} />
            </motion.g>
            <motion.g animate={{ x: lx(Math.min(LMAX, o.etaEps)) }} transition={{ type: 'spring', stiffness: 200, damping: 28 }}>
              <TexLabel x={0} y={jy(0) - 18} t="\eta^\star_\epsilon" size={15} color="var(--blue)" w={50} />
            </motion.g>
            <motion.g animate={{ x: lx(lamMid) }} transition={{ type: 'spring', stiffness: 200, damping: 28 }}>
              <TexLabel x={0} y={M.t + 4} t="\lambda_\epsilon" size={15} color="var(--accent)" w={50} />
            </motion.g>
            {/* eta_B tick */}
            <TexLabel x={lx(1)} y={jy(0) + 40} t="\eta_B" size={13} color="var(--amber)" w={40} />
          </svg>
        </div>
      </div>

      {/* control + read-out */}
      <div className="mt-6 grid grid-cols-1 items-center gap-5 rounded-2xl border border-rule bg-surface-2 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="smallcaps text-[10px] text-ink-3">tolerance · quality the router may give up</span>
            <span className="whitespace-nowrap text-[15px] text-ink" dangerouslySetInnerHTML={{ __html: tex(`\\epsilon = ${(eps / 100).toFixed(2)}\\,\\bar v`) }} />
          </div>
          <Slider value={eps} onChange={setEps} max={85} color={tk.accent} left="0" right="0.85" ariaLabel="Tolerance epsilon" className="mt-2" />
          <p className="mt-2 font-serif text-[14px] text-ink-3">
            {o.binding ? (
              <>
                The floor binds. The optimum plays{' '}
                <span className="text-ink" dangerouslySetInnerHTML={{ __html: tex(mixLabel) }} />
                {o.hi.id !== o.lo.id ? ', randomising in this one state, as part (iii) allows.' : interval ? ': the floor sits on a vertex, so a whole interval of prices supports it.' : '.'}
              </>
            ) : (
              <>The floor is slack: the unconstrained optimum already meets it, so κ = 0 and the price is η⋆ itself.</>
            )}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:w-[420px]">
          <Readout label="efficiency" html={tex(`\\eta^\\star_\\epsilon=${o.etaEps.toFixed(2)}`)} color="var(--blue)" />
          <Readout label="multiplier" html={tex(kappaTxt)} color="var(--ink)" />
          <Readout label="price" html={tex(lamTxt)} color="var(--accent)" />
          <div className="col-span-3 text-center text-[14px] text-ink-2" dangerouslySetInnerHTML={{ __html: tex('\\lambda_\\epsilon=\\dfrac{\\eta^\\star_\\epsilon}{1+\\kappa}') }} />
        </div>
      </div>
    </div>
  );
}

function Readout({ label, html, color }: { label: string; html: string; color: string }) {
  return (
    <div className="rounded-xl border border-rule bg-surface px-3 py-2 text-center">
      <div className="smallcaps text-[9px] text-ink-3">{label}</div>
      <div className="mt-1 overflow-x-auto text-[14px] no-scrollbar" style={{ color }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
