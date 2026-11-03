import { paper, released } from '@/data/paper';
import { useTheme } from '@/theme/ThemeProvider';
import { switchView } from '@/phone/mode';
import { Moon, Phone, Sun } from './icons';

/** The desktop page's bar: a floating pill with the title, Cite, the paper (or the code until it is out), and two switches. */
export function Nav() {
  const { theme, toggle } = useTheme();
  const main = released ? { href: paper.links.pdf, label: 'Paper' } : { href: paper.links.code, label: 'Code' };
  return (
    <nav className="nav" aria-label="Page">
      <a className="nav-title" href="#top">
        {paper.title}
      </a>
      <a className="pill out" href="#cite">
        Cite
      </a>
      <a className="pill solid" href={main.href} target="_blank" rel="noreferrer">
        {main.label}
      </a>
      <span className="nav-sep" aria-hidden />
      <button type="button" className="icon-btn" onClick={() => switchView('phone')} aria-label="Show the phone layout" title="Phone layout">
        <Phone />
      </button>
      <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'} title={theme === 'dark' ? 'Light' : 'Dark'}>
        {theme === 'dark' ? <Sun /> : <Moon />}
      </button>
    </nav>
  );
}
