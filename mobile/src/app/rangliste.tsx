import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppHeader, HeaderTitle } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { TriangleIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { repo, useQuery, type LeaderboardEntry, type LeaderboardPeriod } from '@/data';
import { fmtNum } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'total', label: 'Gesamt' },
  { id: 'week', label: 'Woche' },
  { id: 'month', label: 'Monat' },
  { id: 'group', label: 'Büro-Liga' },
];

export default function Rangliste() {
  const { sport } = useSport();
  const { c, accent, fonts, shadow } = useTheme();
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const list = useQuery(() => repo.getLeaderboard(sport, period), [sport, period]).data ?? [];
  const podium = list.filter((e) => e.rank <= 3);
  const rest = list.filter((e) => e.rank > 3 && !e.isMe).slice(0, 3);
  const me = list.find((e) => e.isMe);

  return (
    <Screen header={<AppHeader height={112}><HeaderTitle overline="Saison 26/27" title="Rangliste" /></AppHeader>}>
      <View style={[{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 999, padding: 5 }, shadow.card]}>
        {PERIODS.map((p) => {
          const sel = p.id === period;
          return (
            <Pressable key={p.id} onPress={() => setPeriod(p.id)} accessibilityRole="tab" accessibilityState={{ selected: sel }}
              style={{ flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center', backgroundColor: sel ? accent.main : 'transparent' }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: sel ? accent.onAccent : c.textMuted }} numberOfLines={1}>{p.label}</Text>
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

      <View style={{ gap: 10, marginTop: 18 }}>
        {rest.map((e) => <Row key={e.userId} e={e} />)}
        {me ? <Row e={me} /> : null}
      </View>
    </Screen>
  );
}

function PodiumCard({ e }: { e: LeaderboardEntry }) {
  const { c, fonts, shadow } = useTheme();
  const conf = {
    1: { color: c.gold, bg: c.goldBg, h: 210 },
    2: { color: c.silver, bg: c.card, h: 180 },
    3: { color: c.bronze, bg: c.bronzeBg, h: 168 },
  }[e.rank as 1 | 2 | 3];
  return (
    <View style={[{ flex: 1, height: conf.h, borderRadius: 22, backgroundColor: conf.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }, shadow.card]}>
      <View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, borderColor: conf.color, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: c.text }}>{e.initials}</Text>
        <View style={{ position: 'absolute', right: -6, bottom: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: conf.color, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.card }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, color: '#fff' }}>{e.rank}</Text>
        </View>
      </View>
      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 15, color: c.text, marginTop: 12 }} numberOfLines={1}>{e.name}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, color: conf.color }}>{fmtNum(e.points)}</Text>
    </View>
  );
}

function Row({ e }: { e: LeaderboardEntry }) {
  const { c, accent, fonts } = useTheme();
  const me = !!e.isMe;
  const fg = me ? accent.onAccent : c.text;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, backgroundColor: me ? accent.main : c.card }}>
      <Text style={{ width: 38, fontFamily: fonts.display, fontSize: 20, color: fg }}>{e.rank}</Text>
      {e.trend === 'same' ? <View style={{ width: 8 }} /> : <TriangleIcon dir={e.trend} color={me ? '#fff' : e.trend === 'up' ? c.up : c.down} />}
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: me ? 'rgba(255,255,255,0.2)' : c.cardMuted }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: fg }}>{e.initials}</Text>
      </View>
      <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: fg }} numberOfLines={1}>{e.name}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 20, color: fg }}>{fmtNum(e.points)}</Text>
    </Card>
  );
}
