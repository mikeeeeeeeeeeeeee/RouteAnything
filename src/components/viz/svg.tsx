import type { CSSProperties } from 'react';
import { tex } from '@/lib/tex';

/** KaTeX inside an SVG, anchored like an SVG <text>. */
export function TexLabel({
  x,
  y,
  t,
  anchor = 'middle',
  size = 14,
  color = 'var(--ink-2)',
  w = 160,
  h = 26,
  className = '',
  style,
}: {
  x: number;
  y: number;
  t: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  color?: string;
  w?: number;
  h?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const fx = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <foreignObject x={fx} y={y - h / 2} width={w} height={h} style={{ overflow: 'visible', ...style }} className={className}>
      <div
        style={{
          fontSize: size,
          color,
          lineHeight: `${h}px`,
          textAlign: anchor === 'start' ? 'left' : anchor === 'end' ? 'right' : 'center',
          whiteSpace: 'nowrap',
        }}
        dangerouslySetInnerHTML={{ __html: tex(t) }}
      />
    </foreignObject>
  );
}

export const mono: CSSProperties = { fontFamily: 'var(--font-mono)' };
export const sans: CSSProperties = { fontFamily: 'var(--font-sans)' };
export const serifItalic: CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' };

/** linear scale helper */
export const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
export const logScale = (d0: number, d1: number, r0: number, r1: number) => {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  return (v: number) => r0 + ((Math.log10(v) - l0) / (l1 - l0)) * (r1 - r0);
};
