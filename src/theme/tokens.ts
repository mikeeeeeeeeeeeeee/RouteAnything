// Resolved colours for canvas/WebGL components that cannot read CSS variables.
// Mirrors :root / .dark in src/index.css.
import { useTheme } from './ThemeProvider';

export interface Tokens {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  ink2: string;
  ink3: string;
  ink4: string;
  rule: string;
  accent: string;
  blue: string;
  amber: string;
  teal: string;
  coral: string;
  slate: string;
}

export const TOKENS: Record<'light' | 'dark', Tokens> = {
  light: {
    bg: '#faf8f4',
    surface: '#ffffff',
    surface2: '#f7f5f0',
    ink: '#15171c',
    ink2: '#3d414a',
    ink3: '#666b75',
    ink4: '#a3a6ad',
    rule: '#e6e2d9',
    accent: '#c21a2b',
    blue: '#2f64b4',
    amber: '#c8782a',
    teal: '#1a9481',
    coral: '#db6b55',
    slate: '#7b818b',
  },
  dark: {
    bg: '#0e1316',
    surface: '#151c21',
    surface2: '#1a2228',
    ink: '#eef0ec',
    ink2: '#c3c9cb',
    ink3: '#8d969c',
    ink4: '#56616a',
    rule: '#233038',
    accent: '#ff6b6b',
    blue: '#5a88dc',
    amber: '#cb8231',
    teal: '#22a08a',
    coral: '#e0735c',
    slate: '#7f8a93',
  },
};

export function useTokens(): Tokens {
  const { theme } = useTheme();
  return TOKENS[theme];
}
