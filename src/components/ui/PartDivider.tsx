import { useEffect, useRef, useState } from 'react';
import FoldText from '@/components/reactbits/FoldText/FoldText';

/**
 * A chapter opener in the diagram language: a route runs into the part label and out again, with
 * packets travelling along it. No background: the page shows through.
 */
export function PartDivider({ part, title, sub, id }: { part: string; title: string; sub: string; id?: string }) {
  return (
    <div id={id} className="relative py-20 md:py-28">
      <div className="mx-auto flex max-w-[1180px] items-center gap-5 px-5 md:px-8">
        <Route />
        <span className="smallcaps shrink-0 rounded-full border border-accent/40 bg-surface px-3 py-1 text-[11px] text-accent shadow-[var(--shadow)]">{part}</span>
        <Route out />
      </div>
      <div className="mt-7 flex flex-col items-center px-6 text-center">
        <div className="text-ink">
          <FoldText
            text={title}
            splitBy="word"
            trigger="scroll"
            fontSize="clamp(48px, 7vw, 100px)"
            fontWeight={500}
            stagger={0.09}
            duration={0.9}
            className="font-display italic tracking-[-0.02em]"
          />
        </div>
        <p className="mt-4 max-w-[560px] font-serif text-[18px] leading-relaxed text-ink-2">{sub}</p>
      </div>
    </div>
  );
}

function Route({ out = false }: { out?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const stations = [0.18, 0.5, 0.82];
  return (
    <svg ref={ref} className="h-6 min-w-0 flex-1 overflow-visible" viewBox={`0 0 ${w} 24`} preserveAspectRatio="none" aria-hidden>
      <line x1={0} y1={12} x2={w} y2={12} stroke="var(--line)" strokeWidth={1.4} opacity={0.8} />
      <line x1={0} y1={12} x2={w} y2={12} stroke="var(--blue)" strokeWidth={4} pathLength={1000} strokeDasharray="34 466" className="part-route" style={{ animationDelay: out ? '-1.4s' : '0s' }} />
      {stations.map((f) => (
        <circle key={f} cx={f * w} cy={12} r={5.5} fill="var(--surface)" stroke="var(--line)" strokeWidth={1.4} />
      ))}
    </svg>
  );
}
