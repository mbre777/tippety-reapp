import { Text, View } from 'react-native';
import { fonts } from '@/theme/tokens';

/** Wortmarke (Variante A): kursive Sport-Grotesk mit Speed-Strichen als Unterstreichung. */
export function Logo({ color, accent, scale = 1 }: { color: string; accent: string; scale?: number }) {
  const bar = (w: number) => (
    <View style={{ width: w * scale, height: 3 * scale, backgroundColor: accent, transform: [{ skewX: '-20deg' }] }} />
  );
  return (
    <View accessibilityRole="header" accessibilityLabel="Tippety">
      <Text style={{ fontFamily: fonts.logo, fontSize: 30 * scale, lineHeight: 32 * scale, letterSpacing: -0.5 * scale, color }}>tippety</Text>
      <View style={{ flexDirection: 'row', gap: 3 * scale, marginLeft: 4 * scale, marginTop: -1 * scale }}>
        {bar(34)}
        {bar(10)}
      </View>
    </View>
  );
}
