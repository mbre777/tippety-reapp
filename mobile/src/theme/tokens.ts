import type { Sport } from '@/data/types';

/** Farbpalette. Struktur ist dark-fähig: ein zweites Palette-Objekt genügt später. */
export type Palette = {
  bg: string;
  card: string;
  cardMuted: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  dashed: string;
  warning: string;
  warningBg: string;
  violet: string;
  violetBg: string;
  gold: string;
  goldBg: string;
  silver: string;
  bronze: string;
  bronzeBg: string;
  up: string;
  down: string;
};

export type Accent = {
  main: string;
  dark: string;
  soft: string; // getönte Fläche (z. B. Tipp-Box)
  softer: string;
  onAccent: string;
  /** Header-Hintergrund (Spielfeld/Eisfläche) */
  fieldBase: string;
  fieldStripe: string;
  fieldLine: string;
  headerText: string;
  headerTextMuted: string;
};

export const lightPalette: Palette = {
  bg: '#F4F6F8',
  card: '#FFFFFF',
  cardMuted: '#EEF1F4',
  text: '#14181D',
  textMuted: '#6B7480',
  textFaint: '#9AA2AC',
  border: '#E3E7EC',
  dashed: '#C9CFD6',
  warning: '#B7791F',
  warningBg: '#FFF5DF',
  violet: '#6B4FC8',
  violetBg: '#EFEAFB',
  gold: '#C9A227',
  goldBg: '#FFF6DC',
  silver: '#9AA2AC',
  bronze: '#B8693A',
  bronzeBg: '#FCEDE3',
  up: '#1E9A55',
  down: '#D33A3A',
};

export const lightAccents: Record<Sport, Accent> = {
  football: {
    main: '#13874a',
    dark: '#0E6B3A',
    soft: '#E3F3E9',
    softer: '#F0F8F3',
    onAccent: '#FFFFFF',
    fieldBase: '#1B8A47',
    fieldStripe: '#1C8D49',
    fieldLine: 'rgba(255,255,255,0.16)',
    headerText: '#FFFFFF',
    headerTextMuted: 'rgba(255,255,255,0.7)',
  },
  hockey: {
    main: '#1f64c8',
    dark: '#174E9E',
    soft: '#E4EDFA',
    softer: '#F1F5FC',
    onAccent: '#FFFFFF',
    fieldBase: '#EAF1F9',
    fieldStripe: '#EAF1F9',
    fieldLine: 'rgba(31,100,200,0.15)',
    headerText: '#13284A',
    headerTextMuted: '#5D6E86',
  },
};

export const fonts = {
  logo: 'Barlow_800ExtraBold_Italic',
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
  body: 'Nunito_500Medium',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const shadow = {
  card: {
    shadowColor: '#1A2430',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;
