import { Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { setSession, useSession } from '@/auth/session';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { BellIcon, ChevronRight, LogoutIcon, PencilIcon, ShieldIcon, StarIcon, XIcon } from '@/components/Icons';
import { LeagueBadge } from '@/components/LeagueBadge';
import { Screen } from '@/components/Screen';
import { auth, profileApi, repo, useQuery } from '@/data';
import { initialsOf } from '@/lib/initials';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

const MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

/** 09 Profil & Einstellungen */
export default function Profil() {
  const { profile } = useSession();
  const { sport } = useSport();
  const { all, favorite } = useMyLeagues(sport);
  const { c, accent, fonts } = useTheme();
  const stats = useQuery(() => (favorite ? repo.getMyStats(favorite.id) : Promise.resolve(undefined)), [favorite?.id]).data;
  if (!profile) return null;
  const joined = new Date(profile.joinedAt);

  const setFav = async (id: string) => setSession(await profileApi.setLeagues(profile.leagueIds, id));
  const remove = async (id: string) => {
    if (profile.leagueIds.length <= 1) return; // mind. 1 Liga
    const ids = profile.leagueIds.filter((x) => x !== id);
    const fav = profile.favoriteLeagueId === id ? ids[0] : profile.favoriteLeagueId;
    setSession(await profileApi.setLeagues(ids, fav));
  };
  const logout = async () => {
    await auth.signOut();
    setSession(null);
    router.replace('/login');
  };

  return (
    <Screen header={<AppHeader height={74} back title="Profil & Einstellungen" hidePill hideAvatar />}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 }}>
        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: accent.soft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 22, color: accent.main }}>{initialsOf(profile.nickname)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11.5, letterSpacing: 1.6, color: c.textMuted }}>NICKNAME</Text>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 21, color: c.text }}>@{profile.nickname}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: c.textMuted }}>Dabei seit {MONTHS[joined.getMonth()]} {joined.getFullYear()}{stats ? ` · Rang #${stats.rank}` : ''}</Text>
        </View>
        <Pressable testID="edit-nick" accessibilityRole="button" accessibilityLabel="Nickname ändern" onPress={() => router.push({ pathname: '/onboarding/nickname', params: { edit: '1' } })}
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.cardMuted, alignItems: 'center', justifyContent: 'center' }}>
          <PencilIcon color={c.textMuted} size={18} />
        </Pressable>
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 1.6, color: c.textMuted }}>MEINE LIGEN · {all.length}</Text>
        <Pressable onPress={() => router.push({ pathname: '/onboarding/ligen', params: { edit: '1' } })}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: accent.main }}>+ Liga hinzufügen</Text>
        </Pressable>
      </View>
      <Card style={{ padding: 0 }}>
        {all.map((l, i) => {
          const isFav = profile.favoriteLeagueId === l.id;
          return (
            <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
              <LeagueBadge league={l} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16.5, color: c.text }}>{l.name}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: c.textMuted }}>{l.flag} {l.country}{isFav ? ' · Lieblingsliga' : ''}</Text>
              </View>
              <Pressable onPress={() => setFav(l.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${l.name} als Lieblingsliga`}>
                <StarIcon color={isFav ? '#F2A516' : c.textFaint} filled={isFav} size={24} />
              </Pressable>
              <Pressable onPress={() => remove(l.id)} disabled={all.length <= 1} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${l.name} entfernen`} style={{ marginLeft: 8, opacity: all.length <= 1 ? 0.3 : 1 }}>
                <XIcon color={c.textMuted} size={18} />
              </Pressable>
            </View>
          );
        })}
      </Card>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.textMuted, marginTop: 10 }}><Text style={{ color: '#F2A516' }}>★</Text> Lieblingsliga erscheint im Header und ist in der Rangliste vorausgewählt.</Text>

      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 1.6, color: c.textMuted, marginTop: 24, marginBottom: 10 }}>APP</Text>
      <Card style={{ padding: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
          <BellIcon color={c.textMuted} size={20} />
          <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: c.text }}>Erinnerung vor Tippschluss</Text>
          <Switch value={profile.reminders} onValueChange={async (v) => setSession(await profileApi.setReminders(v))} trackColor={{ true: accent.main, false: c.dashed }} thumbColor="#fff" />
        </View>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: 1, borderTopColor: c.border }}>
          <ShieldIcon color={c.textMuted} size={20} />
          <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: c.text }}>Datenschutz</Text>
          <ChevronRight color={c.textFaint} />
        </Pressable>
      </Card>

      <Pressable testID="logout" onPress={logout} accessibilityRole="button" style={{ marginTop: 18, height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: '#F3C7C7', backgroundColor: c.card, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
        <LogoutIcon color={c.down} size={20} />
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: c.down }}>Abmelden</Text>
      </Pressable>
      <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: c.textMuted, textAlign: 'center', marginTop: 12 }}>
        Angemeldet mit {profile.provider === 'apple' ? 'Apple' : 'Google'} · Tippety 1.0
      </Text>
    </Screen>
  );
}
