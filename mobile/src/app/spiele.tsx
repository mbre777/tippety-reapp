import { Fragment } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { DayStrip } from '@/components/DayStrip';
import { MatchCard } from '@/components/MatchCard';
import { Screen } from '@/components/Screen';
import { MOCK_TODAY, repo, useQuery, type Match } from '@/data';
import { timeOf } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';

/** Vertikale Zeitleiste: Zeit-Labels stehen als Trenner ZWISCHEN den Cards. */
export default function Spiele() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { sport } = useSport();
  const { c, accent, fonts } = useTheme();
  const day = params.day ?? MOCK_TODAY;
  const setDay = (d: string) => router.setParams({ day: d });
  const matches = useQuery(() => repo.getMatchesByDay(sport, day), [sport, day]).data ?? [];

  const slots = matches.reduce<{ time: string; items: Match[] }[]>((acc, m) => {
    const time = timeOf(m.kickoff);
    const last = acc[acc.length - 1];
    if (last && last.time === time) last.items.push(m);
    else acc.push({ time, items: [m] });
    return acc;
  }, []);

  return (
    <Screen header={<AppHeader><DayStrip today={MOCK_TODAY} selected={day} onSelect={setDay} /></AppHeader>}>
      {slots.length === 0 ? (
        <Text style={{ fontFamily: fonts.bodySemi, color: c.textMuted, textAlign: 'center', marginTop: 40 }}>Keine Spiele an diesem Tag.</Text>
      ) : null}
      {slots.map((s, i) => (
        <Fragment key={s.time}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: i === 0 ? 0 : 14, marginBottom: 10 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: accent.main }}>{s.time}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.textMuted }}>
              {s.items.length} {s.items.length === 1 ? 'Spiel' : 'Spiele'}
            </Text>
          </View>
          <View style={{ gap: 12 }}>
            {s.items.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </View>
        </Fragment>
      ))}
    </Screen>
  );
}
