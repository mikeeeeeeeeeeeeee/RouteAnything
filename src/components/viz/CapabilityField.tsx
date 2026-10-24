import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { d, pointAt, slice, smooth, type Pt } from '@/lib/polyline';
import { tex } from '@/lib/tex';
import { TexLabel } from './svg';
import { PoolIcon, type Pool } from './icons';

// Fig. 00, the capability field. One router sits among arms of every output type: language models,
// image, video and speech generators, and robot policies (ten of the matrix's 23 arms are drawn).
// Each round an input arrives, the router scores every arm by value minus priced cost given what it
// observes, and plays the best. The three rounds act out the paper's three questions: the best arm
// changes from input to input (gain), a router that reads camera frames follows the better policy
// in each scene (recover), and at a price a cheaper generator wins inside the floor (pay).
// Positions are schematic; the arm names and the facts in the hover cards are the paper's.

const W = 760;
const H = 640;
const C: Pt = [380, 316];
const R_ROUTER = 62;
const R_INNER = 77;
const R_NODE = 23;
const RINGS = [104, 152, 202, 254, 308, 366];
const SWEEP_PERIOD = 7.5;

interface Arm {
  id: number;
  short: string;
  name: string;
  pool: Pool;
  fact: string;
  angle: number;
  r: number;
}

const ARMS: Arm[] = [
  { id: 1, short: 'OPUS 5.5', name: 'Claude Opus 5.5 · language model', pool: 'language', fact: 'The best fixed arm on most text, image-text and agent benchmarks.', angle: -162, r: 252 },
  { id: 2, short: 'GPT-6.1 SOL', name: 'GPT-6.1 Sol · language model', pool: 'language', fact: 'The fixed arm on GDP.pdf, and the best arm in hindsight on AA-Briefcase.', angle: -134, r: 260 },
  { id: 3, short: 'GPT IMAGE 2.5', name: 'GPT Image 2.5 · image generator', pool: 'image', fact: 'Best on GenEval2 and Qwen-Image-Bench, at $0.21 an image: 3.5–5.4× the other generators.', angle: -104, r: 262 },
  { id: 4, short: 'GROK IMAGINE 2.0', name: 'Grok Imagine 2.0 · image generator', pool: 'image', fact: '60 m$ an image. The half-point price route moves Qwen-Image-Bench here.', angle: -76, r: 250 },
  { id: 5, short: 'MINIMAX H3', name: 'MiniMax H3 · video generator', pool: 'video', fact: 'The best fixed video generator: 62.43 on VBench-2.0, where the per-input oracle reaches 81.36.', angle: -16, r: 258 },
  { id: 6, short: 'SEEDANCE 2.5', name: 'Seedance 2.5 · video generator', pool: 'video', fact: 'One of three video generators. No video arm dominates: the per-input headroom is 18.9 points.', angle: 16, r: 252 },
  { id: 7, short: 'FISH S2.1', name: 'Fish S2.1 Pro · speech generator', pool: 'speech', fact: 'The fixed speech generator and among the cheapest (0.9–1.1 m$), so there is nothing to trade.', angle: 52, r: 252 },
  { id: 8, short: 'GEMINI 3.8 TTS', name: 'Gemini 3.8 Flash TTS · speech generator', pool: 'speech', fact: 'Best in hindsight on Seed-TTS (en), by 0.02 points: speech headroom is 0.7 points.', angle: 86, r: 250 },
  { id: 9, short: 'ME-DEX', name: 'ME-Dex · robot policy', pool: 'robot', fact: 'The best single policy (70.45%), and the better one on domain-randomized scenes (62.5%).', angle: 124, r: 254 },
  { id: 10, short: 'PATCHWAM', name: 'PatchWAM · robot policy', pool: 'robot', fact: 'Second overall (63.65%), but the better policy on clean scenes (81.7%).', angle: 172, r: 250 },
];

const ARM = Object.fromEntries(ARMS.map((a) => [a.id, a])) as Record<number, Arm>;
const pos = (m: Arm): Pt => [C[0] + m.r * Math.cos((m.angle * Math.PI) / 180), C[1] + m.r * Math.sin((m.angle * Math.PI) / 180)];
const NODE = Object.fromEntries(ARMS.map((m) => [m.id, pos(m)])) as Record<number, Pt>;

/** straight route from the router's inner ring to an arm's edge */
function route(id: number, r0 = R_INNER + 4): Pt[] {
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

export type Scenario = 'gain' | 'recover' | 'pay';
export const SCENARIOS: { key: Scenario; tag: string; label: string }[] = [
  { key: 'gain', tag: 'Gain', label: 'A question' },
  { key: 'recover', tag: 'Recover', label: 'A robot scene' },
  { key: 'pay', tag: 'Pay', label: 'An image prompt' },
];

// shared phase times (seconds into a round); `shift` delays the dispatch where the price is weighed first
const ARRIVE = [0, 1.05] as const;
const THINK = [1.05, 1.8] as const;
const DRAW = [1.75, 2.25] as const;
const OUT = [2.2, 3.05] as const;
const WORK = [3.05, 3.35] as const;
const BACK = [3.35, 4.15] as const;

const PLAN: Record<Scenario, { dur: number; shift: number; settle: number; fade: number }> = {
  gain: { dur: 6.4, shift: 0, settle: 4.6, fade: 5.6 },
  recover: { dur: 6.6, shift: 0, settle: 4.6, fade: 5.8 },
  pay: { dur: 7.8, shift: 0.55, settle: 5.2, fade: 6.6 },
};

const span = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const pulseAt = (t: number, at: number, len = 0.7) => (t >= at && t < at + len ? 1 - (t - at) / len : 0);

export type FocusWord = 0 | 1 | 2;

interface Props {
  className?: string;
  /** reports which of the three questions (gain, recover, pay) the field is acting out */
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
  const total = useMemo(() => SCENARIOS.reduce((s, x) => s + PLAN[x.key].dur, 0), []);
  const elapsed = reduced ? 4.4 : Math.max(0, clock - start.at);
  const cycle = Math.floor(elapsed / total);
  let k = start.scenario;
  let t = elapsed % total;
  for (let i = 0; i < 3; i++) {
    const key = SCENARIOS[(start.scenario + i) % 3].key;
    if (t < PLAN[key].dur) {
      k = (start.scenario + i) % 3;
      break;
    }
    t -= PLAN[key].dur;
  }
  if (reduced) {
    k = 2;
    t = 4.9;
  }
  const scenario = SCENARIOS[k].key;
  const plan = PLAN[scenario];
  const sh = plan.shift;

  // the robot round alternates between a domain-randomized scene (ME-Dex) and a clean one (PatchWAM)
  const cleanScene = cycle % 2 === 1;
  const target = scenario === 'gain' ? 2 : scenario === 'recover' ? (cleanScene ? 10 : 9) : 4;
  const verdictAt = BACK[1] + sh;

  const phase: 'arrive' | 'think' | 'price' | 'go' | 'ok' | 'settle' = (() => {
    if (t < ARRIVE[1]) return 'arrive';
    if (t < DRAW[0]) return 'think';
    if (scenario === 'pay' && t < DRAW[0] + sh + 0.25) return 'price';
    if (t >= plan.settle) return 'settle';
    if (t >= verdictAt) return 'ok';
    return 'go';
  })();

  const focusWord = k as FocusWord;
  const lastFocus = useRef<FocusWord | null>(null);
  useEffect(() => {
    if (lastFocus.current !== focusWord) {
      lastFocus.current = focusWord;
      onFocus?.(focusWord);
    }
  }, [focusWord, onFocus]);

  const status = (() => {
    if (scenario === 'gain') {
      return {
        arrive: 'A question arrives',
        think: 'Every arm is scored: value minus priced cost',
        price: '',
        go: 'This input goes to GPT-6.1 Sol',
        ok: 'The best arm changes from input to input',
        settle: 'Per input, the oracle gains 5.4 points over the best fixed arm',
      }[phase];
    }
    if (scenario === 'recover') {
      return {
        arrive: 'Three camera frames and the robot state arrive',
        think: 'Each policy is scored by its predicted success',
        price: '',
        go: cleanScene ? 'A clean scene goes to PatchWAM' : 'A randomized scene goes to ME-Dex',
        ok: 'The router follows the better policy in each scene',
        settle: 'Matching the better policy, with 24% less policy time',
      }[phase];
    }
    return {
      arrive: 'An image prompt arrives',
      think: 'At a price, each arm is worth value minus priced cost',
      price: 'GPT Image 2.5 costs 211 m$ an image',
      go: 'Grok Imagine 2.0, at 60 m$, wins at this price',
      ok: 'Inside the quality floor',
      settle: 'The route cuts image cost by 26% for 0.47 points',
    }[phase];
  })();

  const fade = 1 - span(t, plan.fade, plan.fade + 0.6);
  const sweep = ((reduced ? 2.2 : clock) / SWEEP_PERIOD) * 360 - 90;

  // node tones
  const nodeState = (id: number) => {
    let tone: 'idle' | 'blue' | 'amber' | 'teal' = 'idle';
    let pulse = 0;
    let dim = false;
    if (id === target && t >= DRAW[0] + sh && fade > 0.02) {
      tone = t >= verdictAt ? 'teal' : 'blue';
      pulse = Math.max(pulseAt(t, WORK[0] + sh, 0.8), pulseAt(t, verdictAt - 0.05, 0.6));
    }
    if (scenario === 'pay' && id === 3 && t >= THINK[0] && fade > 0.02) {
      tone = 'amber';
      dim = t >= DRAW[0] + sh + 0.3;
      pulse = pulseAt(t, DRAW[0] + 0.3, 0.7);
    }
    // the sweep lights each arm as it passes
    const m = ARM[id];
    const behind = (((sweep - m.angle) % 360) + 360) % 360;
    const lit = Math.max(0, 1 - behind / 46);
    return { tone, pulse, dim, lit };
  };

  const think = span(t, THINK[0], THINK[0] + 0.35) * (1 - span(t, THINK[1] - 0.1, DRAW[1] + sh));
  const priceGlow = phase === 'think' || phase === 'price';
  const floorGlow = scenario === 'pay' && (phase === 'ok' || phase === 'settle');

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
  addComets(route(target), OUT[0] + sh, OUT[1] + sh, 'var(--blue)');
  addComets(route(target), BACK[0] + sh, BACK[1] + sh, 'var(--teal)', true);

  const verdictPop = t >= verdictAt ? span(t, verdictAt, verdictAt + 0.25) : 0;

  // input chip path into the router
  const chipPath: Pt[] = [
    [-30, 290],
    [70, 300],
    [190, 314],
    [C[0] - R_INNER - 8, C[1]],
  ];
  const chip = pointAt(chipPath, smooth(arrive) * pathLen(chipPath));
  const chipLabel = scenario === 'gain' ? 'QUESTION' : scenario === 'recover' ? (cleanScene ? 'CLEAN SCENE' : 'RANDOMIZED SCENE') : 'IMAGE PROMPT';
  const chipW = chipLabel.length * 7.4 + 58;

  const hl = (body: string, on: boolean) => (on ? `\\htmlClass{eq-hl}{${body}}` : body);
  const eq = `${hl('u', phase === 'go' || phase === 'ok')}=${hl('g', phase === 'think' || phase === 'price')}(s),\\quad s=${hl('\\sigma', phase === 'think' && scenario === 'recover')}(${hl('x', phase === 'arrive')})`;

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
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-4">Schematic · 10 of the matrix’s 23 arms</div>
      </div>
      <div ref={ref} className="relative w-full select-none [container-type:inline-size]" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full overflow-visible"
          role="img"
          aria-label="Animated schematic: one router among arms of every output type, from language models to image, video and speech generators and robot policies. An input arrives, every arm is scored by value minus priced cost, and the router plays the best: a question goes to a language model, a robot scene to the policy that suits it, and an image prompt to a cheaper generator at a price."
        >
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
          {ripple > 0 &&
            ripple < 1 &&
            [0, 0.35].map((off) => {
              const u = Math.max(0, Math.min(1, (ripple - off) / (1 - off)));
              return u > 0 && u < 1 ? <circle key={off} cx={C[0]} cy={C[1]} r={R_ROUTER + u * 120} fill="none" stroke="var(--blue)" strokeWidth={1.4} opacity={(1 - u) * 0.55} /> : null;
            })}

          {/* spokes: while the router scores, every one of them carries a signal out */}
          {ARMS.map((m, i) => {
            const pts = route(m.id);
            const chosen = m.id === target && t >= DRAW[0] + sh;
            const hovered = hover === m.id;
            const sig = span(t, THINK[0] + i * 0.035, THINK[0] + 0.45 + i * 0.035);
            return (
              <g key={m.id}>
                <path d={d(pts)} stroke="var(--line)" strokeWidth={hovered ? 1.6 : 1} opacity={hovered ? 0.95 : 0.42} fill="none" />
                {think > 0.02 && !chosen && <path d={d(slice(pts, 0, sig * 200))} stroke="var(--blue)" strokeWidth={1.2} strokeDasharray="2 5" opacity={think * 0.7} fill="none" />}
              </g>
            );
          })}

          {/* the reference generator is weighed at its price, and passed over */}
          {scenario === 'pay' && t >= DRAW[0] && (
            <g opacity={fade}>
              <path
                d={d(slice(route(3), 0, span(t, DRAW[0], DRAW[0] + 0.35) * 120))}
                stroke="var(--amber)"
                strokeWidth={1.8}
                strokeDasharray="5 5"
                fill="none"
                opacity={1 - 0.6 * span(t, DRAW[0] + sh + 0.3, DRAW[0] + sh + 0.7)}
              />
              {t >= DRAW[0] + 0.35 &&
                (() => {
                  const p = pointAt(route(3), 120);
                  const pop = span(t, DRAW[0] + 0.35, DRAW[0] + 0.55);
                  return (
                    <g transform={`translate(${p[0]} ${p[1]}) scale(${0.5 + 0.5 * pop})`} opacity={pop}>
                      <circle r={10} fill="var(--surface)" stroke="var(--amber)" strokeWidth={1.4} />
                      <path d="M-3.5,-3.5 L3.5,3.5 M3.5,-3.5 L-3.5,3.5" stroke="var(--amber)" strokeWidth={1.6} strokeLinecap="round" />
                    </g>
                  );
                })()}
            </g>
          )}

          {/* the chosen route */}
          {t >= DRAW[0] + sh && (
            <path
              d={d(slice(route(target), 0, span(t, DRAW[0] + sh, DRAW[1] + sh) * 400))}
              stroke={t >= verdictAt ? 'var(--teal)' : 'var(--blue)'}
              strokeWidth={2}
              fill="none"
              opacity={fade}
              style={{ transition: 'stroke .35s' }}
            />
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

          {/* the router */}
          <circle cx={C[0]} cy={C[1]} r={R_INNER} fill="none" stroke="var(--line-soft)" strokeWidth={1.2} strokeDasharray="2 6">
            {!reduced && <animateTransform attributeName="transform" type="rotate" from={`360 ${C[0]} ${C[1]}`} to={`0 ${C[0]} ${C[1]}`} dur="40s" repeatCount="indefinite" />}
          </circle>
          <circle cx={C[0]} cy={C[1]} r={R_ROUTER} fill="url(#cf-router)" stroke="var(--accent)" strokeWidth={1.7} />
          <circle cx={C[0]} cy={C[1]} r={R_ROUTER} fill="var(--accent)" opacity={0.08 * (ripple > 0 && ripple < 1 ? 1 - ripple : 0) + (think > 0 ? 0.05 * think : 0)} />
          <TexLabel x={C[0]} y={C[1] - 2} t="g(s)" size={33} color="var(--accent)" w={130} h={46} />
          <g>
            <rect x={C[0] - 80} y={C[1] + R_INNER + 14} width={160} height={20} rx={10} fill="var(--bg)" opacity={0.85} />
            <text x={C[0]} y={C[1] + R_INNER + 28} textAnchor="middle" fontSize={11} letterSpacing={1.8} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
              OMNI-MODAL ROUTER
            </text>
          </g>

          {/* verdict badge */}
          {verdictPop > 0 && (
            <g transform={`translate(${C[0] + 60} ${C[1] - 60}) scale(${0.4 + 0.6 * verdictPop})`} opacity={fade}>
              <circle r={13} fill="var(--teal)" />
              <text y={4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff" style={{ fontFamily: 'var(--font-sans)' }}>
                ✓
              </text>
            </g>
          )}

          {/* arms */}
          {ARMS.map((m) => {
            const [x, y] = NODE[m.id];
            const s = nodeState(m.id);
            const toneColor = s.tone === 'blue' ? 'var(--blue)' : s.tone === 'amber' ? 'var(--amber)' : s.tone === 'teal' ? 'var(--teal)' : null;
            const stroke = toneColor ?? (s.lit > 0.02 ? 'var(--blue)' : 'var(--line-soft)');
            const strokeOpacity = toneColor ? 1 : s.lit > 0.02 ? 0.35 + 0.65 * s.lit : 1;
            const fill = s.tone === 'blue' ? 'var(--blue-wash)' : s.tone === 'amber' ? 'var(--amber-wash)' : s.tone === 'teal' ? 'var(--teal-wash)' : 'var(--surface)';
            const priced = scenario === 'pay' && (m.id === 3 || m.id === 4) && t >= THINK[0] + 0.15;
            return (
              <g
                key={m.id}
                opacity={s.dim ? 0.55 : 1}
                style={{ transition: 'opacity .35s', cursor: 'pointer' }}
                onMouseEnter={() => setHover(m.id)}
                onMouseLeave={() => setHover(null)}
              >
                <circle cx={x} cy={y} r={R_NODE + 14} fill="transparent" />
                {s.pulse > 0.01 && <circle cx={x} cy={y} r={R_NODE + 4 + (1 - s.pulse) * 16} fill="none" stroke={toneColor ?? 'var(--blue)'} strokeWidth={1.5} opacity={s.pulse * 0.8} />}
                {s.lit > 0.02 && !toneColor && <circle cx={x} cy={y} r={R_NODE + 7} fill="var(--blue)" opacity={0.07 * s.lit} />}
                <circle cx={x} cy={y} r={R_NODE} fill={fill} stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth={toneColor || hover === m.id ? 1.9 : 1.4} style={{ transition: 'fill .35s' }} />
                <PoolIcon pool={m.pool} x={x} y={y} color={toneColor ?? 'var(--ink-2)'} />
                <text x={x} y={y + R_NODE + 20} textAnchor="middle" fontSize={10.5} letterSpacing={1.2} fill={toneColor ?? 'var(--ink-3)'} style={{ fontFamily: 'var(--font-mono)' }}>
                  {m.short}
                </text>
                {priced && (
                  <text
                    x={x}
                    y={y - R_NODE - 9}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={m.id === 3 ? 'var(--amber)' : 'var(--ink-2)'}
                    opacity={fade * span(t, THINK[0] + 0.15, THINK[0] + 0.5)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {m.id === 3 ? '211 m$' : '60 m$'}
                  </text>
                )}
              </g>
            );
          })}

          {/* the input, flying in */}
          {arrive > 0 && arrive < 1 && (
            <g transform={`translate(${chip[0]} ${chip[1]}) scale(${1 - 0.55 * smooth(span(arrive, 0.75, 1))})`} opacity={Math.min(1, arrive * 4) * (1 - span(arrive, 0.85, 1))}>
              <rect x={-chipW / 2} y={-16} width={chipW} height={32} rx={16} fill="var(--surface)" stroke="var(--blue)" strokeWidth={1.4} />
              <text x={-chipW / 2 + 16} y={4} fontSize={10.5} letterSpacing={1.4} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
                {chipLabel}
              </text>
              <TexLabel x={chipW / 2 - 20} y={0} t="x" size={16} color="var(--blue)" w={30} h={28} />
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
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{ARM[hover].name}</div>
              <p className="mt-1.5 font-serif text-[13.5px] leading-snug text-ink-2">{ARM[hover].fact}</p>
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
              <span className={`block font-mono text-[10px] uppercase tracking-[0.16em] ${active ? 'text-accent' : 'text-ink-4'}`}>
                0{i + 1} · {s.tag}
              </span>
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
