import { useEffect, useRef, useState, type RefObject } from 'react';

/** true while the element is (near) the viewport */
export function useInView<T extends Element>(ref: RefObject<T | null>, rootMargin = '120px', once = false) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) setInView(false);
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, once]);
  return inView;
}

/**
 * A clock in seconds that only runs while `running`. The frame delta is clamped at >= 0:
 * the first rAF timestamp can precede performance.now(), and a negative step breaks timelines.
 */
export function useClock(running: boolean, speed = 1) {
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      tRef.current += dt * speed;
      setT(tRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, speed]);
  const reset = (to = 0) => {
    tRef.current = to;
    setT(to);
  };
  return [t, reset] as const;
}

export function useReducedMotion() {
  const [r, setR] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setR(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return r;
}

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** smooth 0..1 progress of t through [start, start + dur] */
export const seg = (t: number, start: number, dur: number) => {
  const x = clamp((t - start) / dur);
  return x * x * (3 - 2 * x);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
