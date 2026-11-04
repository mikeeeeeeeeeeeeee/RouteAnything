import { useHashScroll, useReveal } from '@/lib/hooks';
import { Nav } from '@/site/Nav';
import { Gain, Hero, How, PaperBlock, Pay, Recover } from '@/site/sections';
import { ApplySheet, TrySection } from '@/site/Apply';
import { trial } from '@/data/trial';

export default function App() {
  useReveal();
  useHashScroll();
  return (
    <>
      <a className="skip" href="#how">
        Skip to the content
      </a>
      <Nav />
      <main>
        <Hero />
        <How />
        <Gain />
        <Recover />
        <Pay />
        {trial.enabled && <TrySection />}
        <PaperBlock />
      </main>
      {trial.enabled && <ApplySheet />}
    </>
  );
}
