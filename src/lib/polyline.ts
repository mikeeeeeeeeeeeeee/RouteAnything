// Small geometry kit for the route diagrams: polylines between circular nodes, points along them,
// and the short sub-segments drawn as moving packets.

export type Pt = [number, number];

export const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function length(pts: Pt[]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

/** point at arc length s (clamped) */
export function pointAt(pts: Pt[], s: number): Pt {
  let d = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = dist(a, b);
    if (d <= l || i === pts.length - 1) {
      const f = l > 0 ? Math.min(1, d / l) : 0;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    d -= l;
  }
  return pts[pts.length - 1];
}

/** the part of the polyline between arc lengths s0 < s1, including any corners in between */
export function slice(pts: Pt[], s0: number, s1: number): Pt[] {
  const L = length(pts);
  const a = Math.max(0, Math.min(L, s0));
  const b = Math.max(0, Math.min(L, s1));
  if (b <= a) return [];
  const out: Pt[] = [pointAt(pts, a)];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    acc += dist(pts[i - 1], pts[i]);
    if (acc > a && acc < b) out.push(pts[i]);
  }
  out.push(pointAt(pts, b));
  return out;
}

/** shorten a polyline by r0 at its start and r1 at its end (to stop at circle edges) */
export function trim(pts: Pt[], r0: number, r1: number): Pt[] {
  const L = length(pts);
  return slice(pts, r0, L - r1);
}

export const d = (pts: Pt[]) => (pts.length ? pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') : '');

/** a polyline from a to b that leaves a at 45 degrees and finishes horizontally (or the reverse) */
export function bend(a: Pt, b: Pt, first: 'diag' | 'flat' = 'diag'): Pt[] {
  const dy = b[1] - a[1];
  const dx = b[0] - a[0];
  const run = Math.min(Math.abs(dy), Math.abs(dx));
  const sx = Math.sign(dx) || 1;
  if (first === 'diag') return [a, [a[0] + sx * run, b[1]], b];
  return [a, [b[0] - sx * run, a[1]], b];
}

/** deterministic hash -> [0, 1) */
export function hash01(i: number, salt = 0) {
  let x = (i * 374761393 + salt * 668265263) | 0;
  x = (x ^ (x >>> 13)) * 1274126177;
  x = x ^ (x >>> 16);
  return ((x >>> 0) % 100000) / 100000;
}

export const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
export const easeInOutSine = (x: number) => -(Math.cos(Math.PI * Math.min(1, Math.max(0, x))) - 1) / 2;
