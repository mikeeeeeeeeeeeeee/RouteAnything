import { useEffect, useState, type ReactNode } from 'react';
import MagicBento, { type MagicBentoItem } from '@/components/reactbits/MagicBento/MagicBento';
import LogoLoop from '@/components/reactbits/LogoLoop/LogoLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';
import { scrollToId } from '@/lib/scrollspy';
import { MATRIX, POOLS, SETUP } from '@/data/results';

// Part II opener: an index of the seven findings (each card jumps to its section) and the evidence.

function Card({ n, where, title, figure, unit, note, art }: { n: string; where: string; title: string; figure: ReactNode; unit?: string; note: string; art?: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="smallcaps text-[10px] font-semibold text-accent">Finding {n}</span>
        <span className="smallcaps text-[9.5px] text-ink-4">{where} →</span>
      </div>
      <h3 className="mt-2 font-display text-[21px] font-semibold leading-[1.12] text-ink">{title}</h3>
      <div className="mt-auto flex items-end justify-between gap-4 pt-3">
        <div>
          <div className="font-display text-[38px] font-semibold leading-none text-ink">
            {figure}
            {unit && <span className="ml-1 text-[20px] text-ink-3">{unit}</span>}
          </div>
          <p className="mt-1.5 max-w-[300px] font-sans text-[12px] leading-snug text-ink-3">{note}</p>
        </div>
        {art}
      </div>
    </div>
  );
}

function MiniRuler() {
  // CodeRouterBench, in units of eta_B: lambda^B = 2.9, lambda_eps = 4.16, eta* = 29.4, on a log axis 1..40
  const x = (v: number) => 4 + (Math.log10(v) / Math.log10(40)) * 172;
  return (
    <svg viewBox="0 0 180 54" className="h-[54px] w-[180px] shrink-0" aria-hidden>
      <rect x={x(1)} y={14} width={x(2.9) - x(1)} height={20} rx={4} fill="var(--amber-wash)" />
      <line x1={4} y1={24} x2={176} y2={24} stroke="var(--ink-4)" />
      <line x1={x(2.9)} y1={10} x2={x(2.9)} y2={38} stroke="var(--amber)" strokeWidth={2.5} strokeLinecap="round" />
      <rect x={x(4.16) - 5} y={19} width={10} height={10} transform={`rotate(45 ${x(4.16)} 24)`} fill="var(--blue)" />
      <circle cx={x(29.4)} cy={24} r={5} fill="var(--surface)" stroke="var(--ink-2)" strokeWidth={1.5} />
      <text x={x(2.9)} y={50} textAnchor="middle" fontSize={9} fill="var(--amber)" style={{ fontFamily: 'var(--font-mono)' }}>λᴮ</text>
      <text x={x(4.16) + 2} y={50} textAnchor="start" fontSize={9} fill="var(--blue)" style={{ fontFamily: 'var(--font-mono)' }}>λε</text>
      <text x={x(29.4)} y={50} textAnchor="middle" fontSize={9} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>η*</text>
    </svg>
  );
}

function MiniDumbbells() {
  // Table 2: fixed and oracle for video, robots, agents, image gen., speech on a 60–100 axis
  const rows = [
    [62.43, 81.36],
    [70.45, 88.85],
    [69.17, 77.29],
    [82.93, 87.92],
    [98.62, 99.3],
  ];
  const x = (v: number) => 4 + ((v - 60) / 40) * 150;
  return (
    <svg viewBox="0 0 160 58" className="h-[58px] w-[160px] shrink-0" aria-hidden>
      {rows.map(([f, o], i) => (
        <g key={i}>
          <line x1={x(f)} y1={6 + i * 11.5} x2={x(o)} y2={6 + i * 11.5} stroke="var(--line-soft)" strokeWidth={4} strokeLinecap="round" />
          <circle cx={x(f)} cy={6 + i * 11.5} r={3.2} fill="var(--surface)" stroke="var(--slate)" strokeWidth={1.4} />
          <circle cx={x(o)} cy={6 + i * 11.5} r={3.2} fill="var(--ink)" />
        </g>
      ))}
    </svg>
  );
}

function MiniBars({ values, colors, max = 1 }: { values: number[]; colors: string[]; max?: number }) {
  return (
    <div className="flex h-[54px] shrink-0 items-end gap-1.5" aria-hidden>
      {values.map((v, i) => (
        <span key={i} className="w-3.5 rounded-t-[4px]" style={{ height: `${Math.max(3, (Math.abs(v) / max) * 54)}px`, background: colors[i] }} />
      ))}
    </div>
  );
}

function useColumns() {
  const get = () => (window.innerWidth < 768 ? 1 : window.innerWidth < 1100 ? 2 : 4);
  const [c, setC] = useState(get);
  useEffect(() => {
    const on = () => setC(get());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return c;
}

export function Findings() {
  const { theme } = useTheme();
  const columns = useColumns();
  const tk = useTokens();
  const go = (id: string) => () => scrollToId(id);

  const items: MagicBentoItem[] = [
    {
      colSpan: 2,
      onClick: go('headroom'),
      content: (
        <Card
          n="1"
          where="§7"
          title="The headroom is large, and it lives inside task types."
          figure="+5.4"
          unit="pts"
          note="per-input oracle over the best fixed arm per benchmark, on 19,814 test inputs; 18–19 points for video and robots."
          art={<MiniDumbbells />}
        />
      ),
    },
    {
      onClick: go('one-router'),
      content: (
        <Card
          n="2"
          where="§8.1"
          title="Learned routers match the best fixed arm."
          figure="6"
          unit="%"
          note="of the headroom captured by one router over 16 benchmarks: 79.98 against 79.68."
        />
      ),
    },
    {
      onClick: go('robots'),
      content: (
        <Card
          n="3"
          where="§8.2"
          title="On robots, the router reads the scene."
          figure="−24"
          unit="%"
          note="policy time, matching the better policy in each scene condition (71.6% against 70.5% success)."
        />
      ),
    },
    {
      onClick: go('learn'),
      content: (
        <Card
          n="4"
          where="§8.3"
          title="Learn outcomes, not winners."
          figure={<>71.6 / 42.8</>}
          unit="%"
          note="robot success from per-policy outcome regression and from winner labels, same inputs and backbone."
        />
      ),
    },
    {
      onClick: go('matched'),
      content: (
        <Card
          n="5"
          where="§8.4"
          title="Compare arms on the same inputs."
          figure={<>−0.4 → +2.4</>}
          note="a router's deficit turns into a gain when the fixed baseline drops models with missing scores."
        />
      ),
    },
    {
      colSpan: 2,
      onClick: go('price-route'),
      content: (
        <Card
          n="6"
          where="§9.1"
          title="Routing pays through price."
          figure="25.5"
          unit="×"
          note="Opus's efficiency on code at a 0.44-point loss; 7.1× on text QA and 1.35× on image generation near zero loss."
          art={<MiniRuler />}
        />
      ),
    },
    {
      colSpan: 2,
      onClick: go('spend-more'),
      content: (
        <Card
          n="7"
          where="§9.2"
          title="Richer arms and finer states pay only against what they replace."
          figure={<>.165 → .304</>}
          note="per-retry recovery once the retry sees the failing tests; a free compiler gate gives 4.09×, a list-price judge 0.30×."
          art={<MiniBars values={[4.09, 2.87, 1.98, 1.09, 0.3]} colors={[tk.teal, tk.teal, tk.slate, tk.slate, tk.coral]} max={4.2} />}
        />
      ),
    },
    {
      colSpan: 2,
      content: (
        <div className="flex h-full flex-col">
          <span className="smallcaps text-[10px] font-semibold text-accent">The evidence</span>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <div className="font-display text-[22px] font-semibold leading-tight text-ink">The outcome matrix</div>
              <p className="mt-1 font-sans text-[12px] leading-snug text-ink-3">
                {MATRIX.benchmarks} benchmarks in {MATRIX.groups} groups · {MATRIX.runs.toLocaleString('en-US')} scored runs ·{' '}
                {MATRIX.armVersions} arm versions · every arm of a pool on the same inputs
              </p>
            </div>
            <div>
              <div className="font-display text-[22px] font-semibold leading-tight text-ink">Two priced testbeds</div>
              <p className="mt-1 font-sans text-[12px] leading-snug text-ink-3">
                CodeRouterBench: {SETUP.coderouterbench.models} models, {SETUP.coderouterbench.tasks.toLocaleString('en-US')} coding tasks ·
                RouterBench: {SETUP.routerbench.models} models, {SETUP.routerbench.prompts.toLocaleString('en-US')} prompts
              </p>
            </div>
          </div>
          <div className="mt-auto pt-3">
            <LogoLoop
              logos={POOLS.flatMap((p) =>
                p.arms.map((a) => ({
                  node: (
                    <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-rule bg-surface-2 px-3 py-1 font-mono text-[12px] text-ink-2">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-ink-4">{p.short}</span>
                      {a}
                    </span>
                  ),
                  title: `${a} (${p.label})`,
                }))
              )}
              speed={40}
              gap={10}
              logoHeight={28}
              fadeOut
              fadeOutColor={tk.surface}
              pauseOnHover
              ariaLabel="The 23 arms of the outcome matrix"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="findings" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <div className="mb-10 grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-[150px_minmax(0,1fr)]">
          <div className="smallcaps pt-2 text-[10.5px] text-ink-3 md:text-right">Index of results</div>
          <div>
            <h2 className="display text-[clamp(36px,4.6vw,56px)] text-ink">Seven findings, one theory.</h2>
            <p className="mt-4 max-w-[680px] font-serif text-[18px] leading-relaxed text-ink-2">
              The matrix measures how much routing can gain and what learned routers recover; the two priced testbeds add the cost side.
              Every comparison is made within one panel of test inputs, with paired 95% intervals over source groups. Each card opens its
              section.
            </p>
          </div>
        </div>
        <MagicBento
          items={items}
          columns={columns}
          rowHeight={columns === 1 ? 210 : 232}
          gap={14}
          radius={22}
          theme={theme}
          glowColor={tk.accent}
          enableStars={false}
          enableTilt={false}
          enableMagnetism={false}
          spotlightRadius={300}
          clickEffect
          className="findings-bento"
          style={
            {
              '--mb-surface': 'var(--surface)',
              '--mb-edge': 'var(--rule)',
              '--mb-shadow': 'var(--shadow)',
              '--mb-ink': 'var(--ink)',
              '--mb-muted': 'var(--ink-3)',
            } as React.CSSProperties
          }
        />
      </div>
    </section>
  );
}
