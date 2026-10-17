import { useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Crest } from '@/components/Crest';
import { DayStrip } from '@/components/DayStrip';
import { ChevronRight, TrophyIcon, UsersIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { MOCK_TODAY, leagueName, repo, useQuery, type Match, type Team } from '@/data';
import { fmtNum, shortDate, timeOf } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';

export default function Home() {
  const { sport } = useSport();
  const { c, accent, fonts } = useTheme();
  const stats = useQuery(() => repo.getMyStats(sport), [sport]).data;
  const tops = useQuery(() => repo.getTopMatches(sport, 5), [sport]).data ?? [];
  const groups = useQuery(() => repo.getGroups(sport), [sport]).data ?? [];

  const tiles = stats
    ? [
        { label: 'Punkte', sub: 'Saison', value: fmtNum(stats.points), bg: accent.soft, fg: accent.main },
        { label: 'Trefferquote', sub: `${stats.hits} / ${stats.tips}`, value: `${Math.round((stats.hits / stats.tips) * 100)} %`, bg: c.warningBg, fg: c.warning },
        { label: 'Rang', sub: 'Gesamt', value: `#${stats.rank}`, bg: c.violetBg, fg: c.violet },
      ]
    : [];

  return (
    <Screen
      header={
        <AppHeader>
          <DayStrip today={MOCK_TODAY} selected={MOCK_TODAY} onSelect={(d) => router.navigate({ pathname: '/spiele', params: { day: d } })} />
        </AppHeader>
      }
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {tiles.map((t) => (
          <View key={t.label} style={{ flex: 1, backgroundColor: t.bg, borderRadius: 16, padding: 12 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: c.text }} numberOfLines={1}>{t.label}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: c.textMuted }}>{t.sub}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, color: t.fg, marginTop: 8 }} numberOfLines={1} adjustsFontSizeToFit>{t.value}</Text>
          </View>
        ))}
      </View>

      <TopCarousel matches={tops} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 }}>
        <Txt variant="section">Challenges & Gruppen</Txt>
        <Pressable onPress={() => router.navigate('/gruppen')}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: accent.main }}>Alle</Text>
        </Pressable>
      </View>
      <View style={{ gap: 10 }}>
        {groups.slice(0, 2).map((g, i) => (
          <Pressable key={g.id} onPress={() => router.navigate('/gruppen')}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: i === 0 ? accent.soft : c.warningBg }}>
                {g.kind === 'challenge' ? <TrophyIcon color={accent.main} size={22} /> : <UsersIcon color={c.warning} size={22} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16, color: c.text }}>{g.name}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.textMuted }} numberOfLines={1}>
                  {g.subtitle ?? `Platz ${g.myRank} von ${g.members} · +${g.weekDelta} diese Woche`}
                </Text>
              </View>
              <ChevronRight color={c.textFaint} />
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function TeamCol({ team }: { team: Team }) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Crest team={team} size={56} />
      <Text style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 22, color: c.text, textAlign: 'center', marginTop: 6 }} numberOfLines={2}>
        {team.name}
      </Text>
    </View>
  );
}

const GAP = 10;

/** Topspiel-Rotator: horizontal, Snap pro Card, nächste Card angeschnitten, Punkt-Indikator. */
function TopCarousel({ matches }: { matches: Match[] }) {
  const { c, accent } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const cardW = width - 36 - 26;
  if (matches.length === 0) return null;
  return (
    <View style={{ marginTop: 16 }}>
      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        style={{ marginHorizontal: -18 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 6, gap: GAP }}
        onScroll={(e) => setIndex(Math.max(0, Math.min(matches.length - 1, Math.round(e.nativeEvent.contentOffset.x / (cardW + GAP)))))}
        scrollEventThrottle={32}
        renderItem={({ item }) => <TopCard match={item} width={cardW} />}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }} accessibilityLabel={`Topspiel ${index + 1} von ${matches.length}`}>
        {matches.map((m, i) => (
          <View key={m.id} style={{ height: 6, width: i === index ? 18 : 6, borderRadius: 3, backgroundColor: i === index ? accent.main : c.dashed }} />
        ))}
      </View>
    </View>
  );
}

function TopCard({ match: top, width }: { match: Match; width: number }) {
  const { c, accent, fonts } = useTheme();
  return (
    <Pressable onPress={() => router.push(`/spiel/${top.id}`)} accessibilityRole="button" accessibilityLabel={`Topspiel ${top.home.name} gegen ${top.away.name}`} style={{ width }}>
      <Card accentTop style={{ paddingVertical: 18, height: 210 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: accent.soft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: accent.main }}>Topspiel</Text>
          </View>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: c.textMuted }}>
            {shortDate(top.kickoff)} · {timeOf(top.kickoff)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
          <TeamCol team={top.home} />
          <View style={{ width: 116, alignItems: 'center' }}>
            <Txt variant="overline" numberOfLines={1} adjustsFontSizeToFit style={{ letterSpacing: 0.8 }}>{leagueName(top.leagueId)}</Txt>
            <Text style={{ fontFamily: fonts.display, fontSize: 36, color: c.text }}>
              {top.myTip ? `${top.myTip.home} : ${top.myTip.away}` : '– : –'}
            </Text>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: accent.main }}>{top.myTip ? 'Dein Tipp' : 'Jetzt tippen'}</Text>
          </View>
          <TeamCol team={top.away} />
        </View>
      </Card>
    </Pressable>
  );
}
