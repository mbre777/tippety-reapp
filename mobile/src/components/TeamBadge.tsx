import { Text, View } from 'react-native';
import type { Team } from '@/data/types';
import { resolveTeamColors } from '@/lib/teamColors';
import { useTheme } from '@/theme/ThemeProvider';

/** Langer Name → Kurzform (short_name) bzw. Kürzung auf die ersten Wörter */
export function displayName(team: Team, max = 18): string {
  if (team.name.length <= max) return team.name;
  if (team.shortName && team.shortName.length <= max) return team.shortName;
  const words = team.name.split(/\s+/);
  let out = '';
  for (const w of words) {
    if ((out + ' ' + w).trim().length > max) break;
    out = (out + ' ' + w).trim();
  }
  return out || team.name.slice(0, max);
}

/**
 * Team-Badge in Vereinsfarben: Hintergrund = Primärfarbe, Kürzel in Textfarbe, dezenter Rand in
 * Sekundärfarbe bei sehr hellem/dunklem Primär. Ohne Farben: neutrales Theme-Grau. Keine Logos.
 * `showName`: voller Vereinsname darunter (Tipp-Detail).
 */
export function TeamBadge({ team, size = 28, showName = false }: { team: Team; size?: number; showName?: boolean }) {
  const { c, fonts } = useTheme();
  const col = team.noColors ? resolveTeamColors(null) : resolveTeamColors(team.colors[0], team.secondary, team.colors[1]);
  const w = size * 1.35;
  const fontSize = size * (team.short.length > 3 ? 0.3 : 0.36);
  const badge = (
    <View
      accessibilityLabel={`Team ${team.name}`}
      style={{ width: w, height: size, borderRadius: size * 0.28, backgroundColor: col.bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: col.border ? Math.max(1, size * 0.04) : 0, borderColor: col.border }}>
      <Text style={{ color: col.fg, fontFamily: fonts.display, fontSize, letterSpacing: 0.4, includeFontPadding: false }} numberOfLines={1}>{team.short}</Text>
    </View>
  );
  if (!showName) return badge;
  return (
    <View style={{ alignItems: 'center', alignSelf: 'stretch' }}>
      {badge}
      <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: c.text, textAlign: 'center', marginTop: 8 }}
        numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
        {displayName(team)}
      </Text>
    </View>
  );
}
