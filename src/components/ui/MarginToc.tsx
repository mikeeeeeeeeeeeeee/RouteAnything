import { useEffect, useMemo, useState } from 'react';
import LineSidebar from '@/components/reactbits/LineSidebar/LineSidebar';
import { TOC } from '@/data/toc';
import { scrollToId, useScrollSpy } from '@/lib/scrollspy';
import { useTokens } from '@/theme/tokens';

/** Contents in the left margin, on wide screens, once the reader is past the title page. */
export function MarginToc() {
  const tk = useTokens();
  const ids = useMemo(() => TOC.map((t) => t.id), []);
  const active = useScrollSpy(ids);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const on = () => {
      const first = document.getElementById(TOC[0].id);
      const end = document.getElementById('page-end');
      const past = first ? first.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
      const before = end ? end.getBoundingClientRect().top > window.innerHeight * 0.5 : true;
      setShown(past && before);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <aside
      aria-label="Contents"
      className={`fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 transition-all duration-500 2xl:block ${
        shown ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none -translate-x-4 opacity-0'
      }`}
    >
      <div className="pl-6">
        <div className="smallcaps mb-1 pl-[58px] text-[10px] text-ink-4">Contents</div>
        <LineSidebar
          items={TOC.map((t) => t.label)}
          activeIndex={active < 0 ? null : active}
          onItemClick={(i) => scrollToId(TOC[i].id)}
          accentColor={tk.accent}
          textColor={tk.ink3}
          markerColor={tk.ink4}
          showIndex={false}
          markerLength={44}
          markerGap={14}
          maxShift={10}
          proximityRadius={70}
          itemGap={13}
          fontSize={0.8}
          className="font-sans"
        />
      </div>
    </aside>
  );
}
