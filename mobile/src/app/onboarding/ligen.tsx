import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { setSession, useSession } from '@/auth/session';
import { Button } from '@/components/Button';
import { CheckIcon, StarIcon } from '@/components/Icons';
import { LeagueBadge } from '@/components/LeagueBadge';
import { OnboardingFrame } from '@/components/OnboardingFrame';
import { SportGlyph } from '@/components/SportIcons';
import { allLeagues, profileApi, type League, type Sport } from '@/data';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';

const SPORTS: { id: Sport; label: string }[] = [
  { id: 'football', label: 'Fußball' },
  { id: 'hockey', label: 'Eishockey' },
];

/** 03 Ligen – mind. 1 Liga, Lieblingsliga je Sportart per Stern. */
export default function Ligen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const { profile } = useSession();
  const { setSport } = useSport();
  const { c, accent, fonts, shadow } = useTheme();
  // Vorauswahl: erste verfügbare Fußball-Liga (ID-unabhängig: Mock-Slug oder Supabase-UUID)
  const firstLeague = allLeagues.find((l) => l.available && l.sport === 'football')?.id ?? allLeagues.find((l) => l.available)?.id;
  const [sel, setSel] = useState<string[]>(profile?.leagueIds.length ? profile.leagueIds : firstLeague ? [firstLeague] : []);
  const [fav, setFav] = useState<string | undefined>(profile?.leagueIds.length ? profile.favoriteLeagueId : firstLeague);
  const [saving, setSaving] = useState(false);

  const toggle = (l: League) => {
    if (!l.available) return;
    const on = sel.includes(l.id);
    const next = on ? sel.filter((x) => x !== l.id) : [...sel, l.id];
    setSel(next);
    if (on && fav === l.id) setFav(next[0]);
    if (!on && !fav) setFav(l.id);
  };
  const star = (l: League) => {
    if (!l.available) return;
    if (!sel.includes(l.id)) setSel([...sel, l.id]);
    setFav(l.id);
  };

  const save = async () => {
    if (!sel.length) return;
    setSaving(true);
    try {
      const favorite = fav && sel.includes(fav) ? fav : sel[0];
      const p = await profileApi.setLeagues(sel, favorite);
      const favSport = allLeagues.find((l) => l.id === favorite)?.sport;
      if (!isEdit && favSport) setSport(favSport);
      setSession(p);
      if (isEdit) router.back();
      else router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  const n = sel.length;
  return (
    <OnboardingFrame
      step={isEdit ? undefined : 2}
      of={isEdit ? undefined : 2}
      back={isEdit}
      title={isEdit ? 'Deine Ligen' : 'Wähle deine Ligen'}
      subtitle={<>Du siehst nur Spiele und Ranglisten deiner Ligen. Mit <Text style={{ color: '#F2A516' }}>★</Text> markierst du deine Lieblingsliga.</>}
      footer={
        <View>
          <Button testID="leagues-next" label={n === 0 ? 'Mindestens eine Liga wählen' : isEdit ? `Speichern · ${n} ${n === 1 ? 'Liga' : 'Ligen'}` : `Los geht's · ${n} ${n === 1 ? 'Liga' : 'Ligen'}`} variant={n ? 'primary' : 'disabled'} loading={saving} onPress={save} height={62} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: c.textMuted, textAlign: 'center', marginTop: 10 }}>Mindestens eine Liga · jederzeit änderbar</Text>
        </View>
      }
    >
      {SPORTS.map((s) => {
        const ls = allLeagues.filter((l) => l.sport === s.id);
        const avail = ls.filter((l) => l.available);
        return (
          <View key={s.id} style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <SportGlyph sport={s.id} size={24} />
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: c.text }}>{s.label}</Text>
              </View>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.textMuted }}>{avail.filter((l) => sel.includes(l.id)).length} von {avail.length} gewählt</Text>
            </View>
            <View style={[{ backgroundColor: c.card, borderRadius: 20 }, shadow.card]}>
              {ls.map((l, i) => {
                const on = sel.includes(l.id);
                const isFav = on && fav === l.id;
                return (
                  <Pressable key={l.id} testID={`league-${l.id}`} onPress={() => toggle(l)} disabled={!l.available} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !l.available }} accessibilityLabel={l.name}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
                    <LeagueBadge league={l} faded={!on} />
                    <View style={{ flex: 1, opacity: on ? 1 : 0.55 }}>
                      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16.5, color: c.text }}>{l.name}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: c.textMuted }}>
                        {l.flag} {l.country}{isFav ? ' · Lieblingsliga' : ''}{!l.available ? ' · bald verfügbar' : ''}
                      </Text>
                    </View>
                    {l.available ? (
                      <>
                        <Pressable testID={`star-${l.id}`} onPress={() => star(l)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${l.name} als Lieblingsliga`}>
                          <StarIcon color={isFav ? '#F2A516' : c.textFaint} filled={isFav} size={24} />
                        </Pressable>
                        <View style={{ width: 32, height: 32, borderRadius: 9, borderWidth: on ? 0 : 1.5, borderColor: c.dashed, backgroundColor: on ? accent.main : 'transparent', alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}>
                          {on ? <CheckIcon color="#fff" size={16} /> : null}
                        </View>
                      </>
                    ) : (
                      <View style={{ backgroundColor: c.cardMuted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11.5, color: c.textMuted }}>Bald</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </OnboardingFrame>
  );
}
