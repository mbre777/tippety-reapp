import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CheckIcon } from '@/components/Icons';
import { TeamBadge } from '@/components/TeamBadge';
import { Screen } from '@/components/Screen';
import { MOCK_TODAY, leagueName, repo, useQuery, useTipsVersion } from '@/data';
import { relDay, timeOf } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

/** 06 „Alle getippt“ – Zusammenfassung des Spieltags. */
export default function Fertig() {
  const { league } = useLocalSearchParams<{ league?: string }>();
  const { sport } = useSport();
  const { favorite } = useMyLeagues(sport);
  const leagueId = league ?? favorite?.id ?? '';
  const { c, accent, fonts } = useTheme();
  const version = useTipsVersion();
  const info = useQuery(() => repo.getRoundTips(leagueId), [leagueId, version]).data;
  const nextKick = info?.open[0] ?? (info?.tipped ?? []).find((m) => m.status === 'scheduled');
  const done = info ? info.tipped.length : 0;
  const total = info?.total ?? 0;
  const round = info?.round.replace('Runde', 'der Runde') ?? '';
  return (
    <Screen header={<AppHeader height={74} />}>
      <Card style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 22 }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: accent.soft, alignItems: 'center', justifyContent: 'center' }}>
          <CheckIcon color={accent.main} size={38} />
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 34, color: c.text, marginTop: 16 }}>{info?.open.length ? 'Fast fertig!' : 'Alle getippt!'}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: c.textMuted, textAlign: 'center', marginTop: 4 }}>
          Du hast {done === total ? 'alle ' : ''}{done}{done === total ? '' : ` von ${total}`} Spiele {round.startsWith('der') ? round : `vom ${round}`} getippt. Tippschluss ist jeweils bei Spielbeginn.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 18, alignSelf: 'stretch' }}>
          <View style={{ flex: 1, backgroundColor: accent.soft, borderRadius: 16, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: c.text }}>Getippt</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: c.textMuted }}>Spiele</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: accent.main, marginTop: 4 }}>{done}/{total}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c.warningBg, borderRadius: 16, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: c.text }}>Nächster Anpfiff</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: c.textMuted }}>{nextKick ? relDay(nextKick.kickoff.slice(0, 10), MOCK_TODAY) : '–'}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: c.warning, marginTop: 4 }}>{nextKick ? timeOf(nextKick.kickoff) : '–'}</Text>
          </View>
        </View>
      </Card>

      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 1.6, color: c.textMuted, marginTop: 22, marginBottom: 10 }}>DEINE TIPPS · {leagueName(leagueId).toUpperCase()}</Text>
      <View style={{ gap: 10 }}>
        {(info?.tipped ?? []).map((m) => (
          <Card key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
            <TeamBadge team={m.home} size={24} />
            <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 19, color: c.text }} numberOfLines={1}>{m.home.shortName ?? m.home.name} – {m.away.shortName ?? m.away.name}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 21, color: accent.main }}>{m.myTip?.home}:{m.myTip?.away}</Text>
          </Card>
        ))}
      </View>
      <Button label="Zur Rangliste" variant="outline" style={{ marginTop: 14 }} onPress={() => router.navigate({ pathname: '/rangliste', params: { league: leagueId } })} />
    </Screen>
  );
}
