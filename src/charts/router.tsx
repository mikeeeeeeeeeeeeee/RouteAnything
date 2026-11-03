import { GROUPS, POOLS, type GroupKey, type PoolKey } from '@/data/results';
import { ChartBox, useHover, type TipData } from './base';
import { InputIcon, PoolIcon, type InputKind, type Pool } from './icons';

// The setting (the paper's Figure 1a): five kinds of input reach one router, which plays a candidate from one of
// five pools. Hovering an input lights the pools it can reach; hovering a pool lists its candidates. A row on wide
// screens, a column on a phone.

const INPUTS: { kind: InputKind; label: string; lines: string[]; groups: GroupKey[] }[] = [
  { kind: 'question', label: 'Question', lines: ['Question'], groups: ['text'] },
  { kind: 'image-question', label: 'Image + question', lines: ['Image +', 'question'], groups: ['imgqa'] },
  { kind: 'task-files', label: 'Task + files', lines: ['Task +', 'files'], groups: ['agents'] },
  { kind: 'prompt', label: 'Generation prompt', lines: ['Prompt'], groups: ['imggen', 'video', 'speech'] },
  { kind: 'cameras', label: 'Cameras + state', lines: ['Cameras', '+ state'], groups: ['robot'] },
];

const POOL_ICON: Record<PoolKey, Pool> = { lm: 'language', image: 'image', video: 'video', speech: 'speech', robot: 'robot' };
const poolsOf = (i: number) => new Set(INPUTS[i].groups.map((g) => GROUPS.find((x) => x.key === g)!.pool));
const inputsOf = (p: PoolKey) => new Set(INPUTS.flatMap((inp, i) => (inp.groups.some((g) => GROUPS.find((x) => x.key === g)!.pool === p) ? [i] : [])));

function inputTip(i: number, x: number, y: number): TipData {
  const inp = INPUTS[i];
  const groups = inp.groups.map((g) => GROUPS.find((x) => x.key === g)!);
  return {
    x,
    y,
    title: inp.label,
    rows: groups.map((g) => ({ mark: 'bar' as const, color: 'var(--c-b)', label: g.label, value: `${g.benchmarks.length}` })),
    note: `Benchmarks: ${groups.flatMap((g) => g.benchmarks).join(', ')}.`,
  };
}
function poolTip(j: number, x: number, y: number): TipData {
  const p = POOLS[j];
  return {
    x,
    y,
    title: p.label,
    rows: [{ mark: 'dot', color: 'var(--c-a)', label: 'candidates', value: p.size }],
    note: `${p.candidates.join(', ')}${p.note ? `; ${p.note}` : ''}.`,
  };
}

/** the router's rule, set in the page's text face with italic variables */
function Rule({ x, y, size = 13 }: { x: number; y: number; size?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill="#fff" style={{ font: `400 ${size}px/1 var(--text)`, opacity: 0.88 }}>
      arg max <tspan fontStyle="italic">v</tspan> − <tspan fontStyle="italic">λc</tspan>
    </text>
  );
}

export function RouterDiagram() {
  const { hot, tip, bind } = useHover();
  // rows 0–4 are inputs, 5–9 pools
  const litIn = hot === null ? null : hot < 5 ? new Set([hot]) : inputsOf(POOLS[hot - 5].key);
  const litPool = hot === null ? null : hot < 5 ? poolsOf(hot) : new Set([POOLS[hot - 5].key]);
  const on = (lit: Set<unknown> | null, k: unknown) => (lit?.has(k) ? ' on' : '');

  return (
    <ChartBox
      label="Five kinds of input (a question, an image with a question, a task with files, a generation prompt, camera frames with a robot state) reach one router, which plays a candidate from one of five pools: 3–4 language models, 6 image, 3 video and 3 speech generators, and 7 robot policies."
      height={(W) => (W >= 640 ? 300 : 318)}
      hot={hot}
      tip={tip}
      minWidth={280}
      draw={(W) => (W >= 640 ? row(W) : column(W))}
    />
  );

  // plain functions, not components: a component defined here would remount on every hover
  function row(W: number) {
    const pitch = 58;
    const ch = 46;
    const top = 8;
    const cy = (i: number) => top + i * pitch + ch / 2;
    const inW = Math.min(214, W * 0.235);
    const poolW = Math.min(244, W * 0.265);
    const rw = Math.min(196, W * 0.2);
    const rh = 128;
    const mid = top + (4 * pitch + ch) / 2;
    const rx0 = W / 2 - rw / 2;
    const rx1 = W / 2 + rw / 2;
    const px0 = W - poolW;
    const port = (i: number) => mid + (i - 2) * 15;
    const curve = (x0: number, y0: number, x1: number, y1: number) => {
      const d = (x1 - x0) * 0.5;
      return `M${x0},${y0}C${x0 + d},${y0} ${x1 - d},${y1} ${x1},${y1}`;
    };
    return (
      <>
        {INPUTS.map((inp, i) => (
          <g key={inp.kind} className={`row${on(litIn, i)}`}>
            <path d={curve(inW, cy(i), rx0, port(i))} fill="none" stroke={litIn?.has(i) ? 'var(--blue)' : 'var(--c-line)'} strokeWidth={litIn?.has(i) ? 1.75 : 1.25} />
            <rect x={0} y={cy(i) - ch / 2} width={inW} height={ch} rx={13} fill="var(--band)" />
            <InputIcon kind={inp.kind} x={24} y={cy(i)} color="var(--ink2)" bg="var(--band)" />
            <text className="lbl" x={46} y={cy(i) + 5}>
              {inp.label}
            </text>
            <rect className="hit" x={0} y={cy(i) - pitch / 2} width={inW + 12} height={pitch} {...bind(i, () => inputTip(i, inW, cy(i)))} />
          </g>
        ))}
        {POOLS.map((p, j) => (
          <g key={p.key} className={`row${on(litPool, p.key)}`}>
            <path d={curve(rx1, port(j), px0, cy(j))} fill="none" stroke={litPool?.has(p.key) ? 'var(--blue)' : 'var(--c-line)'} strokeWidth={litPool?.has(p.key) ? 1.75 : 1.25} />
            <rect x={px0} y={cy(j) - ch / 2} width={poolW} height={ch} rx={13} fill="var(--band)" />
            <PoolIcon pool={POOL_ICON[p.key]} x={px0 + 24} y={cy(j)} color="var(--ink2)" />
            <text className="lbl" x={px0 + 46} y={cy(j) + 5}>
              {p.label}
            </text>
            <text className="mono" x={W - 16} y={cy(j) + 4.5} textAnchor="end">
              {p.size}
            </text>
            <rect className="hit" x={px0 - 12} y={cy(j) - pitch / 2} width={poolW + 12} height={pitch} {...bind(5 + j, () => poolTip(j, px0, cy(j)))} />
          </g>
        ))}
        <rect x={rx0} y={mid - rh / 2} width={rw} height={rh} rx={24} fill="var(--blue)" />
        <text x={W / 2} y={mid - 4} textAnchor="middle" fill="#fff" style={{ font: '600 21px/1 var(--display)', letterSpacing: '-0.01em' }}>
          Router
        </text>
        <Rule x={W / 2} y={mid + 20} />
      </>
    );
  }

  function column(W: number) {
    const n = 5;
    const colW = W / n;
    const cx = (i: number) => colW * i + colW / 2;
    const box = 42;
    const inY = 4;
    const inLabel = inY + box + 16;
    const rTop = 122;
    const rh = 66;
    const rw = Math.min(236, W - 40);
    const poolY = rTop + rh + 52;
    const curve = (x0: number, y0: number, x1: number, y1: number) => {
      const d = (y1 - y0) * 0.55;
      return `M${x0},${y0}C${x0},${y0 + d} ${x1},${y1 - d} ${x1},${y1}`;
    };
    const port = (i: number) => W / 2 + (i - 2) * 18;
    return (
      <>
        {INPUTS.map((inp, i) => (
          <g key={inp.kind} className={`row${on(litIn, i)}`}>
            <path d={curve(cx(i), inLabel + 6 + (inp.lines.length - 1) * 13 + 4, port(i), rTop)} fill="none" stroke={litIn?.has(i) ? 'var(--blue)' : 'var(--c-line)'} strokeWidth={litIn?.has(i) ? 1.75 : 1.25} />
            <rect x={cx(i) - box / 2} y={inY} width={box} height={box} rx={12} fill="var(--band)" />
            <InputIcon kind={inp.kind} x={cx(i)} y={inY + box / 2} color="var(--ink2)" bg="var(--band)" />
            {inp.lines.map((l, k) => (
              <text key={l} className="sub" x={cx(i)} y={inLabel + k * 13} textAnchor="middle" style={{ fill: 'var(--ink2)' }}>
                {l}
              </text>
            ))}
            <rect className="hit" x={cx(i) - colW / 2} y={0} width={colW} height={rTop - 6} {...bind(i, () => inputTip(i, cx(i), inY + box))} />
          </g>
        ))}
        {POOLS.map((p, j) => (
          <g key={p.key} className={`row${on(litPool, p.key)}`}>
            <path d={curve(port(j), rTop + rh, cx(j), poolY)} fill="none" stroke={litPool?.has(p.key) ? 'var(--blue)' : 'var(--c-line)'} strokeWidth={litPool?.has(p.key) ? 1.75 : 1.25} />
            <rect x={cx(j) - box / 2} y={poolY} width={box} height={box} rx={12} fill="var(--band)" />
            <PoolIcon pool={POOL_ICON[p.key]} x={cx(j)} y={poolY + box / 2} color="var(--ink2)" />
            <text className="sub" x={cx(j)} y={poolY + box + 16} textAnchor="middle" style={{ fill: 'var(--ink2)' }}>
              {p.short}
            </text>
            <text className="mono" x={cx(j)} y={poolY + box + 31} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--ink3)' }}>
              {p.size}
            </text>
            <rect className="hit" x={cx(j) - colW / 2} y={rTop + rh + 6} width={colW} height={poolY + box + 40 - (rTop + rh + 6)} {...bind(5 + j, () => poolTip(j, cx(j), poolY))} />
          </g>
        ))}
        <rect x={W / 2 - rw / 2} y={rTop} width={rw} height={rh} rx={20} fill="var(--blue)" />
        <text x={W / 2} y={rTop + 29} textAnchor="middle" fill="#fff" style={{ font: '600 19px/1 var(--display)', letterSpacing: '-0.01em' }}>
          Router
        </text>
        <Rule x={W / 2} y={rTop + 50} size={12.5} />
      </>
    );
  }
}
