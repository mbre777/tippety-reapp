import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { repo, useQuery, useTipsVersion } from '@/data';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

/** Header-Pill: offene Tipps der Lieblingsliga im nächsten Spieltag. Tap → erstes offenes Spiel. */
export function OpenTipsPill() {
  const { sport } = useSport();
  const { favorite } = useMyLeagues(sport);
  const { c, accent, fonts } = useTheme();
  const version = useTipsVersion();
  const info = useQuery(() => (favorite ? repo.getRoundTips(favorite.id) : Promise.resolve(undefined)), [favorite?.id, version]).data;
  if (!info) return null;
  const n = info.open.length;
  const done = n === 0;
  return (
    <Pressable
      testID="open-tips-pill"
      accessibilityRole="button"
      accessibilityLabel={done ? `${info.leagueName}: alle Spiele getippt` : `${info.leagueName}: ${n} offene Tipps, zum ersten offenen Spiel`}
      onPress={() => (done ? router.navigate({ pathname: '/fertig', params: { league: info.leagueId } }) : router.push(`/spiel/${info.open[0].id}`))}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 34, paddingHorizontal: 13, borderRadius: 999, backgroundColor: c.card, maxWidth: 210 }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: done ? accent.main : c.warning }} />
      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13.5, color: c.text }} numberOfLines={1}>
        {done ? '✓ Alle getippt' : `${info.leagueName} · ${n} offen`}
      </Text>
    </Pressable>
  );
}
