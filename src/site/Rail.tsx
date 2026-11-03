import { Children, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Cards that sit side by side on the desktop page become a row to swipe on a phone, with dots for where you are.
 * The next card peeks in at the edge, so the row reads as one to swipe.
 */
export function Rail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const n = Children.count(children);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => {
      const items = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      items.forEach((it, i) => {
        if (Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid) < Math.abs(items[best].offsetLeft + items[best].offsetWidth / 2 - mid)) best = i;
      });
      setAt(best);
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);
  const go = (i: number) => {
    const el = ref.current;
    const it = el?.children[i] as HTMLElement | undefined;
    if (el && it) el.scrollTo({ left: it.offsetLeft - (el.clientWidth - it.offsetWidth) / 2, behavior: 'smooth' });
  };
  return (
    <div className="rail-wrap">
      <div ref={ref} className="rail no-scrollbar" role="group" aria-label={label}>
        {children}
      </div>
      <div className="dots" role="tablist" aria-label={`${label}: card`}>
        {Array.from({ length: n }, (_, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === at} aria-label={`Card ${i + 1} of ${n}`} className={i === at ? 'on' : ''} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  );
}
