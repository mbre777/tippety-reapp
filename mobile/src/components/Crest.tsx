import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Team } from '@/data/types';
import { fonts } from '@/theme/tokens';

/** Neutrales Platzhalter-Wappen in Vereinsfarben (keine echten Logos). */
export function Crest({ team, size = 28 }: { team: Team; size?: number }) {
  const [bg, fg] = team.colors;
  const h = size * 1.12;
  const fontSize = size * (team.short.length > 3 ? 0.24 : 0.3);
  return (
    <View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`Wappen ${team.name}`}>
      <Svg width={size} height={h} viewBox="0 0 40 45" style={{ position: 'absolute' }}>
        <Path d="M3 7 20 2l17 5v14c0 11-7.5 18.5-17 22C10.5 39.5 3 32 3 21z" fill={bg} />
        <Path d="M3 7 20 2l17 5v14c0 11-7.5 18.5-17 22C10.5 39.5 3 32 3 21z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
      </Svg>
      <Text style={{ color: fg, fontFamily: fonts.display, fontSize, marginTop: -size * 0.06, letterSpacing: 0.3 }} numberOfLines={1}>
        {team.short}
      </Text>
    </View>
  );
}
