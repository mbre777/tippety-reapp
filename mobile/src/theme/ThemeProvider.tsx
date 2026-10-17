import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSport } from '@/sport/SportContext';
import { fonts, lightAccents, lightPalette, radius, shadow, space, type Accent, type Palette } from './tokens';

export type ColorScheme = 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;
  c: Palette;
  accent: Accent;
  fonts: typeof fonts;
  radius: typeof radius;
  space: typeof space;
  shadow: typeof shadow;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { sport } = useSport();
  // Dark Mode folgt später: hier dann Palette/Accents je nach scheme wählen.
  const scheme: ColorScheme = 'light';
  const value = useMemo<Theme>(
    () => ({ scheme, c: lightPalette, accent: lightAccents[sport], fonts, radius, space, shadow }),
    [sport, scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme must be used inside ThemeProvider');
  return t;
}
