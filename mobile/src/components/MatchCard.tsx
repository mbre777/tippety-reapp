import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { leagueName, type Match } from '@/data';
import { fmtScore, matchState } from '@/lib/matchState';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './Card';
import { TeamBadge } from './TeamBadge';
import { ScoreBox } from './ScoreBox';

export function MatchCard({ match }: { match: Match }) {
  const { c, accent, fonts } = useTheme();
  const st = matchState(match);
  const tipped = !!match.myTip;
  const finished = st.phase === 'finished';
  const live = st.phase === 'live';
  const open = match.status === 'scheduled' && !tipped;
  const off = match.status === 'postponed' ? 'VERSCHOBEN' : match.status === 'cancelled' ? 'ABGESAGT' : live ? `LIVE ${st.statusText}` : null;
  const statusLabel = off ?? (finished ? 'BEENDET' : tipped ? '✓ GETIPPT' : '● OFFEN');
  const statusColor = off ? c.down : finished ? c.textMuted : tipped ? accent.main : c.warning;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${match.home.name} gegen ${match.away.name}`} onPress={() => router.push(`/spiel/${match.id}`)}>
      <Card style={{ paddingVertical: 14, borderLeftWidth: open ? 3 : 0, borderLeftColor: c.warning }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 1.4, color: c.textMuted }} numberOfLines={1}>
            {leagueName(match.leagueId).toUpperCase()}
          </Text>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 0.6, color: statusColor }}>{statusLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 10, paddingRight: 8 }}>
            {[match.home, match.away].map((t) => (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TeamBadge team={t} size={24} />
                <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 20, color: c.text }} numberOfLines={1}>{t.shortName ?? t.name}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Live/Beendet: Spielstand groß · sonst eigener Tipp */}
            <ScoreBox value={st.score ? st.score.home : match.myTip?.home} variant={live ? 'live' : finished ? 'result' : 'tip'} />
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: c.textMuted }}>:</Text>
            <View>
              <ScoreBox value={st.score ? st.score.away : match.myTip?.away} variant={live ? 'live' : finished ? 'result' : 'tip'} />
              {st.decisionLabel ? (
                <Text style={{ position: 'absolute', right: -2, bottom: -14, fontFamily: fonts.bodyHeavy, fontSize: 11, color: c.textMuted }}>{st.decisionLabel}</Text>
              ) : null}
            </View>
          </View>
        </View>
        {finished || live ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border }}>
            <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 13, color: c.textMuted }} numberOfLines={1}>
              {st.tip ? `Dein Tipp ${fmtScore(st.tip)}` : 'Kein Tipp'}
              {match.sport === 'hockey' && finished && st.decisionLabel && st.scoring ? ` · nach 60 Min ${fmtScore(st.scoring)}` : ''}
            </Text>
            {st.points !== null ? (
              <View style={{ backgroundColor: st.points ? accent.soft : c.cardMuted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12.5, color: st.points ? accent.main : c.textMuted }}>{st.points ? `+${st.points}` : '0'} Pkt</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
