// A schematic action menu for one state, used by the figures that explain Theorem 2 and
// Proposition 3. Units: value as a share of the reference's value, cost as a share of the
// reference's cost, so the reference B sits at (c, v) = (1, 1) and eta_B = 1.
// Efficiencies 1, 1.5, 2.1, 2.8, 3.5, 4 rise as cost falls, and the frontier is concave, so the
// envelope has evenly spread breakpoints. Two dominated actions never touch it.

export const ETA_STAR = 4;

export interface Action {
  id: string;
  /** label used in figures */
  label: string;
  /** TeX label */
  tex: string;
  v: number;
  c: number;
  reference?: boolean;
  dominated?: boolean;
}

export const ACTIONS: Action[] = [
  { id: 'B', label: 'B', tex: 'B', v: 1, c: 1, reference: true },
  { id: 'u1', label: 'u1', tex: 'u_1', v: 0.93, c: 0.62 },
  { id: 'u2', label: 'u2', tex: 'u_2', v: 0.8, c: 0.38 },
  { id: 'u3', label: 'u3', tex: 'u_3', v: 0.62, c: 0.22 },
  { id: 'u4', label: 'u4', tex: 'u_4', v: 0.42, c: 0.12 },
  { id: 'u5', label: 'u5', tex: 'u_5', v: 0.24, c: 0.06 },
  // dominated: never the best line at any price
  { id: 'd1', label: 'u6', tex: 'u_6', v: 0.7, c: 0.5, dominated: true },
  { id: 'd2', label: 'u7', tex: 'u_7', v: 0.5, c: 0.3, dominated: true },
];

export const ratio = (u: Action) => u.v / u.c;
export const net = (u: Action, l: number) => u.v - l * u.c;

export function argmaxAt(l: number, menu: Action[] = ACTIONS): Action {
  let best = menu[0];
  let bv = -Infinity;
  for (const u of menu) {
    const val = net(u, l);
    if (val > bv + 1e-12) {
      bv = val;
      best = u;
    }
  }
  return best;
}

export const phi = (l: number, menu: Action[] = ACTIONS) => net(argmaxAt(l, menu), l);

/** Breakpoints of the upper envelope on [0, lMax] and the action on each piece (the price path). */
export function pricePath(lMax = ETA_STAR, menu: Action[] = ACTIONS) {
  const pieces: { u: Action; from: number; to: number }[] = [];
  let l = 0;
  let u = argmaxAt(0, menu);
  while (l < lMax - 1e-9) {
    // next price at which some flatter action overtakes u
    let next = lMax;
    let nu = u;
    for (const w of menu) {
      if (w.c >= u.c - 1e-12) continue;
      const x = (u.v - w.v) / (u.c - w.c);
      if (x > l + 1e-9 && x < next - 1e-12) {
        next = x;
        nu = w;
      }
    }
    pieces.push({ u, from: l, to: next });
    if (nu === u) break;
    l = next;
    u = nu;
  }
  return pieces;
}

/** Dinkelbach: lambda_{t+1} = eta(g_t), g_t = argmax J at lambda_t. */
export function dinkelbach(l0 = 1, menu: Action[] = ACTIONS) {
  const steps: { l: number; u: Action; next: number }[] = [];
  let l = l0;
  for (let i = 0; i < 12; i++) {
    const u = argmaxAt(l, menu);
    const next = ratio(u);
    steps.push({ l, u, next });
    if (Math.abs(next - l) < 1e-9) break;
    l = next;
  }
  return steps;
}
