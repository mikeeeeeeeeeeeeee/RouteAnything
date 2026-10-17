import SideRays from '@/components/reactbits/SideRays/SideRays';
import { useTheme } from '@/theme/ThemeProvider';

/** Light mode has no background at all. Dark mode is lit by React Bits Side Rays from the top right. */
export function PageBackground() {
  const { theme } = useTheme();
  if (theme !== 'dark') return null;
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <SideRays
        origin="top-right"
        rayColor1="#f2c98a"
        rayColor2="#96c0f0"
        blend={0.55}
        intensity={1.5}
        spread={2.2}
        density={5}
        speed={1.6}
        falloff={1.5}
        glow={0.9}
        saturation={0.8}
        dust={0.25}
        followMouse
        mouseInfluence={0.35}
        opacity={0.9}
      />
    </div>
  );
}
