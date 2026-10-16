import { ACTIONS, ETA_STAR, type Action } from './envelope';

/** Undominated actions ordered from the reference (dearest) to the most efficient (cheapest). */
export const FRONTIER: Action[] = ACTIONS.filter((u) => !u.dominated).sort((a, b) => b.c - a.c);

export interface FloorOptimum {
  /** operating point (cost, value) */
  c: number;
  v: number;
  /** the two frontier actions mixed (same action twice at a vertex) */
  hi: Action;
  lo: Action;
  /** probability on the dearer action */
  w: number;
  etaEps: number;
  /** price interval at which the used actions maximise J (a point unless at a vertex) */
  lambda: [number, number];
  kappa: [number, number];
  binding: boolean;
}

const slope = (a: Action, b: Action) => (a.v - b.v) / (a.c - b.c);

/**
 * Theorem 2(iii) on the schematic menu (one state): maximise v/c subject to v >= 1 - eps, where the
 * reference has v = c = 1. Along the frontier efficiency rises as cost falls, so the optimum is
 * where the frontier meets the floor, mixing at most two neighbouring actions.
 */
export function floorOptimum(eps: number): FloorOptimum {
  const target = 1 - eps;
  const last = FRONTIER[FRONTIER.length - 1];
  if (target <= last.v + 1e-9) {
    // floor slack: the unconstrained optimum
    const prev = FRONTIER[FRONTIER.length - 2];
    return { c: last.c, v: last.v, hi: last, lo: last, w: 1, etaEps: ETA_STAR, lambda: [slope(prev, last), ETA_STAR], kappa: [0, 0], binding: false };
  }
  for (let i = 0; i < FRONTIER.length - 1; i++) {
    const a = FRONTIER[i];
    const b = FRONTIER[i + 1];
    if (target <= a.v + 1e-9 && target >= b.v - 1e-9) {
      const atA = Math.abs(target - a.v) < 1e-6;
      const atB = !atA && Math.abs(target - b.v) < 1e-6;
      if (atA || atB) {
        // the floor meets the frontier at a vertex: one action, a whole interval of prices
        const k = atA ? i : i + 1;
        const u = FRONTIER[k];
        const lo = k > 0 ? slope(FRONTIER[k - 1], u) : 0;
        const hi = k < FRONTIER.length - 1 ? slope(u, FRONTIER[k + 1]) : ETA_STAR;
        const etaEps = u.v / u.c;
        return {
          c: u.c,
          v: u.v,
          hi: u,
          lo: u,
          w: 1,
          etaEps,
          lambda: [lo, hi],
          kappa: [etaEps / hi - 1, lo > 0 ? etaEps / lo - 1 : Infinity],
          binding: true,
        };
      }
      const w = (target - b.v) / (a.v - b.v);
      const c = w * a.c + (1 - w) * b.c;
      const etaEps = target / c;
      const s = slope(a, b);
      return { c, v: target, hi: a, lo: b, w, etaEps, lambda: [s, s], kappa: [etaEps / s - 1, etaEps / s - 1], binding: true };
    }
  }
  const b = FRONTIER[0];
  return { c: b.c, v: b.v, hi: b, lo: b, w: 1, etaEps: 1, lambda: [0, 0], kappa: [0, 0], binding: true };
}
