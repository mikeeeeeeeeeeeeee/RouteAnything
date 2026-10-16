import { useEffect, useMemo, useState } from 'react';
import GooeyNav from '@/components/reactbits/GooeyNav/GooeyNav';
import SquishSwitch from '@/components/reactbits/SquishSwitch/SquishSwitch';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';
import { TOC, TOP_NAV } from '@/data/toc';
import { scrollToId, useScrollProgress, useScrollSpy } from '@/lib/scrollspy';
import { tex } from '@/lib/tex';
import logoLight from '@/assets/brand/infrec-light.webp';
import logoDark from '@/assets/brand/infrec-dark.webp';

export function InfRecLogo({ className = '' }: { className?: string }) {
  const { theme } = useTheme();
  return <img src={theme === 'dark' ? logoDark : logoLight} alt="InfRec · Cardinal AI Lab" className={className} draggable={false} />;
}

export function TopBar({ onNotation }: { onNotation: () => void }) {
  const { theme, setTheme } = useTheme();
  const tk = useTokens();
  const ids = useMemo(() => TOC.map((t) => t.id), []);
  const active = useScrollSpy(ids);
  const progress = useScrollProgress();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const group = active < 0 ? 0 : TOC[active].group;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled ? 'border-b border-rule bg-[color-mix(in_oklab,var(--bg)_78%,transparent)] backdrop-blur-xl backdrop-saturate-150' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-[64px] max-w-[1480px] items-center gap-4 px-5 md:px-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group flex min-w-0 items-center gap-3"
          aria-label="Route Anything, back to top"
        >
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-rule bg-surface text-[17px] text-accent shadow-[var(--shadow)] transition-transform duration-300 group-hover:rotate-[-6deg]"
            dangerouslySetInnerHTML={{ __html: tex('\\eta^{\\star}') }}
          />
          <span className="hidden min-w-0 flex-col leading-none sm:flex">
            <span className="font-display text-[21px] font-semibold tracking-[-0.01em] text-ink">Route Anything</span>
            <span className="smallcaps mt-1 text-[9.5px] text-ink-3">InfRec · technical report</span>
          </span>
        </a>

        <div className="ml-auto hidden lg:block">
          <GooeyNav
            items={TOP_NAV.map((n) => ({ label: n.label, href: `#${n.target}` }))}
            activeIndex={group}
            onChange={(i) => {
              const t = TOP_NAV[i].target;
              if (t === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
              else scrollToId(t);
            }}
            theme={theme}
            color={tk.ink}
            activeTextColor={tk.bg}
            size="sm"
            particleCount={12}
            gooeyness={0.55}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <button
            type="button"
            onClick={onNotation}
            className="group flex h-9 items-center gap-2 rounded-full border border-rule bg-surface px-3.5 text-[13px] text-ink-2 shadow-[var(--shadow)] transition-colors hover:border-accent hover:text-accent"
          >
            <span className="text-[15px] leading-none" dangerouslySetInnerHTML={{ __html: tex('\\Sigma') }} />
            <span className="font-sans font-medium">Notation</span>
          </button>
          <div className="flex items-center gap-2 pl-1">
            <SunMoon dark={false} />
            <SquishSwitch
              checked={theme === 'dark'}
              onChange={(c) => setTheme(c ? 'dark' : 'light')}
              width={50}
              height={28}
              radius={14}
              trackColor={tk.rule}
              trackOnColor={tk.surface2}
              thumbColor={tk.ink}
              thumbOnColor={tk.accent}
              ariaLabel="Dark theme"
            />
            <SunMoon dark />
          </div>
        </div>
      </div>
      {/* reading progress, drawn as a ruler line */}
      <div className="absolute inset-x-0 bottom-[-1px] h-[2px]">
        <div className="h-full origin-left bg-accent transition-transform duration-150" style={{ transform: `scaleX(${progress})` }} />
      </div>
    </header>
  );
}

function SunMoon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  );
}
