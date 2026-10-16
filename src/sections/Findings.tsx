import { useEffect, useState, type ReactNode } from 'react';
import MagicBento, { type MagicBentoItem } from '@/components/reactbits/MagicBento/MagicBento';
import LogoLoop from '@/components/reactbits/LogoLoop/LogoLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';
import { scrollToId } from '@/lib/scrollspy';
import { CRB_MODELS, SETUP } from '@/data/results';

// Part II opener: an index of the seven findings (each card jumps to its section) and the testbed.

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
  // lambda^B = 2.9, lambda_eps = 4.2, eta* = 29.4 on a log axis 1..40
  const x = (v: number) => 4 + (Math.log10(v) / Math.log10(40)) * 172;
  return (
    <svg viewBox="0 0 180 54" className="h-[54px] w-[180px] shrink-0" aria-hidden>
      <rect x={x(1)} y={14} width={x(2.9) - x(1)} height={20} rx={4} fill="var(--amber-wash)" />
      <line x1={4} y1={24} x2={176} y2={24} stroke="var(--ink-4)" />
      <line x1={x(2.9)} y1={10} x2={x(2.9)} y2={38} stroke="var(--amber)" strokeWidth={2.5} strokeLinecap="round" />
      <rect x={x(4.2) - 5} y={19} width={10} height={10} transform={`rotate(45 ${x(4.2)} 24)`} fill="var(--blue)" />
      <circle cx={x(29.4)} cy={24} r={5} fill="var(--surface)" stroke="var(--ink-2)" strokeWidth={1.5} />
      <text x={x(2.9)} y={50} textAnchor="middle" fontSize={9} fill="var(--amber)" style={{ fontFamily: 'var(--font-mono)' }}>λᴮ</text>
      <text x={x(4.2) + 2} y={50} textAnchor="start" fontSize={9} fill="var(--blue)" style={{ fontFamily: 'var(--font-mono)' }}>λε</text>
      <text x={x(29.4)} y={50} textAnchor="middle" fontSize={9} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>η*</text>
    </svg>
  );
}

function MiniDiverging() {
  return (
    <svg viewBox="0 0 150 54" className="h-[54px] w-[150px] shrink-0" aria-hidden>
      <line x1={60} y1={2} x2={60} y2={52} stroke="var(--ink-3)" />
      <rect x={60} y={8} width={82} height={14} rx={3} fill="var(--blue)" />
      <rect x={60 - 36} y={30} width={36} height={14} rx={3} fill="var(--amber)" />
      <text x={146} y={50} textAnchor="end" fontSize={9} fill="var(--ink-3)" style={{ fontFamily: 'var(--font-mono)' }}>
        vs Opus / DimBest
      </text>
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
      onClick: go('reference'),
      content: (
        <Card
          n="1"
          where="§4"
          title="Price structure, not the ratio objective, decides escalation."
          figure="25.5"
          unit="×"
          note="Opus's efficiency, at a −0.004 score change, by a zero-loss policy that never calls Opus."
          art={<MiniRuler />}
        />
      ),
    },
    {
      onClick: go('floor'),
      content: (
        <Card
          n="2"
          where="§3"
          title="A fitted floor is not a guarantee; a certified one is."
          figure={<>12.5 → 100</>}
          unit="%"
          note="of 200 random splits keep the floor."
        />
      ),
    },
    {
      onClick: go('combine'),
      content: (
        <Card
          n="3"
          where="§5"
          title="Adding a model changes the tasks left to the fallback."
          figure="97.1"
          unit="%"
          note="best-candidate selection when both portfolios are compared on the same tasks."
        />
      ),
    },
    {
      onClick: go('spend'),
      content: (
        <Card
          n="4"
          where="§6"
          title="A failure lowers the odds; feedback raises them."
          figure={<>.165 → .304</>}
          note="per-retry recovery, fresh vs. failing-test feedback, seven models."
        />
      ),
    },
    {
      onClick: go('verifiers'),
      content: (
        <Card
          n="5"
          where="§6"
          title="Verification is a menu, and the resource comes first."
          figure="4.09"
          unit="×"
          note="a free compile check, in dollars. A list-price LLM judge: 0.30×."
          art={<MiniBars values={[4.09, 2.87, 1.98, 1.09, 0.3]} colors={[tk.teal, tk.teal, tk.slate, tk.slate, tk.coral]} max={4.2} />}
        />
      ),
    },
    {
      colSpan: 2,
      onClick: go('signals'),
      content: (
        <Card
          n="6"
          where="§6"
          title="Released routers mainly recover the task type."
          figure={<>55 → 6–8</>}
          unit="%"
          note="of the perfect-information value captured by the best routers, without and with the task type."
          art={<MiniBars values={[0.555, 0.546, 0.062, 0.078]} colors={[tk.blue, tk.blue, tk.slate, tk.slate]} max={0.6} />}
        />
      ),
    },
    {
      colSpan: 2,
      onClick: go('remember'),
      content: (
        <Card
          n="7"
          where="§7"
          title="Memory pays only relative to the prior it replaces."
          figure={<>+0.275 / −0.120</>}
          note="realized per-round gain of one record store, against always-Opus and against a per-dimension best-model prior."
          art={<MiniDiverging />}
        />
      ),
    },
    {
      colSpan: 2,
      content: (
        <div className="flex h-full flex-col">
          <span className="smallcaps text-[10px] font-semibold text-accent">The testbed</span>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <div className="font-display text-[22px] font-semibold leading-tight text-ink">CodeRouterBench</div>
              <p className="mt-1 font-sans text-[12px] leading-snug text-ink-3">
                {SETUP.coderouterbench.models} models · {SETUP.coderouterbench.tasks.toLocaleString('en-US')} coding tasks ({SETUP.coderouterbench.probing.toLocaleString('en-US')} probing,{' '}
                {SETUP.coderouterbench.test.toLocaleString('en-US')} test) · {SETUP.coderouterbench.dims} dimensions, {SETUP.coderouterbench.cells} cells · reference{' '}
                {SETUP.coderouterbench.reference}
              </p>
            </div>
            <div>
              <div className="font-display text-[22px] font-semibold leading-tight text-ink">RouterBench</div>
              <p className="mt-1 font-sans text-[12px] leading-snug text-ink-3">
                {SETUP.routerbench.models} models · {SETUP.routerbench.prompts.toLocaleString('en-US')} mostly non-code prompts, split 70/30 · reference{' '}
                {SETUP.routerbench.reference}
              </p>
            </div>
          </div>
          <div className="mt-auto pt-3">
            <LogoLoop
              logos={CRB_MODELS.map((m) => ({
                node: <span className="whitespace-nowrap rounded-full border border-rule bg-surface-2 px-3 py-1 font-mono text-[12px] text-ink-2">{m}</span>,
                title: m,
              }))}
              speed={40}
              gap={10}
              logoHeight={28}
              fadeOut
              fadeOutColor={tk.surface}
              pauseOnHover
              ariaLabel="The eight CodeRouterBench models"
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
            <h2 className="display text-[clamp(36px,4.6vw,56px)] text-ink">Seven findings, one accounting.</h2>
            <p className="mt-4 max-w-[680px] font-serif text-[18px] leading-relaxed text-ink-2">
              Replay on recorded outcomes isolates each decision rule; online studies add fresh model calls, and the memory study is
              semi-synthetic. Intervals are paired task-bootstrap 95% intervals, and a sign is <em>decided</em> when its interval excludes zero.
              Each card opens its section.
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
