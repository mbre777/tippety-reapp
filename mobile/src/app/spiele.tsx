import { Fragment } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { DayStrip } from '@/components/DayStrip';
import { MatchCard } from '@/components/MatchCard';
import { Screen } from '@/components/Screen';
import { MOCK_TODAY, repo, useQuery, useTipsVersion, type Match } from '@/data';
import { dayParts, timeOf } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MO = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/** 05 Spiele – vertikale Zeitleiste je Anstoßzeit. */
export default function Spiele() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { sport } = useSport();
  const { ids } = useMyLeagues(sport);
  const { c, accent, fonts } = useTheme();
  const version = useTipsVersion();
  const day = params.day ?? MOCK_TODAY;
  const setDay = (d: string) => router.setParams({ day: d });
  const matches = useQuery(() => repo.getMatchesByDay(sport, day, ids), [sport, day, ids, version]).data ?? [];
  const open = matches.filter((m) => !m.myTip && m.status === 'scheduled').length;
  const d = new Date(`${day}T12:00:00Z`);
  const p = dayParts(day);

  const slots = matches.reduce<{ time: string; items: Match[] }[]>((acc, m) => {
    const time = timeOf(m.kickoff);
    const last = acc[acc.length - 1];
    if (last && last.time === time) last.items.push(m);
    else acc.push({ time, items: [m] });
    return acc;
  }, []);

  return (
    <Screen header={<AppHeader hidePill height={128}><DayStrip today={MOCK_TODAY} selected={day} onSelect={setDay} /></AppHeader>}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 18, color: c.text }}>{WD[d.getUTCDay()]}, {p.dayNum}. {MO[p.month - 1]}</Text>
        {open ? (
          <View style={{ backgroundColor: c.warningBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: c.warning }}>{open} offen</Text>
          </View>
        ) : null}
      </View>
      {slots.length === 0 ? (
        <Text style={{ fontFamily: fonts.bodySemi, color: c.textMuted, textAlign: 'center', marginTop: 40 }}>Keine Spiele deiner Ligen an diesem Tag.</Text>
      ) : null}
      <View>
        {slots.length ? <View style={{ position: 'absolute', left: 6, top: 12, bottom: 0, width: 2, backgroundColor: accent.soft }} /> : null}
        {slots.map((s, i) => (
          <Fragment key={s.time}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: i === 0 ? 0 : 14, marginBottom: 10 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: accent.main, backgroundColor: c.bg }} />
              <Text style={{ fontFamily: fonts.display, fontSize: 21, color: accent.main }}>{s.time}</Text>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.textMuted }}>· {s.items.length} {s.items.length === 1 ? 'Spiel' : 'Spiele'}</Text>
            </View>
            <View style={{ gap: 12, marginLeft: 22 }}>
              {s.items.map((m) => <MatchCard key={m.id} match={m} />)}
            </View>
          </Fragment>
        ))}
      </View>
    </Screen>
  );
}
