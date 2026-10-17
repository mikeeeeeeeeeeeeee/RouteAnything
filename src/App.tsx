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
import { Problem } from '@/sections/Problem';
import { Accounting } from '@/sections/Accounting';
import { Price } from '@/sections/Price';
import { Certificate } from '@/sections/Certificate';
import { Reference } from '@/sections/Reference';
import { Findings } from '@/sections/Findings';
import { Combine } from '@/sections/Combine';
import { Spend } from '@/sections/Spend';
import { Remember } from '@/sections/Remember';
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
        <Problem />
        <PartDivider id="part-1" part="Part I" title="The accounting" sub="One identity, one price, one certificate, and the reference's two roles." />
        <Accounting />
        <Price />
        <Certificate />
        <Reference />
        <PartDivider id="part-2" part="Part II" title="The evidence" sub="What to combine, when to spend more, what to remember: tested on CodeRouterBench and RouterBench." />
        <Findings />
        <Combine />
        <Spend />
        <Remember />
        <Cite />
      </main>
      <NotationDrawer open={notation} onClose={() => setNotation(false)} />
      <SymHost />
      <ToastHost />
      <GradualBlur target="page" position="bottom" height="3.25rem" strength={1} layers={4} curve="bezier" tint="color-mix(in oklab, var(--bg) 65%, transparent)" zIndex={40} autoHide />
    </>
  );
}
