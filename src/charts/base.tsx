import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

export const MINUS = '−';
/** a number with a true minus sign */
export const fmt = (v: number, d = 1) => (v < 0 ? MINUS : '') + Math.abs(v).toFixed(d);
/** a change, always signed */
export const signed = (v: number, d = 1) => (v > 0 ? '+' : v < 0 ? MINUS : '±') + Math.abs(v).toFixed(d);
export const ci = (c: [number, number], d = 2) => `[${signed(c[0], d)}, ${signed(c[1], d)}]`;

export const lin = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
export const log = (d0: number, d1: number, r0: number, r1: number) => {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  return (v: number) => r0 + ((Math.log10(v) - l0) / (l1 - l0)) * (r1 - r0);
};

/** a horizontal bar with a square baseline end and a 4 px rounded data end */
export function hbar(x0: number, x1: number, cy: number, h: number, r = 4) {
  const w = x1 - x0;
  if (w <= 0) return '';
  const rr = Math.min(r, h / 2, w);
  const y0 = cy - h / 2;
  return `M${x0},${y0}H${x1 - rr}Q${x1},${y0} ${x1},${y0 + rr}V${y0 + h - rr}Q${x1},${y0 + h} ${x1 - rr},${y0 + h}H${x0}Z`;
}
/** a vertical bar standing on the baseline y0, rounded at the top */
export function vbar(cx: number, w: number, y0: number, y1: number, r = 4) {
  const h = y0 - y1;
  if (h <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  const x0 = cx - w / 2;
  return `M${x0},${y0}V${y1 + rr}Q${x0},${y1} ${x0 + rr},${y1}H${x0 + w - rr}Q${x0 + w},${y1} ${x0 + w},${y1 + rr}V${y0}Z`;
}

export type Mark = 'dot' | 'hollow' | 'bar' | 'line' | 'dash';
export interface TipRow {
  mark?: Mark;
  color?: string;
  label: ReactNode;
  value: ReactNode;
}
export interface TipData {
  /** anchor in the chart's coordinates (px) */
  x: number;
  y: number;
  title: ReactNode;
  rows: TipRow[];
  note?: ReactNode;
}

export function Swatch({ mark = 'bar', color = 'var(--blue)' }: { mark?: Mark; color?: string }) {
  if (mark === 'dot') return <i style={{ display: 'block', width: 9, height: 9, borderRadius: 9, background: color, justifySelf: 'center' }} />;
  if (mark === 'hollow')
    return <i style={{ display: 'block', width: 9, height: 9, borderRadius: 9, border: `1.75px solid ${color}`, boxSizing: 'border-box', justifySelf: 'center' }} />;
  if (mark === 'line') return <i style={{ display: 'block', width: 14, borderTop: `2px solid ${color}` }} />;
  if (mark === 'dash') return <i style={{ display: 'block', width: 14, borderTop: `2px dashed ${color}` }} />;
  return <i style={{ display: 'block', width: 12, height: 8, borderRadius: 2, background: color }} />;
}

/** One tooltip for the hovered row: the values lead, the labels follow. It keeps inside the chart's box. */
export function Tip({ data, box }: { data: TipData | null; box: { w: number; h: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [last, setLast] = useState<TipData | null>(null);
  if (data && data !== last) setLast(data);
  const shown = data ?? last;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !shown) return;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    let left = shown.x + 16;
    if (left + tw > box.w) left = shown.x - 16 - tw;
    if (left < 0) left = Math.max(0, Math.min(box.w - tw, shown.x - tw / 2));
    let top = shown.y - th / 2;
    top = Math.max(-8, Math.min(top, box.h - th + 8));
    setPos({ left, top });
  }, [shown, box.w, box.h]);
  return (
    <div ref={ref} className={`tip${data ? ' on' : ''}`} style={{ transform: `translate(${pos.left}px, ${pos.top}px)` }} aria-hidden>
      {shown && (
        <>
          <p className="tip-h">{shown.title}</p>
          {shown.rows.length > 0 && (
            <ul>
              {shown.rows.map((r, i) => (
                <li key={i}>
                  <Swatch mark={r.mark} color={r.color} />
                  <b>{r.value}</b>
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
          )}
          {shown.note && <p className="tip-n">{shown.note}</p>}
        </>
      )}
    </div>
  );
}

/**
 * Hover on a pointer, tap on a touch screen: which row is active, and the tooltip to show for it.
 * `bind(i, tip)` gives the handlers for row i's hit area.
 */
export function useHover() {
  const [hot, setHot] = useState<number | null>(null);
  const [tip, setTip] = useState<TipData | null>(null);
  const clear = useCallback(() => {
    setHot(null);
    setTip(null);
  }, []);
  const bind = useCallback(
    (i: number, make: () => TipData) => ({
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        setHot(i);
        setTip(make());
      },
      onPointerLeave: (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        clear();
      },
      onPointerDown: (e: PointerEvent) => {
        if (e.pointerType !== 'touch') return;
        if (hot === i) clear();
        else {
          setHot(i);
          setTip(make());
        }
      },
    }),
    [clear, hot]
  );
  return { hot, tip, bind, clear };
}

/** The chart's frame: measures its width, draws the SVG at that size, hosts the tooltip. */
export function ChartBox({
  height,
  draw,
  label,
  hot,
  tip,
  minWidth = 200,
}: {
  height: (w: number) => number;
  draw: (w: number) => ReactNode;
  label: string;
  hot: number | null;
  tip: TipData | null;
  minWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = Math.max(minWidth, w);
  const H = w ? height(W) : 0;
  return (
    <div ref={ref} className="cx" style={{ height: H || undefined }}>
      {w > 0 && (
        <>
          <svg className={`chart${hot !== null ? ' hot' : ''}`} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
            {draw(W)}
          </svg>
          <Tip data={tip} box={{ w: W, h: H }} />
        </>
      )}
    </div>
  );
}
