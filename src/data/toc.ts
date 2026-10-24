export interface TocItem {
  id: string;
  label: string;
  /** which top-bar group this belongs to: 0 overview, 1 theory, 2 findings, 3 cite */
  group: number;
}

export const TOC: TocItem[] = [
  { id: 'overview', label: 'Overview', group: 0 },
  { id: 'value', label: '§1  A router’s value', group: 1 },
  { id: 'optimal', label: '§2  Optimal routing', group: 1 },
  { id: 'ladder', label: '§3  The headroom ladder', group: 1 },
  { id: 'targets', label: '§4  What to learn', group: 1 },
  { id: 'floor', label: '§5  The certified floor', group: 1 },
  { id: 'findings', label: 'Seven findings', group: 2 },
  { id: 'matrix', label: '§6  The outcome matrix', group: 2 },
  { id: 'headroom', label: '§7  Headroom', group: 2 },
  { id: 'routers', label: '§8  Learned routers', group: 2 },
  { id: 'price', label: '§9  Price', group: 2 },
  { id: 'cite', label: 'Conclusion & cite', group: 3 },
];

export const TOP_NAV = [
  { label: 'Overview', target: 'top' },
  { label: 'Theory', target: 'value' },
  { label: 'Findings', target: 'findings' },
  { label: 'Cite', target: 'cite' },
];
