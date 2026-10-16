import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AnimatedList from '@/components/reactbits/AnimatedList/AnimatedList';
import { NOTATION } from '@/data/notation';
import { tex } from '@/lib/tex';
import { scrollToId } from '@/lib/scrollspy';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';

const WHERE: Record<string, string> = {
  setting: '§0',
  accounting: '§1',
  price: '§2',
  floor: '§3',
  reference: '§4',
  combine: '§5',
  spend: '§6',
  signals: '§6.3',
  remember: '§7',
};

/** Every symbol on the page in one place: hover cards explain them inline, this lists them all. */
export function NotationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const tk = useTokens();
  const [q, setQ] = useState('');
  const keys = useMemo(() => {
    const all = Object.keys(NOTATION);
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((k) => {
      const e = NOTATION[k];
      return `${e.name} ${e.def} ${e.group}`.toLowerCase().includes(needle) || k.toLowerCase().includes(needle);
    });
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[70] bg-[color-mix(in_oklab,var(--ink)_22%,transparent)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Notation"
            className="fixed bottom-3 right-3 top-3 z-[71] flex w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] border border-rule bg-bg shadow-[var(--shadow-lg)]"
            initial={{ x: 480, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <div>
                <div className="smallcaps text-[10px] text-accent">Notation</div>
                <div className="font-display text-[26px] font-semibold leading-tight text-ink">Every symbol, once</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close notation"
                className="grid h-9 w-9 place-items-center rounded-full border border-rule text-ink-2 transition-colors hover:border-accent hover:text-accent"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            </div>
            <div className="px-5 pt-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search: price, floor, cascade…"
                className="w-full rounded-full border border-rule bg-surface px-4 py-2 font-sans text-[13.5px] text-ink outline-none placeholder:text-ink-4 focus:border-accent"
                autoFocus
              />
            </div>
            <div className="min-h-0 flex-1 px-3 pb-3 pt-3">
              <AnimatedList
                key={q}
                items={keys.map((k) => {
                  const e = NOTATION[k];
                  return {
                    id: k,
                    icon: <span className="text-[16px] text-ink" dangerouslySetInnerHTML={{ __html: tex(e.tex) }} />,
                    title: <span className="font-sans text-[13.5px] font-semibold">{e.name}</span>,
                    description: <span className="font-serif text-[12.5px] leading-snug">{e.def}</span>,
                    meta: <span className="font-mono text-[10.5px]">{WHERE[e.where] ?? ''}</span>,
                  };
                })}
                onItemSelect={(_item, i) => {
                  const e = NOTATION[keys[i]];
                  onClose();
                  window.setTimeout(() => scrollToId(e.where), 260);
                }}
                theme={theme}
                accentColor={tk.accent}
                frame={false}
                width="100%"
                maxHeight="calc(100vh - 190px)"
                gap={6}
                radius={14}
                animation="pop"
                displayScrollbar={false}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
