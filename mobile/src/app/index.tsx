import { useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Crest } from '@/components/Crest';
import { ChevronRight, UsersIcon } from '@/components/Icons';
import { ScoreBox } from '@/components/ScoreBox';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { repo, useQuery, useTipsVersion, type Match, type Team } from '@/data';
import { fmtNum, shortDate, timeOf } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

/** 04 Home */
export default function Home() {
  const { sport } = useSport();
  const { ids, favorite } = useMyLeagues(sport);
  const { c, accent, fonts } = useTheme();
  const version = useTipsVersion();
  const stats = useQuery(() => (favorite ? repo.getMyStats(favorite.id) : Promise.resolve(undefined)), [favorite?.id]).data;
  const topsRaw = useQuery(() => repo.getTopMatches(sport, ids, 5), [sport, ids, version]).data ?? [];
  // Lieblingsliga zuerst
  const tops = [...topsRaw].sort((a, b) => Number(b.leagueId === favorite?.id) - Number(a.leagueId === favorite?.id));
  const groups = useQuery(() => repo.getGroups(ids), [ids]).data ?? [];

  const tiles = stats
    ? [
        { label: 'Punkte', sub: 'Saison 26/27', value: fmtNum(stats.points), bg: accent.soft, fg: accent.main },
        { label: 'Trefferquote', sub: `${stats.hits} von ${stats.tips}`, value: `${stats.tips ? Math.round((stats.hits / stats.tips) * 100) : 0} %`, bg: c.warningBg, fg: c.warning },
        { label: 'Rang', sub: favorite?.name ?? '', value: `#${stats.rank}`, bg: c.violetBg, fg: c.violet },
      ]
    : [];

  return (
    <Screen header={<AppHeader height={74} />}>
      <TopCarousel matches={tops} />

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        {tiles.map((t) => (
          <View key={t.label} style={{ flex: 1, backgroundColor: t.bg, borderRadius: 16, padding: 13 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: c.text }} numberOfLines={1}>{t.label}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: c.textMuted }} numberOfLines={1}>{t.sub}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: t.fg, marginTop: 6 }} numberOfLines={1} adjustsFontSizeToFit>{t.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 }}>
        <Txt variant="section">Deine Gruppen</Txt>
        <Pressable onPress={() => router.navigate('/gruppen')}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: accent.main }}>Alle</Text>
        </Pressable>
      </View>
      <View style={{ gap: 10 }}>
        {groups.slice(0, 2).map((g, i) => {
          const tone = i === 0 ? { bg: c.warningBg, fg: c.warning } : { bg: accent.soft, fg: accent.main };
          return (
            <Pressable key={g.id} onPress={() => router.navigate('/gruppen')}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: tone.bg }}>
                  <UsersIcon color={tone.fg} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16, color: c.text }}>{g.name}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.textMuted }} numberOfLines={1}>{fmtNum(g.members)} Mitglieder · +{g.weekDelta} diese Woche</Text>
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 21, color: tone.fg }}>Platz {g.myRank}</Text>
                <ChevronRight color={c.textFaint} />
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function TeamCol({ team }: { team: Team }) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Crest team={team} size={54} />
      <Text style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 23, color: c.text, textAlign: 'center', marginTop: 8 }} numberOfLines={2}>
        {team.shortName ?? team.name}
      </Text>
    </View>
  );
}

const GAP = 12;

/** Topspiel-Rotator: horizontal, Snap pro Card, nächste Card angeschnitten, Punkt-Indikator. */
function TopCarousel({ matches }: { matches: Match[] }) {
  const { c, accent } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const cardW = width - 36 - 20;
  if (matches.length === 0) return null;
  return (
    <View>
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
        {matches.slice(0, 3).map((m, i) => (
          <View key={m.id} style={{ height: 6, width: i === Math.min(index, 2) ? 18 : 6, borderRadius: 3, backgroundColor: i === Math.min(index, 2) ? accent.main : c.dashed }} />
        ))}
      </View>
    </View>
  );
}

function TopCard({ match: top, width }: { match: Match; width: number }) {
  const { c, accent, fonts } = useTheme();
  return (
    <Pressable onPress={() => router.push(`/spiel/${top.id}`)} accessibilityRole="button" accessibilityLabel={`Topspiel ${top.home.name} gegen ${top.away.name}`} style={{ width }}>
      <Card style={{ paddingVertical: 18, height: 200 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: accent.soft, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: accent.main }}>Topspiel</Text>
          </View>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: c.textMuted }}>
            {shortDate(top.kickoff)}. · {timeOf(top.kickoff)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <TeamCol team={top.home} />
          <View style={{ width: 110, alignItems: 'center' }}>
            <Txt variant="overline" numberOfLines={1} adjustsFontSizeToFit style={{ letterSpacing: 1.4 }}>{top.round}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
              <ScoreBox value={top.myTip?.home} size={36} />
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: c.textMuted }}>:</Text>
              <ScoreBox value={top.myTip?.away} size={36} />
            </View>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: top.myTip ? accent.main : c.warning }}>{top.myTip ? '✓ Dein Tipp' : 'Jetzt tippen'}</Text>
          </View>
          <TeamCol team={top.away} />
        </View>
      </Card>
    </Pressable>
  );
}
