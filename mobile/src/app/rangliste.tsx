import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, HeaderTitle } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { StarIcon, TriangleIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { repo, useQuery, type LeaderboardEntry, type LeaderboardPeriod } from '@/data';
import { fmtNum } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'season', label: 'Saison' },
  { id: 'round', label: 'Spieltag' },
  { id: 'month', label: 'Monat' },
];

/** 07 Rangliste pro Liga – Liga-Umschalter (nur eigene Ligen, Lieblingsliga vorausgewählt). */
export default function Rangliste() {
  const params = useLocalSearchParams<{ league?: string }>();
  const { sport } = useSport();
  const { all, favorite } = useMyLeagues(sport);
  const { c, accent, fonts, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<LeaderboardPeriod>('season');
  const [picked, setPicked] = useState<string | undefined>(params.league);
  // Liga-Chips: Lieblingsliga der aktuellen Sportart zuerst, dann übrige eigene Ligen
  const chips = [...all].sort((a, b) => (a.id === favorite?.id ? -1 : b.id === favorite?.id ? 1 : (a.sport === sport ? 0 : 1) - (b.sport === sport ? 0 : 1)));
  const leagueId = picked && all.some((l) => l.id === picked) ? picked : favorite?.id ?? chips[0]?.id ?? '';
  const list = useQuery(() => repo.getLeaderboard(leagueId, period), [leagueId, period]).data ?? [];
  const podium = list.filter((e) => e.rank <= 3);
  const rest = list.filter((e) => e.rank > 3 && !e.isMe).slice(0, 4);
  const me = list.find((e) => e.isMe);

  return (
    <View style={{ flex: 1 }}>
      <Screen header={
        <AppHeader height={166} hidePill>
          <HeaderTitle overline="Saison 26/27" title="Rangliste" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22, marginTop: 10 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}>
            {chips.map((l) => {
              const sel = l.id === leagueId;
              return (
                <Pressable key={l.id} testID={`lb-${l.id}`} onPress={() => setPicked(l.id)} accessibilityRole="tab" accessibilityState={{ selected: sel }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 16, borderRadius: 999, backgroundColor: sel ? c.card : sport === 'football' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.75)' }}>
                  {l.id === favorite?.id ? <StarIcon color="#F2A516" filled size={15} /> : null}
                  <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14.5, color: sel ? c.text : accent.headerText }}>{l.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </AppHeader>
      }>
        <View style={[{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 999, padding: 5 }, shadow.card]}>
          {PERIODS.map((p) => {
            const sel = p.id === period;
            return (
              <Pressable key={p.id} onPress={() => setPeriod(p.id)} accessibilityRole="tab" accessibilityState={{ selected: sel }}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center', backgroundColor: sel ? accent.main : 'transparent' }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: sel ? accent.onAccent : c.textMuted }}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 18 }}>
          {[2, 1, 3].map((r) => {
            const e = podium.find((x) => x.rank === r);
            return e ? <PodiumCard key={r} e={e} /> : <View key={r} style={{ flex: 1 }} />;
          })}
        </View>

        <View style={{ gap: 10, marginTop: 14 }}>
          {rest.map((e) => <Row key={e.userId} e={e} />)}
        </View>
        <View style={{ height: 70 }} />
      </Screen>
      {me ? <View style={{ position: 'absolute', left: 18, right: 18, bottom: Math.max(insets.bottom, 14) + 6 + 70 + 14 }}><Row e={me} /></View> : null}
    </View>
  );
}

function PodiumCard({ e }: { e: LeaderboardEntry }) {
  const { c, fonts } = useTheme();
  const conf = {
    1: { color: c.gold, bg: c.goldBg, h: 206 },
    2: { color: c.silver, bg: c.cardMuted, h: 176 },
    3: { color: c.bronze, bg: c.bronzeBg, h: 164 },
  }[e.rank as 1 | 2 | 3];
  return (
    <View style={{ flex: 1, height: conf.h, borderRadius: 22, backgroundColor: conf.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, borderColor: conf.color, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: c.text }}>{e.initials}</Text>
        <View style={{ position: 'absolute', right: -6, bottom: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: conf.color, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.card }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, color: '#fff' }}>{e.rank}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14.5, color: c.text, marginTop: 12 }} numberOfLines={1}>{e.nickname}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 26, color: conf.color }}>{fmtNum(e.points)}</Text>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, color: c.textMuted }}>Punkte</Text>
    </View>
  );
}

function Row({ e }: { e: LeaderboardEntry }) {
  const { c, accent, fonts } = useTheme();
  const me = !!e.isMe;
  const fg = me ? accent.onAccent : c.text;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, backgroundColor: me ? accent.main : c.card }}>
      <Text style={{ minWidth: 34, fontFamily: fonts.display, fontSize: 21, color: fg }}>{e.rank}</Text>
      {e.trend === 'same' ? <Text style={{ width: 8, color: c.textFaint }}>–</Text> : <TriangleIcon dir={e.trend} color={me ? '#fff' : e.trend === 'up' ? c.up : c.down} />}
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: me ? 'rgba(255,255,255,0.2)' : c.cardMuted }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: fg }}>{e.initials}</Text>
      </View>
      <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: fg }} numberOfLines={1}>{me ? `Du · ${e.nickname}` : e.nickname}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 21, color: fg }}>{fmtNum(e.points)}</Text>
    </Card>
  );
}
