import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent, type RefObject } from 'react';
import { motion } from 'motion/react';
import RubberSegment from '@/components/reactbits/RubberSegment/RubberSegment';
import { HEADROOM_BENCH, LADDER } from '@/data/results';
import { tex } from '@/lib/tex';
import { clamp, lerp, seg, useClock, useInView, useReducedMotion } from '@/lib/hooks';
import { useTokens } from '@/theme/tokens';
import { mono } from './svg';

// Proposition 3, measured. What a router can reach depends on what it observes:
//   V*(σ1) ≤ V*(σ2) ≤ V*(x) ≤ E[max_u W_u].
// The outer rungs are measured (best fixed arm, per-input oracle); inner rungs are lookups chosen in
// hindsight on the test inputs (dashed: optimistic) or a router that reads the state (a lower
// bound). V*(x) itself is not measured: it sits below the oracle by outcome noise. Each panel stays
// within one set of test inputs; the ladder's ends are drawn at the same height in every panel, so
// the rungs show what share of the gap each state reaches.

type PanelKey = 'all' | 'typed' | 'robot';
type RungKind = 'fixed' | 'hindsight' | 'router' | 'oracle' | 'band';
type Term = 's1' | 's2' | 's3' | 'x' | 'max';

interface Rung {
  key: string;
  kind: RungKind;
  /** height on the panel's score axis (the band has none) */
  v: number;
  term: Term;
  sym?: string;
  /** what the router observes */
  state: string;
  /** what the rung is; `$...$` is TeX */
  what: string;
  /** narrow screens: one short line */
  short: string;
  value: string;
  /** the read-out under the ladder */
  big: string;
  bigTex?: boolean;
  kicker: string;
  explain: string;
}

interface Panel {
  key: PanelKey;
  label: string;
  short: string;
  axis: string;
  ticks: number[];
  /** ascending: [0] is the fixed arm, the last the oracle */
  rungs: Rung[];
  /** the top of the "between" region */
  split: string;
  between?: { share: string; label: string };
  within: string;
  chain: Term[];
  head: { big: string; kicker: string; text: string };
  facts: string;
}

const f2 = (v: number) => v.toFixed(2);
const pct = (v: number) => `${Math.round(v * 100)}%`;

const { all, typed, robot, aaLcr } = LADDER;
const FIXED_POLICY = HEADROOM_BENCH.find((b) => b.group === 'robot')?.fixedArm ?? 'one policy';
const ROBOT_GAP = robot.oracle - robot.fixed;
const ROBOT_CELL = robot.fixed + robot.perTaskCondition.shareOfGap * ROBOT_GAP;

const RUNS = aaLcr.runs === 3 ? 'three' : String(aaLcr.runs);
const NOISE = `the oracle sits above it by outcome noise that no router can predict, as on AA-LCR, where the oracle’s ${aaLcr.margin}-point margin over the fixed arm vanishes once each arm is scored by its mean over ${RUNS} runs.`;

const band = (input: string, explainLead: string): Rung => ({
  key: 'band',
  kind: 'band',
  v: NaN,
  term: 'x',
  sym: 'V^\\star(x)',
  state: input,
  what: 'unmeasured; below the oracle by outcome noise',
  short: 'unmeasured',
  value: '',
  big: 'V^\\star(x)',
  bigTex: true,
  kicker: `${input} · not measured`,
  explain: `${explainLead} ${NOISE}`,
});

const ORACLE_SYM = '\\mathbb E[\\max_u W_u]';

const PANELS: Record<PanelKey, Panel> = {
  all: {
    key: 'all',
    label: `${all.benchmarks} benchmarks`,
    short: `All ${all.benchmarks}`,
    axis: 'SCORE',
    ticks: [82, 83, 84, 85, 86, 87, 88],
    facts: `${all.benchmarks} benchmarks · ${all.inputs.toLocaleString('en-US')} test inputs`,
    rungs: [
      {
        key: 'fixed',
        kind: 'fixed',
        v: all.fixed,
        term: 's1',
        sym: 'V^\\star(\\sigma_1)',
        state: 'The benchmark',
        what: 'best arm per benchmark, from training inputs',
        short: 'benchmark · training',
        value: f2(all.fixed),
        big: f2(all.fixed),
        kicker: 'Fixed arm per benchmark · measured',
        explain: 'Each benchmark always gets the arm with the best mean on its training inputs: the bottom rung, a router that observes only the benchmark.',
      },
      {
        key: 'hind',
        kind: 'hindsight',
        v: all.perBenchmark,
        term: 's1',
        sym: 'V^\\star(\\sigma_1)',
        state: 'The benchmark, in hindsight',
        what: 'best arm per benchmark, from the test inputs',
        short: 'benchmark · hindsight',
        value: f2(all.perBenchmark),
        big: f2(all.perBenchmark),
        kicker: 'Best arm per benchmark · in hindsight',
        explain: `Chosen on the test inputs themselves, the best arm per benchmark scores only ${f2(all.perBenchmark - all.fixed)} points more: the benchmark’s rung is pinned down.`,
      },
      band('The input itself', 'No experiment measures $V^\\star(x)$, the best a router that reads each input can do;'),
      {
        key: 'oracle',
        kind: 'oracle',
        v: all.oracle,
        term: 'max',
        sym: ORACLE_SYM,
        state: 'The realized outcomes',
        what: 'per-input oracle: the best arm on each input',
        short: 'per-input oracle',
        value: f2(all.oracle),
        big: f2(all.oracle),
        kicker: 'Per-input oracle · measured',
        explain: 'Each input gets the arm that scored best on it, which takes the outcomes themselves: the top of the ladder, not a router.',
      },
    ],
    split: 'hind',
    within: 'within benchmarks',
    chain: ['s1', 'x', 'max'],
    head: {
      big: `+${f2(all.perBenchmark - all.fixed)}`,
      kicker: 'Between benchmarks, in hindsight',
      text: `Even chosen on the test inputs, the best arm per benchmark adds ${f2(all.perBenchmark - all.fixed)} points; the ${f2(all.oracle - all.fixed)}-point gap to the oracle lies within benchmarks.`,
    },
  },
  typed: {
    key: 'typed',
    label: `${typed.benchmarks} typed benchmarks`,
    short: `${typed.benchmarks} typed`,
    axis: 'SCORE',
    ticks: [76, 78, 80, 82, 84, 86, 88],
    facts: `${typed.benchmarks} benchmarks · ${typed.inputs.toLocaleString('en-US')} test inputs · ${typed.leaves} capability leaves`,
    rungs: [
      {
        key: 'fixed',
        kind: 'fixed',
        v: typed.fixed,
        term: 's1',
        sym: 'V^\\star(\\sigma_1)',
        state: 'The benchmark',
        what: 'best arm per benchmark, from training inputs',
        short: 'benchmark · training',
        value: f2(typed.fixed),
        big: f2(typed.fixed),
        kicker: 'Fixed arm per benchmark · measured',
        explain: `The best arm per benchmark, chosen on training inputs, scored on the ${typed.inputs.toLocaleString('en-US')} test inputs that the rule-based tree assigns to its ${typed.leaves} capability leaves.`,
      },
      {
        key: 'leaf',
        kind: 'hindsight',
        v: typed.perLeaf,
        term: 's2',
        sym: 'V^\\star(\\sigma_2)',
        state: 'The capability leaf',
        what: `best arm for each of ${typed.leaves} leaves, in hindsight`,
        short: 'leaf · hindsight',
        value: f2(typed.perLeaf),
        big: f2(typed.perLeaf),
        kicker: 'Best arm per capability leaf · in hindsight',
        explain: `The best arm for each of the ${typed.leaves} leaves of the rule-based tree, chosen on the test inputs, an optimistic estimate of this rung: about ${pct(typed.betweenTypesShare)} of the gap.`,
      },
      band('The input itself', 'No experiment measures $V^\\star(x)$, the best a router that reads each input can do;'),
      {
        key: 'oracle',
        kind: 'oracle',
        v: typed.oracle,
        term: 'max',
        sym: ORACLE_SYM,
        state: 'The realized outcomes',
        what: 'per-input oracle: the best arm on each input',
        short: 'per-input oracle',
        value: f2(typed.oracle),
        big: f2(typed.oracle),
        kicker: 'Per-input oracle · measured',
        explain: 'Each input gets the arm that scored best on it, which takes the outcomes themselves: the top of the ladder, not a router.',
      },
    ],
    split: 'leaf',
    between: { share: `about ${pct(typed.betweenTypesShare)}`, label: 'between types' },
    within: 'within types',
    chain: ['s1', 's2', 'x', 'max'],
    head: {
      big: `≈${pct(typed.betweenTypesShare)}`,
      kicker: 'Of the gap lies between types',
      text: `The best arm per capability leaf, chosen in hindsight, closes about ${pct(typed.betweenTypesShare)} of the gap between the fixed arm and the oracle; the rest lies within types.`,
    },
  },
  robot: {
    key: 'robot',
    label: 'RoboTwin',
    short: 'RoboTwin',
    axis: 'SUCCESS, %',
    ticks: [70, 75, 80, 85, 90],
    facts: `RoboTwin 2.0 · ${robot.inputs.toLocaleString('en-US')} test scenes`,
    rungs: [
      {
        key: 'fixed',
        kind: 'fixed',
        v: robot.fixed,
        term: 's1',
        sym: 'V^\\star(\\sigma_1)',
        state: 'The benchmark',
        what: `one fixed policy, ${FIXED_POLICY}`,
        short: `fixed · ${FIXED_POLICY}`,
        value: f2(robot.fixed),
        big: f2(robot.fixed),
        kicker: `Fixed policy · ${FIXED_POLICY} · measured`,
        explain: `${FIXED_POLICY} on every one of the ${robot.inputs.toLocaleString('en-US')} test scenes, the best single policy.`,
      },
      {
        key: 'router',
        kind: 'router',
        v: robot.router,
        term: 'x',
        sym: '\\le V^\\star(x)',
        state: 'The camera frames',
        what: 'learned outcome router: a lower bound',
        short: 'frames · learned router',
        value: f2(robot.router),
        big: f2(robot.router),
        kicker: 'Learned outcome router · measured',
        explain: 'A learned router that reads the camera frames and predicts each policy’s success: like any router that observes a state, it bounds that state’s rung from below.',
      },
      {
        key: 'cond',
        kind: 'hindsight',
        v: robot.conditionChoice,
        term: 's2',
        sym: 'V^\\star(\\sigma_2)',
        state: 'The scene condition',
        what: 'better policy for clean or randomized scenes',
        short: 'condition · better policy',
        value: robot.conditionChoice.toFixed(1),
        big: robot.conditionChoice.toFixed(1),
        kicker: 'Condition-level choice',
        explain: 'The better policy for each scene condition, clean or randomized: the coarse rung that the learned router recovers from pixels.',
      },
      {
        key: 'cell',
        kind: 'hindsight',
        v: ROBOT_CELL,
        term: 's3',
        sym: 'V^\\star(\\sigma_3)',
        state: 'Task and scene condition',
        what: 'best policy per task × condition, in hindsight',
        short: 'task × condition · hindsight',
        value: `${pct(robot.perTaskCondition.shareOfGap)} of the gap`,
        big: pct(robot.perTaskCondition.shareOfGap),
        kicker: 'Best policy per task and condition · in hindsight',
        explain: `The best policy for each task and scene condition, chosen on the test scenes, recovers ${pct(robot.perTaskCondition.shareOfGap)} of the ${ROBOT_GAP.toFixed(1)}-point gap.`,
      },
      band('The scene itself', 'No experiment measures $V^\\star(x)$, the best a router that reads each scene can do;'),
      {
        key: 'oracle',
        kind: 'oracle',
        v: robot.oracle,
        term: 'max',
        sym: ORACLE_SYM,
        state: 'The realized outcomes',
        what: 'per-scene oracle: best policy on each scene',
        short: 'per-scene oracle',
        value: f2(robot.oracle),
        big: f2(robot.oracle),
        kicker: 'Per-scene oracle · measured',
        explain: 'Each scene goes to a policy that succeeded on it, if any did, which takes the outcomes themselves: the top of the ladder, not a router.',
      },
    ],
    split: 'cell',
    between: { share: pct(robot.perTaskCondition.shareOfGap), label: 'task × condition' },
    within: 'scene by scene',
    chain: ['s1', 's2', 's3', 'x', 'max'],
    head: {
      big: pct(robot.perTaskCondition.shareOfGap),
      kicker: 'Of the gap, by task and condition',
      text: `The best policy per task and scene condition, chosen in hindsight, recovers ${pct(robot.perTaskCondition.shareOfGap)} of the ${ROBOT_GAP.toFixed(
        1
      )}-point gap; the rest is decided scene by scene.`,
    },
  },
};

const ORDER: PanelKey[] = ['all', 'typed', 'robot'];

const TERM_TEX: Record<Term, string> = {
  s1: 'V^\\star(\\sigma_1)',
  s2: 'V^\\star(\\sigma_2)',
  s3: 'V^\\star(\\sigma_3)',
  x: 'V^\\star(x)',
  max: '\\mathbb E[\\max_u W_u]',
};

const chainTex = (terms: Term[], hl: Term | null) => terms.map((t) => (t === hl ? `\\htmlClass{eq-hl}{${TERM_TEX[t]}}` : TERM_TEX[t])).join('\\;\\le\\;');

function Chain({ panel, hl, className = '' }: { panel: Panel; hl: Term | null; className?: string }) {
  // KaTeX may break the chain after a relation on the narrowest screens
  return (
    <div className={`max-w-full leading-[26px] text-ink-2 ${className}`}>
      <span dangerouslySetInnerHTML={{ __html: tex(chainTex(panel.chain, hl)) }} />
    </div>
  );
}

/** text with `$...$` TeX runs */
function Rich({ text }: { text: string }) {
  const parts = text.split('$');
  return (
    <>
      {parts.map((s, i) => (i % 2 ? <span key={i} dangerouslySetInnerHTML={{ __html: tex(s) }} /> : <span key={i}>{s}</span>))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* geometry                                                            */
/* ------------------------------------------------------------------ */

interface Geo {
  W: number;
  H: number;
  compact: boolean;
  L0: number;
  L1: number;
  LX: number;
  LW: number;
  yTop: number;
  yBot: number;
  yOracle: number;
  yFixed: number;
  bandH: number;
  pitch: number;
  /** highest a label's centre may sit (the chain of inequalities lives above it on wide screens) */
  labelLo: number;
}

function geometry(W: number): Geo {
  const compact = W < 640;
  if (compact) {
    const H = 440;
    // phones use the full width; anything wider keeps the labels next to their values, centred
    const tiny = W < 340;
    const lead = tiny ? 118 : 142;
    const LW = Math.min(W - lead, 290);
    const off = Math.max(0, Math.round((W - (lead + LW)) / 2));
    const L0 = (tiny ? 34 : 40) + off;
    const L1 = L0 + (tiny ? 66 : 80);
    const LX = L1 + (tiny ? 18 : 22);
    return { W, H, compact, L0, L1, LX, LW, yTop: 26, yBot: H - 14, yOracle: 66, yFixed: H - 52, bandH: 36, pitch: 36, labelLo: 26 };
  }
  const H = 476;
  const mid = W < 780;
  const AX = mid ? 80 : 96;
  const LAD = mid ? 140 : 176;
  const GAP = mid ? 44 : 50;
  const LW = Math.min(476, W - AX - LAD - GAP - 8);
  const off = Math.max(0, Math.round((W - (AX + LAD + GAP + LW)) / 2));
  const L0 = off + AX;
  const L1 = L0 + LAD;
  const LX = L1 + GAP;
  return { W, H, compact, L0, L1, LX, LW, yTop: 48, yBot: H - 16, yOracle: 96, yFixed: H - 64, bandH: 46, pitch: 42, labelLo: 60 };
}

/** keep labels `pitch` apart, each cluster centred on the rungs it labels */
function dodge(desired: number[], pitch: number, lo: number, hi: number) {
  type C = { top: number; n: number; sum: number };
  let cs: C[] = desired.map((d) => ({ top: d, n: 1, sum: d }));
  for (let guard = 0; guard < 50; guard++) {
    for (const c of cs) c.top = clamp(c.sum / c.n - ((c.n - 1) * pitch) / 2, lo, hi - (c.n - 1) * pitch);
    const i = cs.findIndex((c, k) => k < cs.length - 1 && c.top + c.n * pitch > cs[k + 1].top + 0.01);
    if (i < 0) break;
    const a = cs[i];
    const b = cs[i + 1];
    cs = [...cs.slice(0, i), { top: 0, n: a.n + b.n, sum: a.sum + b.sum }, ...cs.slice(i + 2)];
  }
  return cs.flatMap((c) => Array.from({ length: c.n }, (_, k) => c.top + k * pitch));
}

/** label positions (the centre of each label's first line): rungs plus the band, spread apart */
function placeLabels(p: Panel, y: (v: number) => number, g: Geo) {
  const top = p.rungs[p.rungs.length - 1];
  const want = p.rungs.map((r) => ({ key: r.key, want: r.kind === 'band' ? y(top.v) + g.bandH * 0.55 : y(r.v) })).sort((a, b) => a.want - b.want);
  const placed = dodge(
    want.map((w) => w.want),
    g.pitch,
    g.labelLo,
    g.yBot - (g.compact ? 20 : 24)
  );
  return new Map(want.map((w, i) => [w.key, placed[i]]));
}

/** true on devices with a hovering pointer (the hint says "hover", else "tap") */
function useCanHover() {
  const [h, setH] = useState(() => window.matchMedia('(hover: hover)').matches);
  useEffect(() => {
    const m = window.matchMedia('(hover: hover)');
    const on = () => setH(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return h;
}

function useWidth<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setW(Math.round(el.getBoundingClientRect().width));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ------------------------------------------------------------------ */
/* timeline                                                            */
/* ------------------------------------------------------------------ */

const CLIMB = 0.62;
const STEP = 0.38;

interface Timing {
  start: number[];
  land: number[];
  end: number;
}

function timing(panel: Panel, first: boolean): Timing {
  const c1 = first ? 0.95 : 0.32;
  const rungs = panel.rungs.filter((r) => r.kind !== 'band');
  const start: number[] = [];
  const land: number[] = [];
  rungs.forEach((_, i) => {
    if (i === 0) {
      start.push(first ? 0.45 : 0);
      land.push(first ? 0.85 : 0.3);
    } else {
      const s = c1 + (i - 1) * STEP;
      start.push(s);
      land.push(s + CLIMB);
    }
  });
  return { start, land, end: land[land.length - 1] + 0.9 };
}

/* ------------------------------------------------------------------ */
/* the figure                                                          */
/* ------------------------------------------------------------------ */

export function HeadroomLadder() {
  const tk = useTokens();
  const uid = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, '-60px', true);
  const W = useWidth(boxRef);

  const [key, setKey] = useState<PanelKey>('all');
  const [prev, setPrev] = useState<PanelKey | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const lastPointer = useRef<string>('mouse');
  // a tap focuses the row before its click lands, so the click reads the hover from before the tap
  const hoverAtDown = useRef<string | null>(null);
  const hoverNow = useRef<string | null>(null);
  useEffect(() => {
    hoverNow.current = hover;
  }, [hover]);

  const panel = PANELS[key];
  const tm = timing(panel, prev === null);
  const [settled, setSettled] = useState(false);
  const [t, resetClock] = useClock(inView && !reduced && !settled);
  useEffect(() => {
    if (t >= tm.end) setSettled(true);
  }, [t, tm.end]);
  const tt = reduced || settled ? 99 : t;

  const choose = (k: PanelKey) => {
    if (k === key) return;
    setHover(null);
    setPrev(key);
    setKey(k);
    resetClock(0);
    setSettled(false);
  };

  const g = geometry(Math.max(W, 240));
  const { L0, L1, LX, LW, yTop, yBot, yOracle, yFixed, bandH, compact } = g;
  const Y = (p: Panel) => {
    const lo = p.rungs[0].v;
    const hi = p.rungs[p.rungs.length - 1].v;
    return (v: number) => yFixed + ((v - lo) / (hi - lo)) * (yOracle - yFixed);
  };
  const y = Y(panel);

  // rungs climb one after another, each starting from the one below it
  const climbers = panel.rungs.filter((r) => r.kind !== 'band');
  const cy: number[] = [];
  const shown: number[] = [];
  climbers.forEach((r, i) => {
    const target = y(r.v);
    if (i === 0) {
      cy.push(target);
      shown.push(prev === null ? seg(tt, tm.start[0], 0.4) : 1);
      return;
    }
    const k = seg(tt, tm.start[i], CLIMB);
    cy.push(lerp(cy[i - 1], target, k));
    shown.push(tt >= tm.start[i] ? Math.min(1, (tt - tm.start[i]) / 0.12) : 0);
  });
  // hover bands: ±9px around each rung, split halfway where two rungs nearly touch
  const hit = cy.map((yy, i) => {
    let lo = yy - 9;
    let hi = yy + 9;
    cy.forEach((o, j) => {
      if (j === i || Math.abs(o - yy) >= 18) return;
      const m = (o + yy) / 2;
      if (o < yy || (o === yy && j < i)) lo = Math.max(lo, m);
      else hi = Math.min(hi, m);
    });
    return [lo, hi] as const;
  });
  const posOf = (k: string) => cy[climbers.findIndex((r) => r.key === k)];
  const landedOf = (k: string) => tm.land[climbers.findIndex((r) => r.key === k)];
  const oracleLand = tm.land[tm.land.length - 1];
  const bandIn = seg(tt, oracleLand - 0.05, 0.6);

  const railIn = prev === null ? seg(tt, 0, 0.75) : 1;
  const axisIn = prev === null ? seg(tt, 0.15, 0.6) : 1;
  const oldOut = prev !== null ? 1 - seg(tt, 0, 0.26) : 0;

  const ySplit = posOf(panel.split);
  const yTopRung = cy[cy.length - 1];

  const labelY = placeLabels(panel, y, g);
  const labelIn = (r: Rung) => (r.kind === 'band' ? bandIn : seg(tt, landedOf(r.key) - 0.12, 0.32));

  const hov = hover ? panel.rungs.find((r) => r.key === hover) : undefined;
  const dimOf = (k: string) => (hov && hov.key !== k ? 0.3 : 1);

  const pointerProps = (k: string) => ({
    onPointerDown: (ev: RPointerEvent) => {
      lastPointer.current = ev.pointerType;
      hoverAtDown.current = hoverNow.current;
    },
    onPointerEnter: (ev: RPointerEvent) => {
      if (ev.pointerType === 'mouse') setHover(k);
    },
    onPointerLeave: (ev: RPointerEvent) => {
      if (ev.pointerType === 'mouse') setHover((h) => (h === k ? null : h));
    },
    onClick: () => {
      if (lastPointer.current !== 'mouse') setHover(hoverAtDown.current === k ? null : k);
    },
    onFocus: () => setHover(k),
    onBlur: () => setHover((h) => (h === k ? null : h)),
  });

  const midX = (L0 + L1) / 2;
  const prevPanel = prev ? PANELS[prev] : null;
  const yPrev = prevPanel ? Y(prevPanel) : null;

  const canHover = useCanHover();
  const readout = hov ?? null;
  // the panel's headline waits until the whole ladder has landed
  const headIn = readout ? 1 : seg(tt, oracleLand - 0.1, 0.45);

  return (
    <div ref={rootRef}>
      <div className="mb-4 flex flex-col gap-y-3">
        <RubberSegment
          items={ORDER.map((k) => ({
            value: k,
            label: (
              <>
                <span className="md:hidden">{PANELS[k].short}</span>
                <span className="hidden md:inline">{PANELS[k].label}</span>
              </>
            ),
          }))}
          value={key}
          onChange={(v) => choose(v as PanelKey)}
          trackColor={tk.surface2}
          thumbColor={tk.ink}
          textColor={tk.ink2}
          activeTextColor={tk.bg}
          size="sm"
          className="self-start font-sans"
          aria-label="Ladder panel"
        />
        {compact && W > 0 && <Chain panel={panel} hl={hov ? hov.term : null} className="text-[12px]" />}
      </div>

      <div ref={boxRef} className="relative" style={{ height: g.H }}>
        {W > 0 && (
          <>
            {!compact && (
              <div className="absolute" style={{ left: LX, top: 0, height: 30 }}>
                <Chain panel={panel} hl={hov ? hov.term : null} className="whitespace-nowrap text-[15px] leading-[30px]" />
              </div>
            )}
            <svg viewBox={`0 0 ${g.W} ${g.H}`} width={g.W} height={g.H} className="absolute inset-0 block h-full w-full select-none overflow-visible" role="group" aria-label={ariaPanel(panel)}>
              <defs>
                <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--ink)" stopOpacity={0.2} />
                  <stop offset="1" stopColor="var(--ink)" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* score axis on the left rail */}
              <g opacity={axisIn}>
                <text x={compact ? L0 - (W < 340 ? 34 : 40) : L0 - 12} y={yTop - 14} textAnchor={compact ? 'start' : 'end'} fontSize={compact ? 9 : 9.5} letterSpacing={1.4} fill="var(--ink-4)" style={mono}>
                  {panel.axis}
                </text>
                {prevPanel && yPrev && oldOut > 0.01 && (
                  <g opacity={oldOut}>
                    {prevPanel.ticks.map((v) => (
                      <Tick key={`o${v}`} v={v} y={yPrev(v)} L0={L0} compact={compact} yTop={yTop} yBot={yBot} />
                    ))}
                  </g>
                )}
                <g opacity={prev ? seg(tt, 0.12, 0.36) : 1}>
                  {panel.ticks.map((v) => (
                    <Tick key={`n${v}`} v={v} y={y(v)} L0={L0} compact={compact} yTop={yTop} yBot={yBot} />
                  ))}
                </g>
              </g>

              {/* headroom: between states (what coarser lookups reach) and within them */}
              <g>
                <rect
                  x={L0 + 1.5}
                  width={L1 - L0 - 3}
                  y={Math.min(yTopRung, ySplit)}
                  height={Math.max(0, ySplit - yTopRung)}
                  fill="color-mix(in oklab, var(--ink-4) 12%, transparent)"
                  opacity={shown[shown.length - 1]}
                />
                <rect x={L0 + 1.5} width={L1 - L0 - 3} y={ySplit} height={Math.max(0, yFixed - ySplit)} fill="var(--blue-wash)" opacity={shown[climbers.findIndex((r) => r.key === panel.split)]} />
                {/* V*(x): somewhere below the oracle, not measured */}
                <rect x={L0 + 1.5} width={L1 - L0 - 3} y={yTopRung} height={bandH} fill={`url(#${uid}-band)`} opacity={bandIn * dimOf('band')} style={{ transition: 'opacity .25s' }} />
              </g>

              {/* the ladder's own rungs sit at the axis ticks */}
              <g stroke="var(--line)" strokeWidth={1.25} strokeLinecap="round">
                {prevPanel && yPrev && oldOut > 0.01 && (
                  <g opacity={oldOut * 0.7}>
                    {prevPanel.ticks.map((v) => (
                      <StepRung key={`os${v}`} y={yPrev(v)} L0={L0} L1={L1} yTop={yTop} yBot={yBot} near={prevPanel.rungs.filter((r) => r.kind !== 'band').map((r) => yPrev(r.v))} />
                    ))}
                  </g>
                )}
                <g opacity={(prev ? seg(tt, 0.12, 0.36) : railIn) * 0.7}>
                  {panel.ticks.map((v) => (
                    <StepRung key={`ns${v}`} y={y(v)} L0={L0} L1={L1} yTop={yTop} yBot={yBot} near={climbers.map((r) => y(r.v))} />
                  ))}
                </g>
              </g>

              {/* rails */}
              <g stroke="var(--line)" strokeWidth={2.5} strokeLinecap="round">
                <line x1={L0} x2={L0} y1={yBot} y2={lerp(yBot, yTop, railIn)} />
                <line x1={L1} x2={L1} y1={yBot} y2={lerp(yBot, yTop, railIn)} />
              </g>

              {/* region names, inside the ladder */}
              <RegionLabels panel={panel} g={g} ySplit={ySplit} yTopRung={yTopRung} yFixed={yFixed} posOf={posOf} midX={midX} steps={panel.ticks.map(y)} op={bandIn * (hov ? 0.35 : 1)} />

              {/* the previous panel's rungs fade where they stood */}
              {prevPanel && yPrev && oldOut > 0.01 && (
                <g opacity={oldOut}>
                  {prevPanel.rungs
                    .filter((r) => r.kind !== 'band' && r.kind !== 'fixed')
                    .map((r) => (
                      <RungLine key={`old-${r.key}`} r={r} y={yPrev(r.v)} L0={L0} L1={L1} />
                    ))}
                </g>
              )}

              {/* rungs */}
              {climbers.map((r, i) => {
                const yy = cy[i];
                const op = shown[i] * dimOf(r.key);
                const ly = labelY.get(r.key)!;
                const lin = labelIn(r);
                return (
                  <g key={`${key}-${r.key}`} style={{ outline: 'none' }} tabIndex={0} role="img" aria-label={`${r.state}: ${r.value || 'not measured'}. ${r.what.replace(/\$/g, '')}`} {...pointerProps(r.key)}>
                    <rect x={L0 - 8} y={hit[i][0]} width={L1 - L0 + 16} height={Math.max(2, hit[i][1] - hit[i][0])} fill="transparent" />
                    <g opacity={op} style={{ transition: 'opacity .25s' }}>
                      <RungLine r={r} y={yy} L0={L0} L1={L1} on={hov?.key === r.key} />
                      {r.kind === 'fixed' && <circle cx={L1} cy={yy} r={5} fill="var(--surface)" stroke="var(--slate)" strokeWidth={2} />}
                      {r.kind === 'oracle' && <circle cx={L1} cy={yy} r={5.6} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} />}
                    </g>
                    <Leader x0={L1 + (r.kind === 'fixed' || r.kind === 'oracle' ? 8 : 4)} y0={yy} x1={LX - 6} y1={ly} op={lin * dimOf(r.key)} />
                  </g>
                );
              })}
              {/* band leader */}
              <Leader x0={L1 + 4} y0={yTopRung + bandH * 0.55} x1={LX - 6} y1={labelY.get('band')!} op={bandIn * dimOf('band')} dotted />
              <rect
                x={L0}
                y={yTopRung + 3}
                width={L1 - L0}
                height={bandH - 6}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label="V star of x: not measured; below the oracle by outcome noise"
                style={{ outline: 'none' }}
                {...pointerProps('band')}
              />
            </svg>

            {/* the previous panel's labels fade where they stood */}
            {prevPanel &&
              yPrev &&
              oldOut > 0.01 &&
              (() => {
                const ly0 = placeLabels(prevPanel, yPrev, g);
                return prevPanel.rungs.map((r) => (
                  <div
                    key={`old-label-${prev}-${r.key}`}
                    className="pointer-events-none absolute flex"
                    style={{ left: LX, top: ly0.get(r.key)! - (compact ? 9 : 10), width: LW, height: compact ? 32 : 36, opacity: oldOut }}
                    aria-hidden
                  >
                    <RungLabel r={r} compact={compact} on={false} />
                  </div>
                ));
              })()}

            {/* rung labels */}
            {panel.rungs.map((r) => {
              const ly = labelY.get(r.key)!;
              const op = labelIn(r) * dimOf(r.key);
              return (
                <div
                  key={`${key}-label-${r.key}`}
                  className="absolute flex"
                  style={{ left: LX, top: ly - (compact ? 9 : 10), width: LW, height: compact ? 32 : 36, opacity: op, transition: 'opacity .25s' }}
                  {...pointerProps(r.key)}
                >
                  <RungLabel r={r} compact={compact} on={hov?.key === r.key} />
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* read-out */}
      <div className="mt-3 border-t border-rule pt-4">
        <div className="flex min-h-[150px] items-start sm:min-h-[96px]" style={{ opacity: headIn }}>
          <motion.div
              key={`${key}-${readout?.key ?? 'head'}`}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-w-0 flex-1 items-start gap-4 sm:gap-6"
            >
              <div className="w-[92px] shrink-0 text-right font-display text-[38px] font-semibold leading-[0.95] text-ink sm:w-[112px] sm:text-[44px]">
                {readout?.bigTex ? <span className="text-[26px] sm:text-[30px]" dangerouslySetInnerHTML={{ __html: tex(readout.big) }} /> : readout ? readout.big : panel.head.big}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 sm:text-[10.5px]">{readout ? readout.kicker : panel.head.kicker}</div>
                <p className="mt-1 font-serif text-[14px] leading-[1.5] text-ink-2 sm:text-[14.5px]">
                  <Rich text={readout ? readout.explain : panel.head.text} />
                </p>
              </div>
            </motion.div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-[12px] text-ink-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-4">{panel.facts}</span>
          <span className="flex items-center gap-1.5">
            <LineKey kind="fixed" /> measured
          </span>
          <span className="flex items-center gap-1.5">
            <LineKey kind="hindsight" /> chosen in hindsight, optimistic
          </span>
          {key === 'robot' && (
            <span className="flex items-center gap-1.5">
              <LineKey kind="router" /> learned router, a lower bound
            </span>
          )}
          <span className="hidden sm:inline">· {canHover ? 'hover' : 'tap'} a rung</span>
        </div>
      </div>

      <SrTable />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* parts                                                               */
/* ------------------------------------------------------------------ */

const RUNG_STYLE: Record<Exclude<RungKind, 'band'>, { color: string; width: number; dash?: string }> = {
  fixed: { color: 'var(--slate)', width: 3 },
  hindsight: { color: 'var(--ink-2)', width: 2, dash: '6 5' },
  router: { color: 'var(--blue)', width: 3 },
  oracle: { color: 'var(--ink)', width: 3 },
};

function RungLine({ r, y, L0, L1, on = false }: { r: Rung; y: number; L0: number; L1: number; on?: boolean }) {
  if (r.kind === 'band') return null;
  const s = RUNG_STYLE[r.kind];
  return (
    <line
      x1={L0 + 3}
      x2={L1 - 3}
      y1={y}
      y2={y}
      stroke={s.color}
      strokeWidth={s.width + (on ? 1 : 0)}
      strokeDasharray={s.dash}
      strokeLinecap={s.dash ? 'butt' : 'round'}
    />
  );
}

function StepRung({ y, L0, L1, yTop, yBot, near }: { y: number; L0: number; L1: number; yTop: number; yBot: number; near: number[] }) {
  if (y < yTop + 2 || y > yBot - 2 || near.some((n) => Math.abs(n - y) < 7)) return null;
  return <line x1={L0 + 2} x2={L1 - 2} y1={y} y2={y} />;
}

function Tick({ v, y, L0, compact, yTop, yBot }: { v: number; y: number; L0: number; compact: boolean; yTop: number; yBot: number }) {
  if (y < yTop - 1 || y > yBot + 1) return null;
  return (
    <g>
      <line x1={L0 - 7} x2={L0 - 2} y1={y} y2={y} stroke="var(--ink-4)" />
      <text x={L0 - 12} y={y + 3.6} textAnchor="end" fontSize={compact ? 10 : 10.5} fill="var(--ink-3)" style={mono}>
        {v}
      </text>
    </g>
  );
}

function Leader({ x0, y0, x1, y1, op, dotted = false }: { x0: number; y0: number; x1: number; y1: number; op: number; dotted?: boolean }) {
  if (op <= 0.01) return null;
  const k = 12;
  const elbow = x1 - x0 > 36;
  return (
    <path
      d={elbow ? `M${x0},${y0} H${x0 + k} L${x1 - 10},${y1} H${x1}` : `M${x0},${y0} L${x1},${y1}`}
      fill="none"
      stroke="var(--ink-4)"
      strokeWidth={1}
      strokeDasharray={dotted ? '1.5 3' : undefined}
      opacity={op}
      style={{ transition: 'opacity .25s' }}
    />
  );
}

function RegionLabels({
  panel,
  g,
  ySplit,
  yTopRung,
  yFixed,
  posOf,
  midX,
  steps,
  op,
}: {
  panel: Panel;
  g: Geo;
  ySplit: number;
  yTopRung: number;
  yFixed: number;
  posOf: (k: string) => number;
  midX: number;
  steps: number[];
  op: number;
}) {
  if (op <= 0.01) return null;
  // within: the open space between the split rung and the band, centred between two step rungs
  const wTop = yTopRung + g.bandH;
  const centre = (wTop + ySplit) / 2;
  const lines = [wTop, ...steps.filter((v) => v > wTop && v < ySplit), ySplit].sort((a, b) => a - b);
  let wMid = centre;
  let best = Infinity;
  for (let i = 0; i < lines.length - 1; i++) {
    const m = (lines[i] + lines[i + 1]) / 2;
    if (lines[i + 1] - lines[i] >= 24 && Math.abs(m - centre) < best) {
      best = Math.abs(m - centre);
      wMid = m;
    }
  }
  // between: the largest free gap among the rungs below the split
  let between: { y: number; room: number } | null = null;
  if (panel.between) {
    const ys = panel.rungs
      .filter((r) => r.kind !== 'band' && r.kind !== 'oracle')
      .map((r) => posOf(r.key))
      .filter((v) => v <= yFixed + 0.5 && v >= ySplit - 0.5)
      .sort((a, b) => a - b);
    for (let i = 0; i < ys.length - 1; i++) {
      const room = ys[i + 1] - ys[i];
      if (!between || room > between.room) between = { y: (ys[i] + ys[i + 1]) / 2, room };
    }
  }
  const small = g.compact;
  const roomy = between && between.room >= (small ? 24 : 36);
  const tight = between && !roomy && between.room >= 13;
  const display = { fontFamily: 'var(--font-display)' };
  return (
    <g opacity={op} style={{ pointerEvents: 'none' }}>
      {ySplit - wTop > 40 && (
        <text x={midX} y={wMid + 3.5} textAnchor="middle" fontSize={small ? 8.5 : 9.5} letterSpacing={small ? 1 : 1.4} fill="var(--ink-3)" style={mono}>
          {(small ? 'within' : panel.within).toUpperCase()}
        </text>
      )}
      {panel.between && between && roomy && (
        <g>
          <text x={midX} y={between.y + (small ? 5 : 0)} textAnchor="middle" fontSize={small ? 15 : 19} fontWeight={600} fill="var(--ink)" style={display}>
            {small ? panel.between.share.replace('about ', '≈') : panel.between.share}
          </text>
          {!small && (
            <text x={midX} y={between.y + 14} textAnchor="middle" fontSize={9.5} letterSpacing={1.4} fill="var(--ink-3)" style={mono}>
              {panel.between.label.toUpperCase()}
            </text>
          )}
        </g>
      )}
      {panel.between && between && tight && (
        <text x={midX} y={between.y + 4.5} textAnchor="middle" fill="var(--ink-3)">
          <tspan fontSize={small ? 13 : 15} fontWeight={600} fill="var(--ink)" style={display}>
            {small ? panel.between.share.replace('about ', '≈') : panel.between.share}
          </tspan>
          {!small && (
            <tspan dx={7} fontSize={9} letterSpacing={1.2} style={mono}>
              {panel.between.label.toUpperCase()}
            </tspan>
          )}
        </text>
      )}
    </g>
  );
}

function RungLabel({ r, compact, on }: { r: Rung; compact: boolean; on: boolean }) {
  const sym = r.sym ? <span dangerouslySetInnerHTML={{ __html: tex(r.sym) }} /> : null;
  const value = <span className={`num shrink-0 ${compact ? 'text-[11.5px]' : 'text-[13px]'} ${r.kind === 'band' ? 'text-ink-4' : 'text-ink'} ${on ? 'font-semibold' : ''}`}>{r.value || '—'}</span>;
  if (compact) {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex h-[18px] items-center justify-between gap-2">
          <span className="text-[13px] text-ink">{sym ?? <span className="font-sans text-[11.5px] font-semibold">{r.state}</span>}</span>
          {value}
        </div>
        <div className="truncate font-sans text-[10.5px] leading-[14px] text-ink-3">{r.short}</div>
      </div>
    );
  }
  // line 1 (symbol, what the router observes, value) faces the leader; line 2 says what the rung is
  return (
    <div className="grid w-full grid-cols-[80px_minmax(0,1fr)_auto] gap-x-3">
      <span className="flex h-[20px] items-center text-[15px] text-ink">{sym}</span>
      <span className="min-w-0">
        <span className="flex h-[20px] items-center truncate font-sans text-[13.5px] font-semibold text-ink">{r.state}</span>
        <span className="block truncate font-sans text-[12px] leading-[16px] text-ink-3">
          <Rich text={r.what} />
        </span>
      </span>
      <span className="flex h-[20px] items-center justify-end">{value}</span>
    </div>
  );
}

function LineKey({ kind }: { kind: 'fixed' | 'hindsight' | 'router' }) {
  const s = RUNG_STYLE[kind];
  return (
    <svg width="22" height="8" viewBox="0 0 22 8" aria-hidden className="shrink-0">
      <line
        x1={2}
        x2={20}
        y1={4}
        y2={4}
        stroke={kind === 'fixed' ? 'var(--ink)' : s.color}
        strokeWidth={s.width === 3 ? 2.6 : 2}
        strokeDasharray={s.dash ? '4 3' : undefined}
        strokeLinecap={s.dash ? 'butt' : 'round'}
      />
    </svg>
  );
}

function ariaPanel(p: Panel) {
  const parts = p.rungs.filter((r) => r.kind !== 'band').map((r) => `${r.state}: ${r.value}`);
  return `Headroom ladder, ${p.label}. ${parts.join('; ')}. V star of x is not measured.`;
}

function SrTable() {
  return (
    <table className="sr-only">
      <caption>Rungs of the headroom ladder, each panel on its own test inputs</caption>
      <thead>
        <tr>
          <th scope="col">Panel</th>
          <th scope="col">What the router observes</th>
          <th scope="col">Rung</th>
          <th scope="col">Score</th>
        </tr>
      </thead>
      <tbody>
        {ORDER.flatMap((k) =>
          PANELS[k].rungs.map((r) => (
            <tr key={`${k}-${r.key}`}>
              <th scope="row">{PANELS[k].label}</th>
              <td>{r.state}</td>
              <td>{r.what.replace(/\$/g, '')}</td>
              <td>{r.value || 'not measured'}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
