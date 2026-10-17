import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { d, pointAt, slice, smooth, type Pt } from '@/lib/polyline';
import { tex } from '@/lib/tex';
import { TexLabel } from './svg';

// Fig. 00, the capability field. A stateful router sits among CodeRouterBench's eight models.
// Each round a task arrives, every plan is scored at a price, and the router commits to one of
// three kinds of plan: a direct call, a verified cascade that escalates to the reference B, or a
// portfolio. The outcome is written to the records the next round will read. Positions are
// schematic; the model names and the facts in the hover cards are the paper's.

const W = 760;
const H = 640;
const C: Pt = [380, 316];
const R_ROUTER = 62;
const R_RECORDS = 77;
const R_NODE = 22;
const RINGS = [104, 152, 202, 254, 308, 366];
const SWEEP_PERIOD = 7.5;

interface Model {
  id: number;
  short: string;
  name: string;
  fact: string;
  angle: number;
  r: number;
  reference?: boolean;
}

const MODELS: Model[] = [
  { id: 1, short: 'MINIMAX-M2.7', name: 'MiniMax-M2.7', fact: 'Retries with failing-test feedback recover 0.383 per retry, against 0.290 fresh.', angle: -155, r: 250 },
  { id: 2, short: 'GLM-5', name: 'GLM-5', fact: 'Retries with failing-test feedback recover 0.262 per retry, against 0.071 fresh.', angle: -115, r: 262 },
  { id: 3, short: 'OPUS 4.6 · B', name: 'claude-opus-4-6, the reference B', fact: 'Always-Opus scores 0.4383 at 11.655 m$ per task: the yardstick and the fallback.', angle: -75, r: 266, reference: true },
  { id: 4, short: 'QWEN3-MAX', name: 'Qwen3-Max', fact: 'Best single model on probing and the cheapest: 20.10× Opus’s efficiency at −0.0416 score.', angle: -15, r: 254 },
  { id: 5, short: 'GPT-5.4', name: 'gpt-5.4', fact: 'One of the eight models whose outcomes and token prices CodeRouterBench records.', angle: 25, r: 262 },
  { id: 6, short: 'KIMI-K2.5', name: 'Kimi-K2.5', fact: 'Feedback retries recover 0.219 per retry, against 0.105 fresh.', angle: 65, r: 242 },
  { id: 7, short: 'QWEN3.5-PLUS', name: 'Qwen3.5-Plus', fact: 'Added to the pooled Qwen3-Max portfolio: predicted −1.4 score/$, realised +5.0.', angle: 105, r: 250 },
  { id: 8, short: 'SONNET 4.6', name: 'claude-sonnet-4-6', fact: 'One of the eight models whose outcomes and token prices CodeRouterBench records.', angle: 165, r: 254 },
];

const pos = (m: Model): Pt => [C[0] + m.r * Math.cos((m.angle * Math.PI) / 180), C[1] + m.r * Math.sin((m.angle * Math.PI) / 180)];
const NODE = Object.fromEntries(MODELS.map((m) => [m.id, pos(m)])) as Record<number, Pt>;

/** straight route from the router's records ring to a model's edge */
function route(id: number, r0 = R_RECORDS + 4): Pt[] {
  const p = NODE[id];
  const dx = p[0] - C[0];
  const dy = p[1] - C[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  return [
    [C[0] + ux * r0, C[1] + uy * r0],
    [p[0] - ux * (R_NODE + 5), p[1] - uy * (R_NODE + 5)],
  ];
}

export type Scenario = 'direct' | 'cascade' | 'portfolio';
export const SCENARIOS: { key: Scenario; label: string }[] = [
  { key: 'direct', label: 'Direct dispatch' },
  { key: 'cascade', label: 'Verified cascade' },
  { key: 'portfolio', label: 'Portfolio' },
];

// shared phase times (seconds into a round)
const ARRIVE = [0, 1.05] as const;
const THINK = [1.05, 1.8] as const;
const DRAW = [1.75, 2.25] as const;
const OUT = [2.2, 3.05] as const;
const WORK = [3.05, 3.35] as const;
const BACK = [3.35, 4.15] as const;

const PLAN: Record<
  Scenario,
  { dur: number; targets: number[]; best?: number; verdict: number; esc?: { draw: number; out: number; work: number; back: number; ok: number }; record: number; fade: number }
> = {
  direct: { dur: 6.3, targets: [4], verdict: 4.15, record: 4.45, fade: 5.5 },
  cascade: {
    dur: 8.2,
    targets: [6],
    verdict: 4.15,
    esc: { draw: 4.55, out: 5.0, work: 5.75, back: 6.05, ok: 6.8 },
    record: 7.0,
    fade: 7.4,
  },
  portfolio: { dur: 6.7, targets: [5, 7, 1], best: 7, verdict: 4.15, record: 4.6, fade: 5.9 },
};

const span = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const pulseAt = (t: number, at: number, len = 0.7) => (t >= at && t < at + len ? 1 - (t - at) / len : 0);

export type FocusWord = 0 | 1 | 2;

interface Props {
  className?: string;
  /** reports which of combine / spend more / remember the field is acting out */
  onFocus?: (w: FocusWord) => void;
}

export function CapabilityField({ className = '', onFocus }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '0px');
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const [clock, resetClock] = useClock(inView && !reduced);
  const [start, setStart] = useState<{ scenario: number; at: number }>({ scenario: 0, at: 0 });

  // which round are we in? scenarios cycle; a click restarts the cycle at the chosen one
  const timeline = useMemo(() => {
    const order = SCENARIOS.map((s) => s.key);
    const total = order.reduce((s, k) => s + PLAN[k].dur, 0);
    return { order, total };
  }, []);

  const elapsed = reduced ? 5.2 : Math.max(0, clock - start.at);
  let k = start.scenario;
  let t = elapsed % timeline.total;
  let round = Math.floor(elapsed / timeline.total) * 3;
  // walk forward through the cycle from the chosen scenario
  for (let i = 0; i < 3; i++) {
    const key = timeline.order[(start.scenario + i) % 3];
    if (t < PLAN[key].dur) {
      k = (start.scenario + i) % 3;
      break;
    }
    t -= PLAN[key].dur;
    round += 1;
  }
  if (reduced) {
    k = 1;
    t = 5.2;
  }
  const scenario = timeline.order[k];
  const plan = PLAN[scenario];

  const records = Math.min(12, ((round % 12) + (t >= plan.record + 0.5 ? 1 : 0)) || 0);
  const recordFill = span(t, plan.record, plan.record + 0.5);

  // phase for captions, equation highlight and the hero's word focus
  const phase: string = useMemo(() => {
    if (t < ARRIVE[1]) return 'arrive';
    if (t < DRAW[0]) return 'think';
    if (t >= plan.record) return 'record';
    if (scenario === 'cascade' && plan.esc) {
      if (t >= plan.esc.ok) return 'ok';
      if (t >= plan.esc.draw) return 'escalate';
      if (t >= plan.verdict) return 'reject';
    }
    if (scenario === 'portfolio' && t >= plan.verdict) return 'select';
    if (t >= plan.verdict) return 'ok';
    return 'go';
  }, [t, plan, scenario]);

  const focusWord: FocusWord = phase === 'record' ? 2 : scenario === 'cascade' && (phase === 'reject' || phase === 'escalate' || phase === 'ok') ? 1 : 0;
  const lastFocus = useRef<FocusWord | null>(null);
  useEffect(() => {
    if (lastFocus.current !== focusWord) {
      lastFocus.current = focusWord;
      onFocus?.(focusWord);
    }
  }, [focusWord, onFocus]);

  const status = (() => {
    switch (phase) {
      case 'arrive':
        return 'A task arrives with its history';
      case 'think':
        return 'Every plan is scored: value minus priced cost';
      case 'go':
        return scenario === 'direct'
          ? 'Direct dispatch: one call to Qwen3-Max'
          : scenario === 'cascade'
            ? 'Cascade: try the cheap primary, Kimi-K2.5'
            : 'Portfolio: three models called together';
      case 'reject':
        return 'Rejected by the verifier';
      case 'escalate':
        return 'Escalate to the reference, Opus 4.6';
      case 'select':
        return 'Keep the best passing answer';
      case 'ok':
        return scenario === 'cascade' ? 'Accepted. The fallback was paid for' : 'Accepted. The quality floor holds';
      default:
        return 'The outcome is written to the records';
    }
  })();

  const fade = 1 - span(t, plan.fade, plan.fade + 0.6);
  const sweep = ((reduced ? 2.2 : clock) / SWEEP_PERIOD) * 360 - 90;

  // node tones
  const nodeState = (id: number) => {
    let tone: 'idle' | 'blue' | 'amber' | 'coral' | 'teal' = 'idle';
    let pulse = 0;
    let dim = false;
    if (plan.targets.includes(id) && t >= DRAW[0] && fade > 0.02) {
      tone = 'blue';
      pulse = Math.max(pulseAt(t, WORK[0], 0.8), pulseAt(t, OUT[1] - 0.05, 0.6));
      if (scenario === 'cascade' && t >= plan.verdict) tone = 'coral';
      if (scenario === 'portfolio' && t >= plan.verdict) {
        if (id === plan.best) tone = 'teal';
        else dim = true;
      }
    }
    if (scenario === 'cascade' && plan.esc && id === 3 && t >= plan.esc.draw && fade > 0.02) {
      tone = 'amber';
      pulse = pulseAt(t, plan.esc.work, 0.8);
    }
    // the sweep lights each model as it passes
    const m = MODELS.find((x) => x.id === id)!;
    const behind = (((sweep - m.angle) % 360) + 360) % 360;
    const lit = Math.max(0, 1 - behind / 46);
    return { tone, pulse, dim, lit };
  };

  const think = span(t, THINK[0], THINK[0] + 0.35) * (1 - span(t, THINK[1] - 0.1, DRAW[1]));
  const priceGlow = think > 0.05 || phase === 'think';
  const floorGlow = phase === 'reject' || phase === 'ok' || phase === 'select';

  const arrive = span(t, ARRIVE[0], ARRIVE[1]);
  const ripple = span(t, ARRIVE[1] - 0.05, ARRIVE[1] + 1.1);

  const comets: { pts: Pt[]; s: number; color: string }[] = [];
  const addComets = (pts: Pt[], a: number, b: number, color: string, back = false) => {
    const L = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    for (let j = 0; j < 2; j++) {
      const u = span(t, a + j * 0.16, b + j * 0.16);
      if (u <= 0 || u >= 1) continue;
      const path = back ? [pts[1], pts[0]] : pts;
      comets.push({ pts: path, s: smooth(u) * L, color });
    }
  };
  for (const id of plan.targets) {
    const pts = route(id);
    addComets(pts, OUT[0], OUT[1], 'var(--blue)');
    addComets(pts, BACK[0], BACK[1], scenario === 'cascade' ? 'var(--coral)' : 'var(--blue)', true);
  }
  if (plan.esc) {
    const pts = route(3);
    addComets(pts, plan.esc.out, plan.esc.work, 'var(--amber)');
    addComets(pts, plan.esc.back, plan.esc.ok, 'var(--amber)', true);
  }

  const verdict =
    scenario === 'cascade'
      ? t >= plan.esc!.ok
        ? 'ok'
        : t >= plan.verdict
          ? 'no'
          : null
      : t >= plan.verdict
        ? 'ok'
        : null;
  const verdictPop = verdict ? span(t, verdict === 'no' ? plan.verdict : scenario === 'cascade' ? plan.esc!.ok : plan.verdict, (verdict === 'no' ? plan.verdict : scenario === 'cascade' ? plan.esc!.ok : plan.verdict) + 0.25) : 0;

  // task chip path into the router
  const chipPath: Pt[] = [
    [-30, 290],
    [70, 300],
    [190, 314],
    [C[0] - R_RECORDS - 8, C[1]],
  ];
  const chip = pointAt(chipPath, smooth(arrive) * pathLen(chipPath));

  const eqHl = phase === 'arrive' ? 'x' : phase === 'think' ? 'g' : phase === 'record' ? 'I' : 'u';
  const eq = `${eqHl === 'u' ? '\\htmlClass{eq-hl}{u_n}' : 'u_n'}=${eqHl === 'g' ? '\\htmlClass{eq-hl}{g}' : 'g'}(${eqHl === 'x' ? '\\htmlClass{eq-hl}{x_n}' : 'x_n'},\\,${eqHl === 'I' ? '\\htmlClass{eq-hl}{I_n}' : 'I_n'})`;

  const restart = (i: number) => {
    setStart({ scenario: i, at: 0 });
    resetClock(0);
  };

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <div className="font-mono text-[11.5px] uppercase tracking-[0.2em] text-ink-2">
          Fig. 00 <span className="ml-3 text-ink-3">The capability field</span>
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-4">Schematic · the 8 CodeRouterBench models</div>
      </div>
      <div ref={ref} className="relative w-full select-none [container-type:inline-size]" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Animated schematic: a stateful router at the centre of CodeRouterBench's eight models. A task arrives, every plan is scored, and the router dispatches directly, runs a verified cascade that escalates to the reference Opus, or calls a portfolio; the outcome is written to its records.">
          <defs>
            <radialGradient id="cf-fade" cx={C[0] / W} cy={C[1] / H} r="0.62">
              <stop offset="0.72" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
            <mask id="cf-mask" maskUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
              <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#cf-fade)" />
            </mask>
            <radialGradient id="cf-router" cx="50%" cy="42%" r="60%">
              <stop offset="0" stopColor="var(--surface)" />
              <stop offset="1" stopColor="var(--accent-wash)" />
            </radialGradient>
            <radialGradient id="cf-halo">
              <stop offset="0" stopColor="var(--blue)" stopOpacity="0.13" />
              <stop offset="1" stopColor="var(--blue)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* rings and sweep, fading out toward the frame */}
          <g mask="url(#cf-mask)">
            {RINGS.map((r, i) => (
              <circle key={r} cx={C[0]} cy={C[1]} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={i === 0 ? 1 : 1.1} strokeDasharray={i === 0 ? '3 7' : undefined} opacity={1 - i * 0.08}>
                {i === 0 && !reduced && <animateTransform attributeName="transform" type="rotate" from={`0 ${C[0]} ${C[1]}`} to={`360 ${C[0]} ${C[1]}`} dur="60s" repeatCount="indefinite" />}
              </circle>
            ))}
            <g transform={`rotate(${sweep} ${C[0]} ${C[1]})`}>
              {Array.from({ length: 22 }).map((_, i) => {
                const a0 = (-(i + 1) * 2.4 * Math.PI) / 180;
                const a1 = (-i * 2.4 * Math.PI) / 180;
                const R = 330;
                return (
                  <path
                    key={i}
                    d={`M${C[0]},${C[1]} L${C[0] + R * Math.cos(a0)},${C[1] + R * Math.sin(a0)} A${R},${R} 0 0 1 ${C[0] + R * Math.cos(a1)},${C[1] + R * Math.sin(a1)} Z`}
                    fill="var(--blue)"
                    opacity={0.085 * Math.pow(1 - i / 22, 1.6)}
                  />
                );
              })}
              <line x1={C[0]} y1={C[1]} x2={C[0] + 330} y2={C[1]} stroke="var(--blue)" strokeOpacity={0.3} strokeWidth={1} />
            </g>
          </g>

          {/* halo and arrival ripples */}
          <circle cx={C[0]} cy={C[1]} r={170} fill="url(#cf-halo)" />
          {ripple > 0 && ripple < 1 &&
            [0, 0.35].map((off) => {
              const u = Math.max(0, Math.min(1, (ripple - off) / (1 - off)));
              return u > 0 && u < 1 ? (
                <circle key={off} cx={C[0]} cy={C[1]} r={R_ROUTER + u * 120} fill="none" stroke="var(--blue)" strokeWidth={1.4} opacity={(1 - u) * 0.55} />
              ) : null;
            })}

          {/* spokes: during scoring every one of them carries a signal out */}
          {MODELS.map((m, i) => {
            const pts = route(m.id);
            const chosen = plan.targets.includes(m.id) || (plan.esc && m.id === 3 && t >= plan.esc.draw);
            const hovered = hover === m.id;
            const sig = span(t, THINK[0] + i * 0.04, THINK[0] + 0.45 + i * 0.04);
            return (
              <g key={m.id}>
                <path d={d(pts)} stroke="var(--line)" strokeWidth={hovered ? 1.6 : 1} opacity={hovered ? 0.95 : 0.42} fill="none" />
                {think > 0.02 && !chosen && (
                  <path d={d(slice(pts, 0, sig * 200))} stroke="var(--blue)" strokeWidth={1.2} strokeDasharray="2 5" opacity={think * 0.7} fill="none" />
                )}
              </g>
            );
          })}

          {/* chosen routes */}
          {plan.targets.map((id) => {
            const pts = route(id);
            const draw = span(t, DRAW[0], DRAW[1]);
            const dimmed = scenario === 'portfolio' && t >= plan.verdict && id !== plan.best;
            const color = scenario === 'cascade' && t >= plan.verdict ? 'var(--coral)' : scenario === 'portfolio' && id === plan.best && t >= plan.verdict ? 'var(--teal)' : 'var(--blue)';
            return draw > 0 ? (
              <path
                key={id}
                d={d(slice(pts, 0, draw * 400))}
                stroke={color}
                strokeWidth={2}
                fill="none"
                opacity={fade * (dimmed ? 0.25 : 1)}
                strokeDasharray={scenario === 'cascade' && t >= plan.verdict ? '5 5' : undefined}
                style={{ transition: 'stroke .35s, opacity .35s' }}
              />
            ) : null;
          })}
          {plan.esc && t >= plan.esc.draw && (
            <path d={d(slice(route(3), 0, span(t, plan.esc.draw, plan.esc.draw + 0.45) * 400))} stroke="var(--amber)" strokeWidth={2} fill="none" opacity={fade} />
          )}

          {/* packets */}
          {comets.map((c, i) => {
            const head = pointAt(c.pts, c.s);
            return (
              <g key={i} opacity={fade}>
                <path d={d(slice(c.pts, c.s - 30, c.s))} stroke={c.color} strokeWidth={3} strokeLinecap="round" opacity={0.35} fill="none" />
                <circle cx={head[0]} cy={head[1]} r={7} fill={c.color} opacity={0.18} />
                <circle cx={head[0]} cy={head[1]} r={3.6} fill={c.color} />
              </g>
            );
          })}

          {/* records ring: one arc per round, filled as outcomes are written */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a0 = -90 + i * 30 + 4;
            const a1 = a0 + 22;
            const arc = (a: number) => [C[0] + R_RECORDS * Math.cos((a * Math.PI) / 180), C[1] + R_RECORDS * Math.sin((a * Math.PI) / 180)];
            const p0 = arc(a0);
            const p1 = arc(a1);
            const filled = i < records;
            const writing = i === records && recordFill > 0 && recordFill < 1;
            const path = `M${p0[0]},${p0[1]} A${R_RECORDS},${R_RECORDS} 0 0 1 ${p1[0]},${p1[1]}`;
            return (
              <g key={i}>
                <path d={path} stroke="var(--line-soft)" strokeWidth={3.2} strokeLinecap="round" fill="none" />
                {(filled || writing) && (
                  <path d={path} stroke="var(--teal)" strokeWidth={3.2} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={filled ? 0 : 1 - recordFill} />
                )}
              </g>
            );
          })}

          {/* the router */}
          <circle cx={C[0]} cy={C[1]} r={R_ROUTER} fill="url(#cf-router)" stroke="var(--accent)" strokeWidth={1.7} />
          <circle cx={C[0]} cy={C[1]} r={R_ROUTER} fill="var(--accent)" opacity={0.08 * (ripple > 0 && ripple < 1 ? 1 - ripple : 0) + (think > 0 ? 0.05 * think : 0)} />
          <TexLabel x={C[0]} y={C[1] - 2} t="g(x,\,I)" size={31} color="var(--accent)" w={130} h={44} />
          <g>
            <rect x={C[0] - 74} y={C[1] + R_RECORDS + 14} width={148} height={20} rx={10} fill="var(--bg)" opacity={0.85} />
            <text x={C[0]} y={C[1] + R_RECORDS + 28} textAnchor="middle" fontSize={11} letterSpacing={1.8} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
              STATEFUL ROUTER
            </text>
          </g>

          {/* verdict badge */}
          {verdict && (
            <g transform={`translate(${C[0] + 60} ${C[1] - 60}) scale(${0.4 + 0.6 * verdictPop})`} opacity={fade}>
              <circle r={13} fill={verdict === 'ok' ? 'var(--teal)' : 'var(--coral)'} />
              <text y={4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff" style={{ fontFamily: 'var(--font-sans)' }}>
                {verdict === 'ok' ? '✓' : '✗'}
              </text>
            </g>
          )}

          {/* models */}
          {MODELS.map((m) => {
            const [x, y] = NODE[m.id];
            const s = nodeState(m.id);
            const toneColor =
              s.tone === 'blue' ? 'var(--blue)' : s.tone === 'amber' ? 'var(--amber)' : s.tone === 'coral' ? 'var(--coral)' : s.tone === 'teal' ? 'var(--teal)' : null;
            const stroke = toneColor ?? (s.lit > 0.02 ? 'var(--blue)' : m.reference ? 'var(--amber)' : 'var(--line-soft)');
            const strokeOpacity = toneColor ? 1 : s.lit > 0.02 ? 0.35 + 0.65 * s.lit : m.reference ? 0.7 : 1;
            const fill = s.tone === 'blue' ? 'var(--blue-wash)' : s.tone === 'amber' ? 'var(--amber-wash)' : s.tone === 'coral' ? 'var(--coral-wash)' : s.tone === 'teal' ? 'var(--teal-wash)' : 'var(--surface)';
            return (
              <g
                key={m.id}
                opacity={s.dim ? 0.45 : 1}
                style={{ transition: 'opacity .35s', cursor: 'pointer' }}
                onMouseEnter={() => setHover(m.id)}
                onMouseLeave={() => setHover(null)}
              >
                <circle cx={x} cy={y} r={R_NODE + 14} fill="transparent" />
                {s.pulse > 0.01 && <circle cx={x} cy={y} r={R_NODE + 4 + (1 - s.pulse) * 16} fill="none" stroke={toneColor ?? 'var(--blue)'} strokeWidth={1.5} opacity={s.pulse * 0.8} />}
                {s.lit > 0.02 && !toneColor && <circle cx={x} cy={y} r={R_NODE + 7} fill="var(--blue)" opacity={0.07 * s.lit} />}
                <circle cx={x} cy={y} r={R_NODE} fill={fill} stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth={toneColor || hover === m.id ? 1.9 : 1.4} style={{ transition: 'fill .35s' }} />
                <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fill={toneColor ?? 'var(--ink-2)'} style={{ fontFamily: 'var(--font-mono)' }}>
                  {String(m.id).padStart(2, '0')}
                </text>
                <text x={x} y={y + R_NODE + 21} textAnchor="middle" fontSize={10.5} letterSpacing={1.5} fill={toneColor ?? 'var(--ink-3)'} style={{ fontFamily: 'var(--font-mono)' }}>
                  {m.short}
                </text>
              </g>
            );
          })}

          {/* the task, flying in */}
          {arrive > 0 && arrive < 1 && (
            <g transform={`translate(${chip[0]} ${chip[1]}) scale(${1 - 0.55 * smooth(span(arrive, 0.75, 1))})`} opacity={Math.min(1, arrive * 4) * (1 - span(arrive, 0.85, 1))}>
              <rect x={-44} y={-16} width={88} height={32} rx={16} fill="var(--surface)" stroke="var(--blue)" strokeWidth={1.4} />
              <text x={-12} y={4} textAnchor="middle" fontSize={10.5} letterSpacing={1.4} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
                TASK
              </text>
              <TexLabel x={22} y={0} t="x_n" size={16} color="var(--blue)" w={34} h={28} />
            </g>
          )}
        </svg>

        {/* floating cards */}
        <FloatCard className="right-[1.5%] top-[2%]" rotate={5} on={priceGlow} delay={0} tex="v-\lambda c" note="value minus priced cost" />
        <FloatCard className="bottom-[3%] left-[1%]" rotate={-5} on={floorGlow} delay={1.4} tex="Q\ge-\epsilon" note="the quality floor" />

        {/* hover card */}
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 w-[min(260px,62%)]"
            style={{
              left: `${(NODE[hover][0] / W) * 100}%`,
              top: `${((NODE[hover][1] + (NODE[hover][1] > C[1] ? -R_NODE - 12 : R_NODE + 34)) / H) * 100}%`,
              transform: `translate(-50%, ${NODE[hover][1] > C[1] ? '-100%' : '0'})`,
            }}
          >
            <motion.div
              key={hover}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="rounded-2xl border border-rule bg-surface/95 p-3.5 shadow-[var(--shadow-lg)] backdrop-blur-md"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{MODELS[hover - 1].name}</div>
              <p className="mt-1.5 font-serif text-[13.5px] leading-snug text-ink-2">{MODELS[hover - 1].fact}</p>
            </motion.div>
          </div>
        )}
      </div>

      <div data-og-hide className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1">
        <div className="min-w-0 flex-1 basis-[280px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">One state. Many possible futures.</div>
          <div className="relative mt-1.5 h-[1.5em] overflow-hidden text-[11.5px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={status}
                initial={{ y: '100%', opacity: 0, filter: 'blur(4px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: '-100%', opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="truncate font-mono uppercase tracking-[0.15em] text-accent"
              >
                {status}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="shrink-0 text-[clamp(18px,2vw,26px)] text-ink" dangerouslySetInnerHTML={{ __html: tex(eq) }} />
      </div>

      {/* scenario selector */}
      <div data-og-hide className="mt-4 grid grid-cols-3 gap-2">
        {SCENARIOS.map((s, i) => {
          const active = i === k;
          const prog = active ? Math.min(1, t / plan.dur) : 0;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => restart(i)}
              className={`group relative overflow-hidden rounded-xl border px-3 py-2 text-left transition-colors ${active ? 'border-accent/40 bg-surface' : 'border-rule bg-transparent hover:border-rule-2'}`}
            >
              <span className={`block font-mono text-[10px] uppercase tracking-[0.16em] ${active ? 'text-accent' : 'text-ink-4'}`}>0{i + 1}</span>
              <span className={`block font-sans text-[13px] font-medium ${active ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2'}`}>{s.label}</span>
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-rule">
                <span className="block h-full origin-left bg-accent" style={{ transform: `scaleX(${prog})` }} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function pathLen(pts: Pt[]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}

function FloatCard({ className, rotate, on, delay, tex: t, note }: { className: string; rotate: number; on: boolean; delay: number; tex: string; note: string }) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: [0, -7, 0], rotate }}
      transition={{ opacity: { duration: 0.8, delay: 0.6 + delay * 0.3 }, y: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay }, rotate: { duration: 0 } }}
    >
      <div
        className="rounded-[0.6em] border bg-surface px-[1.1em] py-[0.55em] transition-[box-shadow,border-color,transform] duration-500"
        style={{
          fontSize: 'clamp(10px, 4.1cqw, 32px)',
          borderColor: on ? 'color-mix(in oklab, var(--accent) 55%, transparent)' : 'var(--rule)',
          boxShadow: on ? '0 0 0 4px var(--accent-wash), var(--shadow-lg)' : 'var(--shadow-lg)',
          transform: on ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <div className="text-accent" dangerouslySetInnerHTML={{ __html: tex(t) }} />
        <div className="mt-[0.15em] font-mono uppercase tracking-[0.16em] text-ink-3 @max-[480px]:hidden" style={{ fontSize: 'clamp(7px, 1.25cqw, 10px)' }}>
          {note}
        </div>
      </div>
    </motion.div>
  );
}
