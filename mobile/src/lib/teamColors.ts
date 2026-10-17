/** Vereinsfarben → Badge-Farben (Hintergrund, Text, optionaler Rand). Keine Logos. */
export const FALLBACK_BG = '#E3E8EF'; // Theme-Grau
export const FALLBACK_FG = '#1B2433';
const HEX = /^#[0-9A-Fa-f]{6}$/;
export const validHex = (v?: string | null): string | undefined => (v && HEX.test(v.trim()) ? v.trim().toUpperCase() : undefined);

/** Relative Luminanz nach WCAG */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export const contrastRatio = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Hell oder dunkel – je nachdem, was mehr Kontrast bringt */
export const autoText = (bg: string) => (contrastRatio(bg, '#FFFFFF') >= contrastRatio(bg, '#111111') ? '#FFFFFF' : '#111111');

export type BadgeColors = { bg: string; fg: string; border?: string; fallback: boolean };

export function resolveTeamColors(primary?: string | null, secondary?: string | null, text?: string | null): BadgeColors {
  const bg = validHex(primary);
  if (!bg) return { bg: FALLBACK_BG, fg: FALLBACK_FG, fallback: true };
  const t = validHex(text);
  // gesetzte Textfarbe nur nehmen, wenn sie lesbar ist (≥ 3:1, große fette Schrift)
  const fg = t && contrastRatio(bg, t) >= 3 ? t : autoText(bg);
  const sec = validHex(secondary);
  const L = luminance(bg);
  let border: string | undefined;
  // Rand dezent nur bei sehr hellem oder sehr dunklem Primär (sonst verschwimmt das Badge mit dem Untergrund)
  if (L > 0.75) border = sec && sec !== bg && contrastRatio(sec, bg) >= 1.5 ? sec : 'rgba(0,0,0,0.12)';
  else if (L < 0.03 && sec && sec !== bg && contrastRatio(sec, bg) >= 1.5) border = sec;
  return { bg, fg, border, fallback: false };
}
