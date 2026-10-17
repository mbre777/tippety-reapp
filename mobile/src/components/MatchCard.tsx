import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { leagueName, type Match } from '@/data';
import { calcPoints } from '@/lib/scoring';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './Card';
import { Crest } from './Crest';
import { ScoreBox } from './ScoreBox';

const DEC = { regular: '', overtime: ' n.V.', shootout: ' n.P.' } as const;

/** Ergebniszeile: Eishockey zeigt Wertung nach 60 Min + Endstand mit n.V./n.P. */
export function resultLine(m: Match) {
  if (!m.result) return '';
  const fin = m.finalResult ?? m.result;
  if (m.sport === 'hockey' && m.decision && m.decision !== 'regular') return `Nach 60 Min ${m.result.home}:${m.result.away} · Endstand ${fin.home}:${fin.away}${DEC[m.decision]}`;
  return `Endstand ${fin.home}:${fin.away}`;
}

export function MatchCard({ match }: { match: Match }) {
  const { c, accent, fonts } = useTheme();
  const tipped = !!match.myTip;
  const finished = match.status === 'finished';
  const open = match.status === 'scheduled' && !tipped;
  const off = match.status === 'postponed' ? 'VERSCHOBEN' : match.status === 'cancelled' ? 'ABGESAGT' : match.status === 'live' ? 'LIVE' : null;
  const statusLabel = off ?? (finished ? 'BEENDET' : tipped ? '✓ GETIPPT' : '● OFFEN');
  const statusColor = off ? c.down : finished ? c.textMuted : tipped ? accent.main : c.warning;
  const pts = finished && match.result && match.myTip ? calcPoints(match.myTip, match.result) : null;
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
                <Crest team={t} size={24} />
                <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 20, color: c.text }} numberOfLines={1}>{t.shortName ?? t.name}</Text>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border }}>
            <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 13, color: c.textMuted }} numberOfLines={1}>{resultLine(match)}</Text>
            {pts !== null ? (
              <View style={{ backgroundColor: pts ? accent.soft : c.cardMuted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12.5, color: pts ? accent.main : c.textMuted }}>+{pts} Pkt</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
