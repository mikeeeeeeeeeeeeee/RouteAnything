export interface TocItem {
  id: string;
  label: string;
  /** which top-bar group this belongs to: 0 overview, 1 theory, 2 findings, 3 cite */
  group: number;
}

export const TOC: TocItem[] = [
  { id: 'overview', label: '§1  Three questions', group: 0 },
  { id: 'theory', label: '§2  A router’s value', group: 1 },
  { id: 'gain', label: '§3  How much can routing gain?', group: 2 },
  { id: 'recover', label: '§4  What do routers recover?', group: 2 },
  { id: 'pay', label: '§5  When does routing pay?', group: 2 },
  { id: 'cite', label: 'Conclusion & cite', group: 3 },
];

export const TOP_NAV = [
  { label: 'Overview', target: 'top' },
  { label: 'Theory', target: 'theory' },
  { label: 'Findings', target: 'gain' },
  { label: 'Cite', target: 'cite' },
];
