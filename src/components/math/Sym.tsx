import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { NOTATION, type NotationEntry, type NotationKey } from '@/data/notation';
import { tex } from '@/lib/tex';

const SECTION_NAMES: Record<string, string> = {
  setting: '§1 The setting',
  accounting: '§1 The accounting',
  price: '§2 The price',
  floor: '§3 The floor',
  reference: '§4 The reference',
  combine: '§5 Combine',
  spend: '§6 Spend more',
  signals: '§6 Spend more',
  remember: '§7 Remember',
};

/* ---------- one card for the whole page ---------- */

interface CardState {
  key: string;
  x: number;
  y: number;
  below: boolean;
  id: number;
}
let state: CardState | null = null;
let seq = 0;
let closeTimer: number | undefined;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function showSym(key: string, el: Element) {
  if (!NOTATION[key]) return;
  window.clearTimeout(closeTimer);
  const r = el.getBoundingClientRect();
  const below = r.top < 270;
  const same = state && state.key === key;
  state = { key, x: r.left + r.width / 2, y: below ? r.bottom + 10 : r.top - 10, below, id: same ? state!.id : ++seq };
  emit();
}
export function hideSym(delay = 140) {
  window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => {
    state = null;
    emit();
  }, delay);
}
const keepSym = () => window.clearTimeout(closeTimer);

export function SymHost() {
  const s = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state
  );
  useEffect(() => {
    if (!s) return;
    const off = () => hideSym(0);
    window.addEventListener('scroll', off, { passive: true });
    return () => window.removeEventListener('scroll', off);
  }, [s]);
  return createPortal(<AnimatePresence>{s && <SymCard key={s.id} entry={NOTATION[s.key]} s={s} />}</AnimatePresence>, document.body);
}

function SymCard({ entry, s }: { entry: NotationEntry; s: CardState }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dx, setDx] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const left = s.x - w / 2;
    const pad = 12;
    setDx(left < pad ? pad - left : left + w > window.innerWidth - pad ? window.innerWidth - pad - (left + w) : 0);
  }, [s.x]);
  return (
    <div
      ref={ref}
      className="fixed z-[80] w-[304px]"
      style={{ left: s.x + dx, top: s.y, transform: `translate(-50%, ${s.below ? '0%' : '-100%'})` }}
      onMouseEnter={keepSym}
      onMouseLeave={() => hideSym()}
    >
      <motion.div
        initial={{ opacity: 0, y: s.below ? -6 : 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: s.below ? -4 : 4, scale: 0.98, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="rounded-2xl border border-rule bg-surface p-4 text-left shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[26px] leading-none text-ink" dangerouslySetInnerHTML={{ __html: tex(entry.tex) }} />
          <span className="smallcaps text-right text-accent">{entry.name}</span>
        </div>
        <p className="mt-3 font-serif text-[14px] leading-[1.55] text-ink-2">{entry.def}</p>
        {entry.formula && (
          <div className="mt-3 overflow-x-auto rounded-xl bg-surface-2 px-3 py-2 text-center text-[14px] text-ink no-scrollbar" dangerouslySetInnerHTML={{ __html: tex(entry.formula) }} />
        )}
        <a href={`#${entry.where}`} className="smallcaps mt-3 inline-flex items-center gap-1.5 text-ink-3 transition-colors hover:text-accent">
          Introduced in {SECTION_NAMES[entry.where] ?? entry.where} <span aria-hidden>→</span>
        </a>
      </motion.div>
    </div>
  );
}

/* ---------- inline symbol ---------- */

const symStyle = {
  backgroundImage: 'linear-gradient(to right, var(--ink-4) 55%, transparent 55%)',
  backgroundSize: '4px 1px',
  backgroundRepeat: 'repeat-x',
  backgroundPosition: '0 100%',
};

/** A symbol you can hover: the card says what it means and where it is introduced. */
export function Sym({ k, children }: { k: NotationKey; children?: string }) {
  const entry = NOTATION[k];
  return (
    <span
      tabIndex={0}
      role="button"
      aria-label={`${entry.name}: ${entry.def}`}
      className="sym cursor-help rounded-[3px] px-[1px] transition-colors duration-200 hover:bg-accent-wash focus-visible:bg-accent-wash"
      style={symStyle}
      onMouseEnter={(e) => showSym(k, e.currentTarget)}
      onMouseLeave={() => hideSym()}
      onFocus={(e) => showSym(k, e.currentTarget)}
      onBlur={() => hideSym()}
      dangerouslySetInnerHTML={{ __html: tex(children ?? entry.tex) }}
    />
  );
}

/**
 * Hover cards for symbols tagged inside rendered TeX with \htmlData{sym=KEY}{...}.
 * Attach to any container that holds KaTeX output.
 */
export function useSymDelegation(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const find = (t: EventTarget | null) => (t instanceof Element ? (t.closest('[data-sym]') as HTMLElement | null) : null);
    const over = (e: Event) => {
      const s = find(e.target);
      if (s && el.contains(s)) showSym(s.dataset.sym!, s);
    };
    const out = (e: Event) => {
      const s = find(e.target);
      if (s) hideSym();
    };
    el.addEventListener('mouseover', over);
    el.addEventListener('mouseout', out);
    return () => {
      el.removeEventListener('mouseover', over);
      el.removeEventListener('mouseout', out);
    };
  }, [ref]);
}

/** Wrap a TeX fragment so it carries a hover card: s('Q','Q') -> \htmlData{sym=Q}{Q} */
export const s = (key: NotationKey, body?: string) => `\\htmlData{sym=${key}}{${body ?? NOTATION[key].tex}}`;
