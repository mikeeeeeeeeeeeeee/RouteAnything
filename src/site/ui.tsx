import type { CSSProperties, ReactNode } from 'react';
import { Swatch, type Mark } from '@/charts/base';
import type { StatRow } from './copy';

/** a reveal delay step, for staggering */
export const d = (n: number) => ({ '--d': n }) as CSSProperties;

export function StoryHead({ eyebrow, h, lede }: { eyebrow: string; h: string[]; lede?: ReactNode }) {
  return (
    <header className="story-head wrap-copy">
      <p className="eyebrow rv">{eyebrow}</p>
      <h2 className="hx rv" style={d(1)}>
        {h[0]}
        {h[1] && (
          <>
            {' '}
            <br className="br" />
            {h[1]}
          </>
        )}
      </h2>
      {lede && (
        <p className="lede rv" style={d(2)}>
          {lede}
        </p>
      )}
    </header>
  );
}

export function FigHead({ t, sub }: { t: ReactNode; sub?: ReactNode }) {
  return (
    <div className="fig-head">
      <p className="fig-t">{t}</p>
      {sub && <p className="fig-sub">{sub}</p>}
    </div>
  );
}

export function Key({ items, center }: { items: { label: ReactNode; mark?: Mark; color?: string }[]; center?: boolean }) {
  return (
    <div className={`key${center ? ' key-c' : ''}`}>
      {items.map((it, i) => (
        <span key={i}>
          <Swatch mark={it.mark} color={it.color} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export function Card({ k, h, fig, note, className = '', style }: { k: string; h: ReactNode; fig?: ReactNode; note?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <article className={`card ${className}`} style={style}>
      <p className="card-k">{k}</p>
      <h3>{h}</h3>
      {fig && <div className="card-fig">{fig}</div>}
      {note && <p className="card-note">{note}</p>}
    </article>
  );
}

/** two-sided comparisons: the recommended choice in blue, the alternative in grey */
export function Rows({ rows }: { rows: StatRow[] }) {
  return (
    <ul className="rows">
      {rows.map((r, i) => (
        <li key={r.k} className="rv" style={d(i)}>
          <div className="r-head">
            <p className="r-k">{r.k}</p>
            <p className="r-n">{r.note}</p>
          </div>
          <div>
            <p className="r-v us num">{r.us.v}</p>
            <p className="r-c">{r.us.c}</p>
          </div>
          <div>
            <p className="r-v them num">{r.them.v}</p>
            <p className="r-c">{r.them.c}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
