import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { motion, type Transition } from 'motion/react';
import { Slider } from '@/components/ui/Slider';
import { M } from '@/components/math/M';
import { clamp, useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { hash01 } from '@/lib/polyline';
import { tex } from '@/lib/tex';
import { useTokens } from '@/theme/tokens';
import { FigTag } from './flow';
import { TexLabel, mono, sans } from './svg';

// Proposition 4(b), schematic. Candidate A always delivers a; candidate B delivers 1 with probability b and 0
// otherwise, with 1/2 < b < a < 1. B wins exactly when it delivers 1, so a winner label teaches
// p_A = 1 - b < p_B = b and a classifier plays B, while outcome regression learns E[V_A] = a > E[V_B] = b
// and plays A. The classifier gives up a - b, which nears half the value range as a -> 1, b -> 1/2.
// Below: the paper's tie-break example, twenty paired draws with the exact expected counts.

const A_COLOR = 'var(--teal)';
const B_COLOR = 'var(--amber)';
const A_WASH = 'var(--teal-wash)';
const B_WASH = 'var(--amber-wash)';
const DEFAULT = { a: 90, b: 60 };
const LIMIT = { a: 99, b: 51 };
const SPRING: Transition = { type: 'spring', stiffness: 210, damping: 27 };
const f2 = (v: number) => v.toFixed(2);

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
const useSafeId = () => `wt-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

/* ------------------------------------------------------------------ */
/* controls                                                            */
/* ------------------------------------------------------------------ */

function ArmControl({
  candidate,
  color,
  sym,
  desc,
  value,
  onChange,
}: {
  candidate: 'A' | 'B';
  color: string;
  sym: 'a' | 'b';
  desc: ReactNode;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2 font-sans text-[13.5px] leading-snug text-ink-2">
          <span className="inline-block h-2.5 w-2.5 shrink-0 translate-y-[1px] rounded-[3px]" style={{ background: color }} />
          <span>
            Candidate <M>{candidate}</M> {desc}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[13px] tabular-nums text-ink">
          <M>{sym}</M> = {f2(value / 100)}
        </span>
      </div>
      <Slider value={value - 50} onChange={(v) => onChange(v + 50)} max={50} color={color} left="½" right="1" ariaLabel={`${sym}, ${candidate === 'A' ? 'the value candidate A always delivers' : 'the probability that candidate B delivers 1'}`} className="mt-1" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the two panels: what the label teaches, what you get                */
/* ------------------------------------------------------------------ */

const PH = 252;
const BASE = 208;
const TOP = 52;
const py = (v: number) => BASE - v * (BASE - TOP);

function panelGeom(narrow: boolean) {
  const W = narrow ? 340 : 400;
  const x0 = 34;
  const bw = narrow ? 34 : 38;
  const ax = narrow ? 102 : 138;
  const bx = narrow ? 202 : 270;
  return { W, x0, x1: W - 6, bw, ax, bx };
}

function Column({ cx, w, v, picked, color, wash, clip, tr }: { cx: number; w: number; v: number; picked: boolean; color: string; wash: string; clip: string; tr: Transition }) {
  // drawn 6px past the baseline and clipped there: rounded data end, square base
  return (
    <motion.rect
      x={cx - w / 2}
      width={w}
      rx={4}
      clipPath={`url(#${clip})`}
      initial={false}
      animate={{ y: py(v), height: BASE - py(v) + 6 }}
      transition={tr}
      fill={picked ? color : wash}
      stroke={picked ? 'none' : color}
      strokeWidth={picked ? 0 : 1.4}
      style={{ transition: 'fill .3s' }}
    />
  );
}

function Pick({ cx, text }: { cx: number; text: string }) {
  const w = text.length * 6.3 + 20;
  return (
    <g transform={`translate(${cx} 14)`}>
      <rect x={-w / 2} y={-10.5} width={w} height={21} rx={10.5} fill="var(--surface)" stroke="var(--ink-3)" strokeWidth={1} />
      <text y={4} textAnchor="middle" fontSize={11} fill="var(--ink-2)" style={sans}>
        {text}
      </text>
      <path d="M-4,10.5 L0,15 L4,10.5" fill="var(--surface)" stroke="var(--ink-3)" strokeWidth={1} strokeLinejoin="round" />
      <rect x={-3.4} y={9.6} width={6.8} height={1.6} fill="var(--surface)" />
    </g>
  );
}

function Panel({ kind, a, b, narrow, grow, delay }: { kind: 'win' | 'value'; a: number; b: number; narrow: boolean; grow: boolean; delay: number }) {
  const G = panelGeom(narrow);
  const clip = useSafeId();
  // columns grow from the baseline on first view; after that they follow the sliders at once
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!grow || settled) return;
    const id = window.setTimeout(() => setSettled(true), (delay + 1.2) * 1000);
    return () => window.clearTimeout(id);
  }, [grow, settled, delay]);
  const tr: Transition = settled ? SPRING : { ...SPRING, delay };
  const k = grow ? 1 : 0;
  const vA = k * (kind === 'win' ? 1 - b : a);
  const vB = k * b;
  const fade = (extra: number) => ({ opacity: grow ? 1 : 0, transition: `opacity .45s ease ${settled ? 0 : delay + extra}s` });
  const pickA = kind === 'value';
  const gx = G.bx + G.bw / 2 + 7; // the gap marker, right of B
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">{kind === 'win' ? 'What a winner label teaches' : 'What you actually get'}</span>
        <span
          className="whitespace-nowrap text-[14.5px] text-ink"
          dangerouslySetInnerHTML={{ __html: tex(kind === 'win' ? 'p_u=\\Pr(u\\text{ wins})' : '\\mathbb E[V_u]') }}
        />
      </div>
      <svg
        viewBox={`0 0 ${G.W} ${PH}`}
        className="mt-1 h-auto w-full overflow-visible"
        role="img"
        aria-label={
          kind === 'win'
            ? `Probability of winning: candidate A ${f2(1 - b)}, candidate B ${f2(b)}. A classifier on winner labels picks B.`
            : `Expected value: candidate A ${f2(a)}, candidate B ${f2(b)}. Outcome regression picks A; picking B loses ${f2(a - b)}.`
        }
      >
        <defs>
          <clipPath id={clip}>
            <rect x={0} y={0} width={G.W} height={BASE} />
          </clipPath>
        </defs>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={G.x0} x2={G.x1} y1={py(v)} y2={py(v)} stroke={v === 0 ? 'var(--ink-4)' : 'var(--rule)'} strokeWidth={1} />
            <text x={G.x0 - 8} y={py(v) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" style={mono}>
              {v === 0.5 ? '½' : v}
            </text>
          </g>
        ))}

        {kind === 'value' && (
          <g style={fade(0.75)}>
            {/* level a, carried across to B: what the winner label gives up */}
            <motion.line
              x1={G.ax + G.bw / 2 + 4}
              x2={gx + 6}
              initial={false}
              animate={{ y1: py(a), y2: py(a) }}
              transition={SPRING}
              stroke="var(--ink-4)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <motion.rect x={gx} width={6} rx={3} initial={false} animate={{ y: py(a), height: Math.max(0.5, py(b) - py(a)) }} transition={SPRING} fill="var(--coral)" />
            <motion.g initial={false} animate={{ y: (py(a) + py(b)) / 2 }} transition={SPRING}>
              <text x={gx + 14} y={-9} fontSize={9.5} letterSpacing="0.14em" fill="var(--ink-3)" style={mono}>
                LOST
              </text>
              <TexLabel x={gx + 14} y={8} t={`a-b=${f2(a - b)}`} anchor="start" size={14} color="var(--ink)" w={120} />
            </motion.g>
          </g>
        )}

        <g style={{ opacity: grow ? 1 : 0, transition: `opacity .15s ease ${settled ? 0 : delay}s` }}>
          <Column cx={G.ax} w={G.bw} v={vA} picked={pickA} color={A_COLOR} wash={A_WASH} clip={clip} tr={tr} />
          <Column cx={G.bx} w={G.bw} v={vB} picked={!pickA} color={B_COLOR} wash={B_WASH} clip={clip} tr={tr} />
        </g>

        {[
          { cx: G.ax, v: vA, on: pickA },
          { cx: G.bx, v: vB, on: !pickA },
        ].map((c, i) => (
          <g key={i} style={fade(0.45)}>
            <motion.text
              x={c.cx}
              initial={false}
              animate={{ y: py(c.v) - 8 }}
              transition={tr}
              textAnchor="middle"
              fontSize={12}
              fontWeight={c.on ? 600 : 400}
              fill={c.on ? 'var(--ink)' : 'var(--ink-2)'}
              style={mono}
            >
              {f2(c.v)}
            </motion.text>
          </g>
        ))}

        <TexLabel x={G.ax} y={BASE + 24} t={kind === 'win' ? 'p_A=1-b' : '\\mathbb E[V_A]=a'} size={13.5} color="var(--ink-2)" w={120} />
        <TexLabel x={G.bx} y={BASE + 24} t={kind === 'win' ? 'p_B=b' : '\\mathbb E[V_B]=b'} size={13.5} color="var(--ink-2)" w={120} />

        <g style={fade(0.6)}>
          <Pick cx={pickA ? G.ax : G.bx} text={pickA ? 'regression picks' : 'classifier picks'} />
        </g>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the tie-break example                                               */
/* ------------------------------------------------------------------ */

// Slow candidate succeeds with probability 0.9, the faster independent candidate with 0.5; ties go to the faster
// candidate. Twenty draws with the exact expected counts (9 both succeed, 9 only the slow candidate, 1 only the
// fast candidate, 1 neither), in a fixed pseudo-random order.
const P_SLOW = 0.9;
const P_FAST = 0.5;
type Draw = { slow: boolean; fast: boolean };
const DRAWS: Draw[] = [...Array<string>(9).fill('both'), ...Array<string>(9).fill('slow'), 'fast', 'none']
  .map((k, i) => ({ k, u: hash01(i, 1784) }))
  .sort((p, q) => p.u - q.u)
  .map(({ k }) => ({ slow: k === 'both' || k === 'slow', fast: k === 'both' || k === 'fast' }));
const N_DRAWS = DRAWS.length;
/** the slow candidate wins the label only when it succeeds and the fast candidate fails */
const slowWins = (d: Draw) => d.slow && !d.fast;
const isTie = (d: Draw) => d.slow === d.fast;

const STEP = 0.42;
const START = 0.5;
const END = START + (N_DRAWS - 1) * STEP + 0.6;

function stripGeom(narrow: boolean) {
  const perRow = narrow ? 10 : N_DRAWS;
  const W = narrow ? 340 : 590;
  const x0 = narrow ? 96 : 152;
  const dx = narrow ? 24.4 : 22.6;
  const blockH = 104;
  const rows = { slow: 22, fast: 54, label: 86 };
  const blocks = Math.ceil(N_DRAWS / perRow);
  return { perRow, W, H: blocks * blockH - 4, x0, dx, blockH, rows };
}

function Share({ value, target, color, n }: { value: number; target: number; color: string; n: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[34px] shrink-0 text-right font-mono text-[12.5px] tabular-nums text-ink">{n ? f2(value) : '—'}</span>
      <span className="relative h-[6px] min-w-0 flex-1 rounded-[3px] bg-line-soft">
        <span
          className="absolute inset-y-0 left-0 rounded-[3px]"
          style={{ width: `${value * 100}%`, background: color, transition: 'width .45s cubic-bezier(.22,1,.36,1)' }}
        />
        <span className="absolute top-[-4px] h-[14px] w-[1.5px] -translate-x-1/2 rounded-full bg-ink-2" style={{ left: `${target * 100}%` }} />
      </span>
    </div>
  );
}

function TieStrip({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const narrow = width > 0 && width < 560;
  const G = stripGeom(narrow);
  const inView = useInView(ref, '-40px');
  const [done, setDone] = useState(false);
  const [t, reset] = useClock(inView && !reduced && !done);
  const now = reduced ? END : t;
  useEffect(() => {
    if (!done && !reduced && t >= END) setDone(true);
  }, [t, done, reduced]);
  const replay = () => {
    reset(0);
    setDone(false);
  };

  const age = (i: number) => now - (START + i * STEP);
  const seen = DRAWS.filter((_, i) => age(i) >= 0);
  const n = seen.length;
  const slowSucc = seen.filter((d) => d.slow).length;
  const fastSucc = seen.filter((d) => d.fast).length;
  const slowLabel = seen.filter(slowWins).length;
  const share = (k: number) => (n ? k / n : 0);

  const rowLabel = (y: number, color: string | null, name: string, p: string | null) => (
    <g>
      {color && <circle cx={6} cy={y} r={4.5} fill={color} />}
      <text x={color ? 17 : 0} y={y + 4} fontSize={12.5} fill={color ? 'var(--ink-2)' : 'var(--ink-3)'} style={sans}>
        {name}
      </text>
      {p && (
        <text x={G.x0 - 20} y={y + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" style={mono}>
          {p}
        </text>
      )}
    </g>
  );

  return (
    <div ref={ref}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">Ties make it worse</span>
          <span className="font-sans text-[13px] text-ink-2">Both succeed, or both fail: the label goes to the faster candidate.</span>
        </div>
        <button
          type="button"
          onClick={replay}
          disabled={reduced || !done}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink disabled:cursor-default disabled:opacity-0"
        >
          ↻ Replay
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 items-center gap-x-8 gap-y-5 md:grid-cols-[minmax(0,1fr)_252px]">
        <svg
          viewBox={`0 0 ${G.W} ${G.H}`}
          className={`h-auto w-full overflow-visible ${narrow ? 'mx-auto max-w-[420px]' : ''}`}
          role="img"
          aria-label="Twenty paired draws. The slow candidate succeeds in 18, the fast candidate in 10; the slow candidate wins the label in 9, because ties go to the fast candidate."
        >
          {Array.from({ length: Math.ceil(N_DRAWS / G.perRow) }, (_, blk) => (
            <g key={blk} transform={`translate(0 ${blk * G.blockH})`}>
              {rowLabel(G.rows.slow, A_COLOR, narrow ? 'slow' : 'slow candidate', '0.9')}
              {rowLabel(G.rows.fast, B_COLOR, narrow ? 'fast' : 'fast candidate', '0.5')}
              {rowLabel(G.rows.label, null, narrow ? 'label' : 'winner label', null)}
            </g>
          ))}
          {DRAWS.map((dr, i) => {
            const a0 = age(i);
            const pop = reduced ? 1 : clamp(a0 / 0.22);
            const lab = reduced ? 1 : clamp((a0 - 0.16) / 0.22);
            const blk = Math.floor(i / G.perRow);
            const cx = G.x0 + (i % G.perRow) * G.dx;
            const oy = blk * G.blockH;
            const win = slowWins(dr) ? A_COLOR : B_COLOR;
            const tie = isTie(dr);
            return (
              <g key={i} transform={`translate(${cx} ${oy})`}>
                {/* the empty slot, until the draw arrives */}
                <circle cy={G.rows.slow} r={1.6} fill="var(--ink-4)" opacity={0.6 * (1 - pop)} />
                <circle cy={G.rows.fast} r={1.6} fill="var(--ink-4)" opacity={0.6 * (1 - pop)} />
                <circle cy={G.rows.label} r={1.6} fill="var(--ink-4)" opacity={0.6 * (1 - lab)} />
                {pop > 0 && (
                  <g opacity={pop}>
                    {[
                      { y: G.rows.slow, ok: dr.slow, color: A_COLOR },
                      { y: G.rows.fast, ok: dr.fast, color: B_COLOR },
                    ].map((m) => (
                      <circle
                        key={m.y}
                        cy={m.y}
                        r={(m.ok ? 5.5 : 4.6) * (0.5 + 0.5 * pop)}
                        fill={m.ok ? m.color : 'var(--surface)'}
                        stroke={m.ok ? 'var(--surface)' : 'var(--ink-4)'}
                        strokeWidth={m.ok ? 2 : 1.3}
                      />
                    ))}
                  </g>
                )}
                {lab > 0 && (
                  <g opacity={lab} transform={`translate(0 ${G.rows.label}) scale(${0.6 + 0.4 * lab})`}>
                    <rect x={-5.5} y={-5.5} width={11} height={11} rx={2.5} fill={tie ? 'var(--surface)' : win} stroke={win} strokeWidth={tie ? 1.6 : 0} />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <div>
          <div className="grid grid-cols-[50px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5">
            <span />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">succeeds</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">wins label</span>
            <span className="flex items-center gap-1.5 font-sans text-[12.5px] text-ink-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: A_COLOR }} />
              slow
            </span>
            <Share value={share(slowSucc)} target={P_SLOW} color={A_COLOR} n={n} />
            <Share value={share(slowLabel)} target={P_SLOW * (1 - P_FAST)} color={A_COLOR} n={n} />
            <span className="flex items-center gap-1.5 font-sans text-[12.5px] text-ink-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: B_COLOR }} />
              fast
            </span>
            <Share value={share(fastSucc)} target={P_FAST} color={B_COLOR} n={n} />
            <Share value={share(n - slowLabel)} target={1 - P_SLOW * (1 - P_FAST)} color={B_COLOR} n={n} />
          </div>
          <p className="mt-3 font-sans text-[12px] leading-snug text-ink-3">
            <span className="font-mono tabular-nums text-ink-2">{n}</span> of {N_DRAWS} draws; ticks mark the probabilities
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-sans text-[12px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <svg width={12} height={12} aria-hidden>
              <circle cx={6} cy={6} r={5} fill="var(--ink-3)" />
            </svg>
            succeeds
          </span>
          <span className="flex items-center gap-1.5">
            <svg width={12} height={12} aria-hidden>
              <circle cx={6} cy={6} r={4.4} fill="none" stroke="var(--ink-4)" strokeWidth={1.3} />
            </svg>
            fails
          </span>
          <span className="flex items-center gap-1.5">
            <svg width={12} height={12} aria-hidden>
              <rect x={0.5} y={0.5} width={11} height={11} rx={2.5} fill="var(--ink-3)" />
            </svg>
            label, by outcome
          </span>
          <span className="flex items-center gap-1.5">
            <svg width={12} height={12} aria-hidden>
              <rect x={1} y={1} width={10} height={10} rx={2.5} fill="none" stroke="var(--ink-3)" strokeWidth={1.6} />
            </svg>
            label, by the tie-break
          </span>
        </div>
        <FigTag>Outcomes, not winners</FigTag>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function WinnerTrap() {
  const tk = useTokens();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const narrow = width > 0 && width < 560;
  const panels = useRef<HTMLDivElement>(null);
  const seen = useInView(panels, '-60px', true);
  const grow = reduced || seen;
  const [aH, setA] = useState(DEFAULT.a);
  const [bH, setB] = useState(DEFAULT.b);
  const a = aH / 100;
  const b = bH / 100;

  const changeA = (v: number) => {
    const next = Math.round(clamp(v, 52, 99));
    setA(next);
    setB((cur) => Math.min(cur, next - 1));
  };
  const changeB = (v: number) => setB(Math.round(clamp(v, 51, aH - 1)));
  const atLimit = aH === LIMIT.a && bH === LIMIT.b;
  const atDefault = aH === DEFAULT.a && bH === DEFAULT.b;

  return (
    <div ref={ref}>
      <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
        <ArmControl candidate="A" color={tk.teal} sym="a" desc={<>always delivers <M>{'a'}</M></>} value={aH} onChange={changeA} />
        <ArmControl candidate="B" color={tk.amber} sym="b" desc={<>delivers 1 with probability <M>{'b'}</M>, else 0</>} value={bH} onChange={changeB} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="text-[13.5px] text-ink-3">
          <M>{'\\tfrac12<b<a<1'}</M>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setA(LIMIT.a);
              setB(LIMIT.b);
            }}
            disabled={atLimit}
            className="rounded-full border border-rule bg-surface px-3 py-1 font-sans text-[12px] text-ink-2 transition-colors hover:border-coral hover:text-ink disabled:cursor-default disabled:opacity-45 disabled:hover:border-rule"
          >
            Push to the limit
          </button>
          <button
            type="button"
            onClick={() => {
              setA(DEFAULT.a);
              setB(DEFAULT.b);
            }}
            disabled={atDefault}
            className="rounded-full px-2.5 py-1 font-sans text-[12px] text-ink-3 transition-colors hover:text-ink disabled:cursor-default disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>

      <div ref={panels} className="mx-auto mt-6 grid max-w-[480px] grid-cols-1 gap-x-10 gap-y-7 md:max-w-none md:grid-cols-2">
        <Panel kind="win" a={a} b={b} narrow={narrow} grow={grow} delay={0.1} />
        <Panel kind="value" a={a} b={b} narrow={narrow} grow={grow} delay={narrow ? 0.1 : 0.4} />
      </div>

      <div className="my-7 h-px bg-rule" />
      <TieStrip reduced={reduced} />
    </div>
  );
}
