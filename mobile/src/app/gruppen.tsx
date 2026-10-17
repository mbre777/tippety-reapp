import { Pressable, Text, View } from 'react-native';
import { AppHeader, HeaderTitle } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { ChevronRight, TrophyIcon, UsersIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { repo, useQuery } from '@/data';
import { fmtNum } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';

export default function Gruppen() {
  const { sport } = useSport();
  const { c, accent, fonts } = useTheme();
  const groups = useQuery(() => repo.getGroups(sport), [sport]).data ?? [];

  return (
    <Screen header={<AppHeader height={112}><HeaderTitle overline={`${groups.length} Gruppen`} title="Gruppen" /></AppHeader>}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable style={{ flex: 1, backgroundColor: accent.main, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }} accessibilityRole="button">
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 15, color: accent.onAccent }}>+ Gruppe erstellen</Text>
        </Pressable>
        <Pressable style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: accent.main }} accessibilityRole="button">
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 15, color: accent.main }}>Mit Code beitreten</Text>
        </Pressable>
      </View>

      <Txt variant="section" style={{ marginTop: 24, marginBottom: 12 }}>Deine Gruppen</Txt>
      <View style={{ gap: 10 }}>
        {groups.map((g) => {
          const challenge = g.kind === 'challenge';
          return (
            <Card key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: challenge ? accent.soft : c.cardMuted }}>
                {challenge ? <TrophyIcon color={accent.main} size={22} /> : <UsersIcon color={c.textMuted} size={22} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16, color: c.text }} numberOfLines={1}>{g.name}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.textMuted }} numberOfLines={1}>
                  {fmtNum(g.members)} Mitglieder · {challenge ? 'Öffentlich' : `Code ${g.inviteCode}`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 22, color: g.myRank <= 3 ? accent.main : c.text }}>#{g.myRank}</Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, color: c.up }}>+{g.weekDelta}</Text>
              </View>
              <ChevronRight color={c.textFaint} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
