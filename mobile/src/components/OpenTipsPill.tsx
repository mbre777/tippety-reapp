import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { repo, useQuery, useTipsVersion } from '@/data';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';

/** Header-Pill: offene Tipps der Lieblingsliga im nächsten Spieltag. Tap → erstes offenes Spiel. */
export function OpenTipsPill() {
  const { sport } = useSport();
  const { c, accent, fonts } = useTheme();
  const version = useTipsVersion();
  const info = useQuery(() => repo.getOpenTipsNextRound(sport), [sport, version]).data;
  if (!info) return null;
  const n = info.open.length;
  const done = n === 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={done ? `${info.leagueName}: alle Spiele getippt` : `${info.leagueName}: ${n} offene Tipps, zum ersten offenen Spiel`}
      onPress={() => (done ? router.navigate('/spiele') : router.push(`/spiel/${info.open[0].id}`))}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 11, borderRadius: 999, backgroundColor: c.card, maxWidth: 190 }}
    >
      {done ? (
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: accent.main }}>✓ Alle getippt</Text>
      ) : (
        <>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.warning }} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: c.textMuted }} numberOfLines={1}>
            {info.leagueName} <Text style={{ fontFamily: fonts.bodyHeavy, color: c.text }}>· {n} offen</Text>
          </Text>
        </>
      )}
    </Pressable>
  );
}
