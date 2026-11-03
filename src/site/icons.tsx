// Small line icons for the nav and the phone sheet, 20 × 20, drawn in the current text colour.

const base = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const Sun = () => (
  <svg {...base}>
    <circle cx="10" cy="10" r="3.4" />
    <path d="M10 2.2v1.9M10 15.9v1.9M2.2 10h1.9M15.9 10h1.9M4.5 4.5l1.35 1.35M14.15 14.15l1.35 1.35M4.5 15.5l1.35-1.35M14.15 5.85l1.35-1.35" />
  </svg>
);

export const Moon = () => (
  <svg {...base}>
    <path d="M16.2 12.3A6.6 6.6 0 0 1 7.7 3.8a6.6 6.6 0 1 0 8.5 8.5Z" />
  </svg>
);

export const Phone = () => (
  <svg {...base}>
    <rect x="5.6" y="2.4" width="8.8" height="15.2" rx="2.2" />
    <path d="M8.8 15h2.4" />
  </svg>
);

export const Desktop = () => (
  <svg {...base}>
    <rect x="2.4" y="3.6" width="15.2" height="10.2" rx="1.8" />
    <path d="M7.4 17h5.2M10 13.8V17" />
  </svg>
);

export const Menu = () => (
  <svg {...base}>
    <path d="M4 7h12M4 13h12" />
  </svg>
);

export const Close = () => (
  <svg {...base}>
    <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
  </svg>
);

export const Chevron = () => (
  <svg {...base} width={14} height={14}>
    <path d="M7.5 4.5l5.5 5.5-5.5 5.5" />
  </svg>
);
