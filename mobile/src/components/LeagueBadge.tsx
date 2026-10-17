import { Text, View } from 'react-native';
import type { League } from '@/data/types';
import { fonts } from '@/theme/tokens';

export function LeagueBadge({ league, size = 46, faded }: { league: League; size?: number; faded?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.26, backgroundColor: league.color, alignItems: 'center', justifyContent: 'center', opacity: faded ? 0.45 : 1 }}>
      <Text style={{ fontFamily: fonts.display, color: '#fff', fontSize: size * (league.code.length > 2 ? 0.3 : 0.36) }}>{league.code}</Text>
    </View>
  );
}

/** Initialen-Kachel (Gruppen) */
export function InitialTile({ text, bg, fg, size = 52 }: { text: string; bg: string; fg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.36, color: fg }}>{text}</Text>
    </View>
  );
}
