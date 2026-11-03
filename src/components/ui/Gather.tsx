import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { PaneActive } from '@/lib/pane';

export interface GatherItem {
  key: string;
  /** small mono tag above the label, e.g. "Lemma 1" or "Finding 3" */
  tag?: ReactNode;
  label: ReactNode;
  /** the result's headline number, shown under the label */
  stat?: ReactNode;
  content: ReactNode;
}

/**
 * Sibling results gathered under one tab rail. Every pane stays mounted in the same grid cell, so the
 * block keeps the height of its tallest pane and switching never moves what is below it. Hidden panes
 * tell their figures to pause (see `PaneActive`).
 */
export function Gather({ items, ariaLabel, initial, className = '' }: { items: GatherItem[]; ariaLabel: string; initial?: string; className?: string }) {
  const [active, setActive] = useState(initial ?? items[0].key);
  const uid = useId();
  const rail = useRef<HTMLDivElement>(null);

  const select = (key: string, focus = false) => {
    setActive(key);
    const btn = rail.current?.querySelector<HTMLButtonElement>(`[data-key="${key}"]`);
    if (btn && rail.current) {
      // keep the chosen tab inside the rail without scrolling the page
      const r = rail.current;
      const left = btn.offsetLeft - r.offsetLeft;
      if (left < r.scrollLeft) r.scrollTo({ left: left - 8, behavior: 'smooth' });
      else if (left + btn.offsetWidth > r.scrollLeft + r.clientWidth) r.scrollTo({ left: left + btn.offsetWidth - r.clientWidth + 8, behavior: 'smooth' });
      if (focus) btn.focus({ preventScroll: true });
    }
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = items.findIndex((it) => it.key === active);
    const go = (j: number) => {
      e.preventDefault();
      select(items[(j + items.length) % items.length].key, true);
    };
    if (e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowLeft') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
  };

  return (
    <div className={className}>
      <LayoutGroup id={uid}>
        {/* on phones the rail scrolls sideways; a fade at the right edge says so */}
        <div className="relative after:pointer-events-none after:absolute after:bottom-px after:right-0 after:top-0 after:w-10 after:bg-gradient-to-l after:from-bg after:to-transparent md:after:hidden">
        <div ref={rail} role="tablist" aria-label={ariaLabel} onKeyDown={onKey} className="no-scrollbar relative flex overflow-x-auto border-b border-rule">
          {items.map((it) => {
            const on = it.key === active;
            return (
              <button
                key={it.key}
                data-key={it.key}
                type="button"
                role="tab"
                id={`${uid}-tab-${it.key}`}
                aria-selected={on}
                aria-controls={`${uid}-pane-${it.key}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(it.key)}
                className={`group relative shrink-0 px-4 pb-3 pt-2 text-left transition-colors first:pl-1 md:px-5 ${on ? 'text-ink' : 'text-ink-3 hover:text-ink-2'}`}
              >
                {it.tag && (
                  <span className={`block font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${on ? 'text-accent' : 'text-ink-4 group-hover:text-ink-3'}`}>{it.tag}</span>
                )}
                <span className="mt-0.5 block whitespace-nowrap font-sans text-[14.5px] font-medium">{it.label}</span>
                {it.stat && <span className="num mt-0.5 block whitespace-nowrap font-mono text-[11.5px] text-ink-3">{it.stat}</span>}
                {on && (
                  <motion.span
                    layoutId="gather-underline"
                    className="absolute bottom-[-1px] left-4 right-4 h-[2.5px] rounded-full bg-accent group-first:left-1 md:left-5 md:right-5"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        </div>
      </LayoutGroup>
      <div className="grid">
        {items.map((it) => {
          const on = it.key === active;
          return (
            <div
              key={it.key}
              role="tabpanel"
              id={`${uid}-pane-${it.key}`}
              aria-labelledby={`${uid}-tab-${it.key}`}
              aria-hidden={!on}
              inert={!on}
              className="min-w-0 pt-7"
              style={{
                gridArea: '1 / 1',
                visibility: on ? 'visible' : 'hidden',
                opacity: on ? 1 : 0,
                transform: on ? 'none' : 'translateY(6px)',
                transition: on ? 'opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1), visibility 0s' : 'opacity .2s ease, transform .2s ease, visibility 0s .2s',
              }}
            >
              <PaneActive.Provider value={on}>{it.content}</PaneActive.Provider>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Several views of one figure in one grid cell: the block keeps the tallest view's height. */
export function Stack({ active, views, className = '' }: { active: string; views: { key: string; node: ReactNode }[]; className?: string }) {
  return (
    <div className={`grid ${className}`}>
      {views.map((v) => {
        const on = v.key === active;
        return (
          <div
            key={v.key}
            aria-hidden={!on}
            inert={!on}
            className="min-w-0"
            style={{
              gridArea: '1 / 1',
              alignSelf: 'center',
              visibility: on ? 'visible' : 'hidden',
              opacity: on ? 1 : 0,
              transition: on ? 'opacity .4s ease, visibility 0s' : 'opacity .2s ease, visibility 0s .2s',
            }}
          >
            <PaneActive.Provider value={on}>{v.node}</PaneActive.Provider>
          </div>
        );
      })}
    </div>
  );
}
