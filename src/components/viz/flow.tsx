import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'motion/react';
import { d, slice, type Pt } from '@/lib/polyline';
import { tex } from '@/lib/tex';

// The diagram language shared by the route figures: white circles, thin edges, mono captions, and
// short blue packets (the data hue for whatever a router sends) that travel along the edges.

export type Tone = 'idle' | 'accent' | 'blue' | 'amber' | 'coral' | 'teal';

const TONE: Record<Tone, string> = {
  idle: 'var(--line)',
  accent: 'var(--accent)',
  blue: 'var(--blue)',
  amber: 'var(--amber)',
  coral: 'var(--coral)',
  teal: 'var(--teal)',
};
const WASH: Record<Tone, string> = {
  idle: 'var(--surface)',
  accent: 'var(--accent-wash)',
  blue: 'var(--blue-wash)',
  amber: 'var(--amber-wash)',
  coral: 'var(--coral-wash)',
  teal: 'var(--teal-wash)',
};

const SPRING = { type: 'spring' as const, stiffness: 170, damping: 24, mass: 0.9 };

export interface Caption {
  text?: string;
  tex?: string;
  /** where the caption sits relative to the node */
  at?: 'below' | 'above' | 'right' | 'left';
}

export function FlowNode({
  x,
  y,
  r,
  label,
  labelTex,
  caption,
  tone = 'idle',
  pulse = 0,
  pulseTone,
  size = 17,
  dim = false,
  style,
}: {
  x: number;
  y: number;
  r: number;
  label?: string;
  labelTex?: string;
  caption?: Caption;
  tone?: Tone;
  /** 0..1, decays after something arrives */
  pulse?: number;
  pulseTone?: Tone;
  size?: number;
  dim?: boolean;
  style?: CSSProperties;
}) {
  const stroke = TONE[tone];
  const ring = TONE[pulseTone ?? (tone === 'idle' ? 'blue' : tone)];
  const at = caption?.at ?? 'below';
  const cw = 240;
  const cy = at === 'below' ? r + 26 : at === 'above' ? -r - 22 : 0;
  const cx = at === 'right' ? r + 14 + cw / 2 : at === 'left' ? -r - 14 - cw / 2 : 0;
  const align = at === 'right' ? 'flex-start' : at === 'left' ? 'flex-end' : 'center';
  return (
    <motion.g initial={false} animate={{ x, y, opacity: dim ? 0.38 : 1 }} transition={SPRING} style={style}>
      {pulse > 0.01 && (
        <circle r={r + 4 + (1 - pulse) * 16} fill="none" stroke={ring} strokeWidth={1.6} opacity={pulse * 0.75} />
      )}
      <circle
        r={r}
        fill={tone === 'idle' ? 'var(--surface)' : WASH[tone]}
        stroke={stroke}
        strokeWidth={tone === 'idle' ? 1.5 : 1.9}
        style={{ transition: 'fill .35s, stroke .35s' }}
      />
      {pulse > 0.01 && <circle r={r} fill={ring} opacity={pulse * 0.1} />}
      {label && (
        <text
          y={size * 0.36}
          textAnchor="middle"
          fontSize={size}
          fill="var(--ink)"
          style={{ fontFamily: 'var(--font-sans)', fontWeight: 450, letterSpacing: '-0.01em' }}
        >
          {label}
        </text>
      )}
      {labelTex && (
        <foreignObject x={-r} y={-size} width={r * 2} height={size * 2} style={{ overflow: 'visible' }}>
          <div
            style={{ fontSize: size, lineHeight: `${size * 2}px`, textAlign: 'center', color: 'var(--accent)', whiteSpace: 'nowrap' }}
            dangerouslySetInnerHTML={{ __html: tex(labelTex) }}
          />
        </foreignObject>
      )}
      {caption && (caption.text || caption.tex) && (
        <foreignObject x={cx - cw / 2} y={cy - 12} width={cw} height={24} style={{ overflow: 'visible' }}>
          <div
            style={{ display: 'flex', justifyContent: align, alignItems: 'center', gap: 6, height: 24, whiteSpace: 'nowrap' }}
            className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink-3"
          >
            {caption.text && <span>{caption.text}</span>}
            {caption.tex && <span className="text-[14px] normal-case tracking-normal text-ink-2" dangerouslySetInnerHTML={{ __html: tex(caption.tex) }} />}
          </div>
        </foreignObject>
      )}
    </motion.g>
  );
}

/** a static edge, drawn in once */
export function FlowEdge({ pts, delay = 0, tone = 'idle', width = 1.6, dashed = false }: { pts: Pt[]; delay?: number; tone?: Tone; width?: number; dashed?: boolean }) {
  return (
    <motion.path
      d={d(pts)}
      fill="none"
      stroke={TONE[tone]}
      strokeWidth={width}
      strokeLinejoin="round"
      strokeDasharray={dashed ? '4 6' : undefined}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: tone === 'idle' ? 0.85 : 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ pathLength: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.25, delay } }}
    />
  );
}

/** a packet: the short stretch [s - len, s] of a polyline, drawn thick; hollow ones are outlined */
export function Packet({
  pts,
  s,
  len = 22,
  color = 'var(--blue)',
  width = 4,
  glow = true,
  hollow = false,
}: {
  pts: Pt[];
  s: number;
  len?: number;
  color?: string;
  width?: number;
  glow?: boolean;
  hollow?: boolean;
}) {
  const seg = slice(pts, s - len, s);
  if (seg.length < 2) return null;
  const path = d(seg);
  return (
    <g>
      {glow && <path d={path} fill="none" stroke={color} strokeWidth={width + 6} strokeOpacity={0.14} strokeLinecap="round" />}
      <path d={path} fill="none" stroke={color} strokeWidth={width} strokeLinecap={hollow ? 'round' : 'butt'} />
      {hollow && <path d={path} fill="none" stroke="var(--surface)" strokeWidth={width - 3} strokeLinecap="round" />}
    </g>
  );
}

/** mono caption in the corner of a figure, as in "CONCEPTUAL EXECUTION PLAN" */
export function FigTag({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">{children}</span>;
}
