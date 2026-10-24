import { useState } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { MarginToc } from '@/components/ui/MarginToc';
import { ToastHost } from '@/components/ui/toast';
import { PartDivider } from '@/components/ui/PartDivider';
import { PageBackground } from '@/components/ui/PageBackground';
import { NotationDrawer } from '@/components/ui/NotationDrawer';
import { SymHost } from '@/components/math/Sym';
import GradualBlur from '@/components/reactbits/GradualBlur/GradualBlur';
import { Hero } from '@/sections/Hero';
import { Overview } from '@/sections/Overview';
import { Value } from '@/sections/Value';
import { Optimal } from '@/sections/Optimal';
import { Ladder } from '@/sections/Ladder';
import { Targets } from '@/sections/Targets';
import { Certificate } from '@/sections/Certificate';
import { Findings } from '@/sections/Findings';
import { Matrix } from '@/sections/Matrix';
import { Headroom } from '@/sections/Headroom';
import { Routers } from '@/sections/Routers';
import { Price } from '@/sections/Price';
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
        <PartDivider id="part-1" part="Part I" title="A router's value" sub="One rule at a price, a ladder of what a router can reach, a training target, and a certified floor." />
        <Value />
        <Optimal />
        <Ladder />
        <Targets />
        <Certificate />
        <PartDivider id="part-2" part="Part II" title="The evidence" sub="One outcome matrix across seven output types, and two priced testbeds for code and text." />
        <Findings />
        <Matrix />
        <Headroom />
        <Routers />
        <Price />
        <Cite />
      </main>
      <NotationDrawer open={notation} onClose={() => setNotation(false)} />
      <SymHost />
      <ToastHost />
      <GradualBlur target="page" position="bottom" height="3.25rem" strength={1} layers={4} curve="bezier" tint="color-mix(in oklab, var(--bg) 65%, transparent)" zIndex={40} autoHide />
    </>
  );
}
