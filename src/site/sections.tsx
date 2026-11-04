import { useState } from 'react';
import { HeroEfficiency, HeroHeadroom } from '@/charts/hero';
import { RouterDiagram } from '@/charts/router';
import { CertifyMini, EnvelopeMini, LadderMini, WinnerMini } from '@/charts/theory';
import { HeadroomShare } from '@/charts/gain';
import { RobotChart, ROBOT_KEY, RouterGainChart } from '@/charts/recover';
import { FloorWaffles } from '@/charts/pay';
import { affiliations, authors, bibtex, live, paper, released, thread } from '@/data/paper';
import logoDark from '@/assets/brand/infrec-dark.webp';
import logoLight from '@/assets/brand/infrec-light.webp';
import { useTheme } from '@/theme/ThemeProvider';
import { COPY } from './copy';
import { Card, d, FigHead, Key, Rows, StoryHead } from './ui';
import { Rail } from './Rail';
import { Chevron } from './icons';

// The page's sections, shared by the desktop page (App) and the phone layout (PhoneApp). `phone` swaps
// side-by-side groups for a stack or a row to swipe; everything else adapts by width.

type P = { phone?: boolean };

const MINIS = { thm2: EnvelopeMini, prop3: LadderMini, prop4: WinnerMini, prop5: CertifyMini };

export function Hero({ phone }: P) {
  const h = COPY.hero;
  const cta = released ? { href: paper.links.pdf, label: 'Paper' } : { href: paper.links.code, label: 'Code' };
  return (
    <section id="top" className="hero">
      <div className="wrap">
        <h1 className="hero-title rv">{paper.title}</h1>
        <p className="hero-sub rv" style={d(1)}>
          {h.sub}
        </p>
      </div>
      <div className={`wrap-mid hero-stage${phone ? ' is-phone' : ''}`}>
        <figure className="fig rv" style={d(2)}>
          <FigHead t={h.panels[0].t} />
          <Key
            items={[
              { mark: 'hollow', color: 'var(--c-a)', label: 'Best fixed candidate' },
              { mark: 'dot', color: 'var(--blue)', label: 'Per-input oracle' },
            ]}
          />
          <HeroHeadroom />
        </figure>
        <figure className="fig rv" style={d(3)}>
          <FigHead t={h.panels[1].t} />
          <Key items={[{ mark: 'bar', color: 'var(--blue)', label: h.panels[1].key }]} />
          <HeroEfficiency />
        </figure>
      </div>
      <div className="wrap">
        <div className="buy rv" style={d(3)}>
          <p>
            {h.buy}
            <span>{h.buy2}</span>
          </p>
          <a className="cta" href={cta.href} target="_blank" rel="noreferrer">
            {cta.label}
          </a>
        </div>
        <a className="more rv" style={d(4)} href={thread.href} target="_blank" rel="noreferrer" data-og-hide>
          {h.thread} <Chevron />
        </a>
      </div>
    </section>
  );
}

export function How({ phone }: P) {
  const c = COPY.how;
  const cards = c.cards.map((k, i) => {
    const Fig = MINIS[k.key as keyof typeof MINIS];
    return <Card key={k.key} className={phone ? '' : 'rv'} style={phone ? undefined : d(i % 2)} k={k.k} h={k.h} fig={<Fig />} note={k.note} />;
  });
  return (
    <section id="how" className="sec band">
      <StoryHead eyebrow={c.eyebrow} h={c.h} lede={c.lede} />
      <div className="wrap-mid stage">
        <Card className="rv wide" k={c.setting.k} h={c.setting.h} fig={<RouterDiagram />} note={c.setting.note} />
        {phone ? (
          <div className="rv">
            <Rail label="Four results of the theory">{cards}</Rail>
          </div>
        ) : (
          <div className="grid-2">{cards}</div>
        )}
        <p className="foot-note rv">{c.foot}</p>
      </div>
    </section>
  );
}

export function Gain() {
  const c = COPY.gain;
  return (
    <section id="gain" className="sec">
      <StoryHead eyebrow={c.eyebrow} h={c.h} lede={c.lede} />
      <div className="wrap-mid stage">
        <figure className="fig rv">
          <FigHead t={c.fig.t} sub={c.fig.sub} />
          <HeadroomShare />
          <figcaption className="cap">{c.fig.cap}</figcaption>
        </figure>
      </div>
    </section>
  );
}

export function Recover() {
  const c = COPY.recover;
  return (
    <section id="recover" className="sec band">
      <StoryHead eyebrow={c.eyebrow} h={c.h} lede={c.lede} />
      <div className="wrap-mid stage grid-2">
        <figure className="card fig rv">
          <FigHead t={c.beat.t} sub={c.beat.sub} />
          <RouterGainChart />
          <figcaption className="cap">{c.beat.cap}</figcaption>
        </figure>
        <figure className="card fig rv" style={d(1)}>
          <FigHead t={c.robot.t} sub={c.robot.sub} />
          <Key items={[...ROBOT_KEY.map((s) => ({ mark: 'bar' as const, color: s.color, label: s.label })), { mark: 'dash', color: 'var(--ink3)', label: 'Oracle' }]} />
          <RobotChart />
          <figcaption className="cap">{c.robot.cap}</figcaption>
        </figure>
      </div>
      <div className="wrap-mid stage-s">
        <Rows rows={c.rows} />
      </div>
    </section>
  );
}

export function Pay() {
  const c = COPY.pay;
  return (
    <section id="pay" className="sec">
      <StoryHead eyebrow={c.eyebrow} h={c.h} lede={c.lede} />
      <div className="wrap-mid stage">
        <figure className="fig rv">
          <FigHead t={c.fig.t} sub={c.fig.sub} />
          <FloorWaffles />
          <figcaption className="cap">{c.fig.cap}</figcaption>
        </figure>
      </div>
      <div className="wrap-mid stage">
        <div className="sub-head rv">
          <p className="card-k">{c.spend.k}</p>
          <h3>{c.spend.h}</h3>
        </div>
        <Rows rows={c.rows} />
      </div>
    </section>
  );
}

function Btn({ href, label, solid }: { href: string; label: string; solid?: boolean }) {
  if (!href)
    return (
      <span className="btn pending" aria-disabled="true" title="Posted soon">
        {label} <small>soon</small>
      </span>
    );
  return (
    <a className={`btn${solid ? ' solid' : ''}`} href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

function Bib() {
  const [done, setDone] = useState(false);
  const copy = () =>
    navigator.clipboard?.writeText(bibtex).then(
      () => {
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
      },
      () => setDone(false)
    );
  return (
    <div className="bib rv">
      <div className="bib-head">
        <span>BibTeX</span>
        <button type="button" className="copybtn" onClick={copy} aria-live="polite">
          {done ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        {bibtex.split('\n').map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </pre>
    </div>
  );
}

export function PaperBlock() {
  const { theme } = useTheme();
  const L = paper.links;
  return (
    <>
      <section id="cite" className="sec band paper">
        <div className="wrap-mid">
          <p className="eyebrow rv">{COPY.paper.eyebrow}</p>
          <h2 className="rv" style={d(1)}>
            {paper.title}: {paper.subtitle}
          </h2>
          <p className="authors rv" style={d(2)}>
            {authors.map((a) => (
              <span key={a.name}>
                {a.name}
                <sup>
                  {a.aff.join(',')}
                  {a.corresponding ? '*' : ''}
                </sup>
              </span>
            ))}
          </p>
          <p className="affil rv" style={d(2)}>
            {affiliations.map((x, i) => (
              <span key={x}>
                <sup>{i + 1}</sup>
                {x}
              </span>
            ))}
            <span>
              <sup>*</sup>Corresponding author
            </span>
          </p>
          <div className="btns rv" style={d(3)}>
            <Btn href={live(L.pdf)} label="Paper" solid />
            <Btn href={live(L.arxiv)} label="arXiv" />
            <Btn href={live(L.hf)} label="Hugging Face" />
            <Btn href={L.code} label="Code" solid={!released} />
            <Btn href={L.data} label="Data" />
          </div>
          <p className="thread rv" style={d(3)}>
            <a href={thread.href} target="_blank" rel="noreferrer">
              Part of a research thread: {thread.blurb} <Chevron />
            </a>
          </p>
          <Bib />
        </div>
      </section>
      <footer className="site-foot wrap">
        <img src={theme === 'dark' ? logoDark : logoLight} alt="InfRec · Cardinal AI Lab" width={124} height={40} draggable={false} />
        <p>
          {paper.title}: {paper.subtitle}. {paper.date}. {COPY.paper.foot}
        </p>
      </footer>
    </>
  );
}
