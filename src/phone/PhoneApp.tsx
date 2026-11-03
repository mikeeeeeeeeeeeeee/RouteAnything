import { useEffect, useState } from 'react';
import { paper, released } from '@/data/paper';
import { useHashScroll, useReveal } from '@/lib/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Gain, Hero, How, PaperBlock, Pay, Recover } from '@/site/sections';
import { Close, Desktop, Menu, Moon, Sun } from '@/site/icons';
import { COPY } from '@/site/copy';
import { inFrame, switchView } from './mode';

// The phone layout: the same sections and figures, stacked for one column; side-by-side cards become a row to
// swipe. The bar keeps the title and the main link; its menu holds the sections, the theme and the desktop page.

const STOPS = [
  { id: 'how', label: COPY.how.eyebrow },
  { id: 'gain', label: COPY.gain.eyebrow },
  { id: 'recover', label: COPY.recover.eyebrow },
  { id: 'pay', label: COPY.pay.eyebrow },
  { id: 'cite', label: 'Paper and BibTeX' },
];

function PhoneBar() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const main = released ? { href: paper.links.pdf, label: 'Paper' } : { href: paper.links.code, label: 'Code' };
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);
  return (
    <>
      <nav className="nav" aria-label="Page">
        <a className="nav-title" href="#top">
          {paper.title}
        </a>
        <a className="pill solid" href={main.href} target="_blank" rel="noreferrer">
          {main.label}
        </a>
        <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Open the menu" aria-expanded={open}>
          <Menu />
        </button>
      </nav>
      <div className={`sheet-veil${open ? ' on' : ''}`} onClick={() => setOpen(false)} aria-hidden />
      <div className={`sheet${open ? ' on' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
        <div className="sheet-head">
          <span>{paper.title}</span>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close the menu" tabIndex={open ? 0 : -1}>
            <Close />
          </button>
        </div>
        <ul className="sheet-list">
          {STOPS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="sheet-row">
          <button type="button" onClick={toggle} tabIndex={open ? 0 : -1}>
            {theme === 'dark' ? <Sun /> : <Moon />}
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
          <button type="button" onClick={() => switchView('desktop')} tabIndex={open ? 0 : -1}>
            <Desktop />
            Desktop layout
          </button>
        </div>
      </div>
    </>
  );
}

export default function PhoneApp() {
  useReveal();
  useHashScroll();
  useEffect(() => {
    document.documentElement.classList.add('phone');
    if (inFrame()) document.documentElement.classList.add('framed');
  }, []);
  return (
    <>
      <PhoneBar />
      <main>
        <Hero phone />
        <How phone />
        <Gain />
        <Recover />
        <Pay />
        <PaperBlock />
      </main>
      <p className="to-desktop">
        <button type="button" onClick={() => switchView('desktop', 'top')}>
          <Desktop />
          Open the desktop layout
        </button>
      </p>
    </>
  );
}
