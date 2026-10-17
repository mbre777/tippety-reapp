import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { leagueName, type Match } from '@/data';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './Card';
import { Crest } from './Crest';
import { ScoreBox } from './ScoreBox';

export function MatchCard({ match }: { match: Match }) {
  const { c, accent, fonts } = useTheme();
  const tipped = !!match.myTip;
  const finished = match.status === 'finished';
  const statusLabel = finished ? 'BEENDET' : tipped ? '✓ GETIPPT' : 'OFFEN';
  const statusColor = finished ? c.textMuted : tipped ? accent.main : c.warning;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${match.home.name} gegen ${match.away.name}`} onPress={() => router.push(`/spiel/${match.id}`)}>
      <Card style={{ paddingVertical: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 1.4, color: c.textMuted }} numberOfLines={1}>
            {leagueName(match.leagueId).toUpperCase()}
          </Text>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 0.6, color: statusColor }}>{statusLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 8, paddingRight: 8 }}>
            {[match.home, match.away].map((t) => (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Crest team={t} size={26} />
                <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 20, color: c.text }} numberOfLines={1}>
                  {t.name}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ScoreBox value={match.myTip?.home} />
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: c.textMuted }}>:</Text>
            <ScoreBox value={match.myTip?.away} />
          </View>
        </View>
        {finished && match.result ? (
          <Text style={{ marginTop: 8, fontFamily: fonts.bodyBold, fontSize: 12, color: c.textMuted }}>
            Endstand {match.result.home}:{match.result.away}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}
