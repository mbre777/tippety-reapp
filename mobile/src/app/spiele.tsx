import { Fragment, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { MatchCard } from '@/components/MatchCard';
import { RoundChips } from '@/components/RoundChips';
import { Screen } from '@/components/Screen';
import { MOCK_TODAY, leagueName, repo, useQuery, useTipsVersion, type Match } from '@/data';
import { timeOf } from '@/lib/date';
import { matchState } from '@/lib/matchState';
import { groupRounds, longDates } from '@/lib/rounds';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
/** Saisonlänge für leere Chips (Design: Fußball ST 1–34, Eishockey Runde 1–52) */
const TOTAL = { football: 34, hockey: 52 } as const;
const localDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 05 Spiele – Spieltag-/Runden-Chips, darunter Zeitleiste nach Tagen mit Zeit-Labels. */
export default function Spiele() {
  const params = useLocalSearchParams<{ league?: string; round?: string }>();
  const { sport } = useSport();
  const { ids, leagues: sportLeagues, favorite } = useMyLeagues(sport);
  const { c, accent, fonts } = useTheme();
  const version = useTipsVersion();
  const leagueId = (params.league && sportLeagues.some((l) => l.id === params.league) ? params.league : undefined) ?? favorite?.id ?? ids[0];
  const all = useQuery(() => (leagueId ? repo.getLeagueMatches(leagueId) : Promise.resolve([] as Match[])), [leagueId, version]).data;
  const [now] = useState(() => Date.now());
  const rounds = useMemo(() => (all ? groupRounds(all, sport, now, TOTAL[sport]) : []), [all, sport, now]);
  const current = rounds.find((r) => r.phase === 'current');
  const round = rounds.find((r) => r.key === params.round) ?? current ?? rounds[0];
  const select = (key: string) => router.setParams({ round: key });
  const nextLeague = () => {
    if (sportLeagues.length < 2) return;
    const i = sportLeagues.findIndex((l) => l.id === leagueId);
    router.setParams({ league: sportLeagues[(i + 1) % sportLeagues.length].id, round: undefined as unknown as string });
  };

  const days = useMemo(() => {
    const out: { day: string; slots: { time: string; items: Match[] }[]; items: Match[] }[] = [];
    for (const m of round?.matches ?? []) {
      const day = localDay(m.kickoff);
      let d = out[out.length - 1];
      if (!d || d.day !== day) out.push((d = { day, slots: [], items: [] }));
      d.items.push(m);
      const t = timeOf(m.kickoff);
      const s = d.slots[d.slots.length - 1];
      if (s && s.time === t) s.items.push(m);
      else d.slots.push({ time: t, items: [m] });
    }
    return out;
  }, [round]);

  const past = round?.phase === 'past';
  return (
    <Screen header={<AppHeader hidePill height={150}><RoundChips rounds={rounds} selected={round?.key} onSelect={select} /></AppHeader>}>
      {round ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginHorizontal: 2 }}>
          <View style={{ flex: 1 }}>
            <Text testID="round-title" style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: c.text }}>{round.title}</Text>
            <Pressable onPress={nextLeague} disabled={sportLeagues.length < 2} accessibilityRole="button" accessibilityLabel="Liga wechseln">
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: c.textMuted }} numberOfLines={1}>
                {leagueName(leagueId)}{round.from ? ` · ${longDates(round.from, round.to)}` : ''}{sportLeagues.length > 1 ? '  ⇄' : ''}
              </Text>
            </Pressable>
          </View>
          {round.total ? (
            past ? (
              <View style={{ backgroundColor: accent.soft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12.5, color: accent.main }}>+{round.points} Pkt · {round.tipped}/{round.total}</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12.5, color: c.text }}>{round.tipped}/{round.total} <Text style={{ color: c.textMuted }}>getippt</Text></Text>
                <View style={{ width: 84, height: 5, borderRadius: 3, backgroundColor: c.border, marginTop: 5, overflow: 'hidden' }}>
                  <View style={{ width: `${(round.tipped / round.total) * 100}%`, height: 5, backgroundColor: accent.main }} />
                </View>
              </View>
            )
          ) : null}
        </View>
      ) : null}
      {!round || round.total === 0 ? (
        <Text style={{ fontFamily: fonts.bodySemi, color: c.textMuted, textAlign: 'center', marginTop: 40 }}>Für diese Runde sind noch keine Spiele angesetzt.</Text>
      ) : null}
      {days.map((d) => {
        const dt = new Date(`${d.day}T12:00:00`);
        const open = d.items.filter((m) => !m.myTip && matchState(m).phase === 'upcoming').length;
        const allDone = d.items.every((m) => { const p = matchState(m).phase; return p === 'finished' || p === 'off'; });
        const allTipped = d.items.every((m) => !!m.myTip);
        return (
          <View key={d.day} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10 }}>
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: c.text }}>
                {WD[dt.getDay()]}, {dt.getDate()}.{dt.getMonth() + 1}.{d.day === MOCK_TODAY ? ' · Heute' : ''}
              </Text>
              {open ? (
                <View style={{ backgroundColor: c.warningBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: c.warning }}>{open} offen</Text>
                </View>
              ) : allTipped || allDone ? (
                <View style={{ backgroundColor: accent.soft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: accent.main }}>{allTipped ? '✓ alle getippt' : 'beendet'}</Text>
                </View>
              ) : null}
            </View>
            {d.slots.map((s) => (
              <Fragment key={s.time}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 20, color: accent.main }}>{s.time}</Text>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.textMuted }}>· {s.items.length} {s.items.length === 1 ? 'Spiel' : 'Spiele'}</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: c.border, marginLeft: 4 }} />
                </View>
                <View style={{ gap: 12, marginBottom: 12 }}>
                  {s.items.map((m) => <MatchCard key={m.id} match={m} />)}
                </View>
              </Fragment>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
