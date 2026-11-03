import { useState } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { MarginToc } from '@/components/ui/MarginToc';
import { ToastHost } from '@/components/ui/toast';
import { PageBackground } from '@/components/ui/PageBackground';
import { NotationDrawer } from '@/components/ui/NotationDrawer';
import { SymHost } from '@/components/math/Sym';
import GradualBlur from '@/components/reactbits/GradualBlur/GradualBlur';
import { Hero } from '@/sections/Hero';
import { Overview } from '@/sections/Overview';
import { Theory } from '@/sections/Theory';
import { Gain } from '@/sections/Gain';
import { Recover } from '@/sections/Recover';
import { Pay } from '@/sections/Pay';
import { Cite } from '@/sections/Cite';

export default function App() {
  const [notation, setNotation] = useState(false);
  return (
    <>
      <PageBackground />
      <TopBar onNotation={() => setNotation((n) => !n)} />
      <MarginToc />
      <main>
        <Hero />
        <Overview />
        <Theory />
        <Gain />
        <Recover />
        <Pay />
        <Cite />
      </main>
      <NotationDrawer open={notation} onClose={() => setNotation(false)} />
      <SymHost />
      <ToastHost />
      <GradualBlur target="page" position="bottom" height="3.25rem" strength={1} layers={4} curve="bezier" tint="color-mix(in oklab, var(--bg) 65%, transparent)" zIndex={40} autoHide />
    </>
  );
}
