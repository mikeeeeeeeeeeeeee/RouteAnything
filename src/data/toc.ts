export interface TocItem {
  id: string;
  label: string;
  /** which top-bar group this belongs to: 0 overview, 1 theory, 2 findings, 3 cite */
  group: number;
}

export const TOC: TocItem[] = [
  { id: 'problem', label: 'The problem', group: 0 },
  { id: 'accounting', label: '§1  Accounting', group: 1 },
  { id: 'price', label: '§2  The price', group: 1 },
  { id: 'floor', label: '§3  The certificate', group: 1 },
  { id: 'reference', label: '§4  The reference', group: 1 },
  { id: 'findings', label: 'Seven findings', group: 2 },
  { id: 'combine', label: '§5  Combine', group: 2 },
  { id: 'spend', label: '§6  Spend more', group: 2 },
  { id: 'remember', label: '§7  Remember', group: 2 },
  { id: 'cite', label: 'Limits & cite', group: 3 },
];

export const TOP_NAV = [
  { label: 'Overview', target: 'top' },
  { label: 'Theory', target: 'accounting' },
  { label: 'Findings', target: 'findings' },
  { label: 'Cite', target: 'cite' },
];
