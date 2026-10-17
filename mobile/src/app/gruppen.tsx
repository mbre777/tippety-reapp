import { useEffect, useRef, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { CheckIcon, InfoIcon, KeyIcon, PlusIcon } from '@/components/Icons';
import { InitialTile } from '@/components/LeagueBadge';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { leagueName, repo, useQuery, type Group } from '@/data';
import { CODE_LEN, formatCode, normalizeCode } from '@/lib/inviteCode';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

const tileText = (name: string) => name.split(/[\s-]+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

/** 08 Gruppen (+ erstellen, + mit Code beitreten) */
export default function Gruppen() {
  const params = useLocalSearchParams<{ sheet?: string }>();
  const { sport } = useSport();
  const { all, ids } = useMyLeagues(sport);
  const { c, accent, fonts } = useTheme();
  const [version, setVersion] = useState(0);
  const groups = useQuery(() => repo.getGroups(ids), [ids, version]).data ?? [];
  const [sheet, setSheet] = useState<'create' | 'join' | null>(params.sheet === 'create' || params.sheet === 'join' ? params.sheet : null);
  const [leaving, setLeaving] = useState<Group | null>(null);
  const myIds = all.map((l) => l.id);
  const tones = [{ bg: c.warningBg, fg: c.warning }, { bg: accent.soft, fg: accent.main }, { bg: c.violetBg, fg: c.violet }];

  return (
    <Screen header={<AppHeader height={74} hidePill />}>
      <Text style={{ fontFamily: fonts.display, fontSize: 36, color: c.text }}>Gruppen</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Button testID="group-create" label="Gruppe erstellen" icon={<PlusIcon color="#fff" />} onPress={() => setSheet('create')} style={{ flex: 1 }} height={56} fontSize={15} />
        <Button testID="group-join" label="Mit Code beitreten" variant="outline" icon={<KeyIcon color={accent.main} size={18} />} onPress={() => setSheet('join')} style={{ flex: 1.05 }} height={56} fontSize={15} />
      </View>

      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 1.6, color: c.textMuted, marginTop: 24, marginBottom: 12 }}>DEINE GRUPPEN · {groups.length}</Text>
      <View style={{ gap: 12 }}>
        {groups.map((g, i) => {
          const tone = tones[i % 3];
          const shown = g.leagueIds.filter((l) => myIds.includes(l)); // nicht gewählte Ligen erscheinen nirgends
          return (
            <Card key={g.id} style={{ paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <InitialTile text={tileText(g.name)} bg={tone.bg} fg={tone.fg} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: c.text }} numberOfLines={1}>{g.name}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 14, color: c.textMuted }}>{g.members} Mitglieder · {shown.map(leagueName).join(' + ')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 24, color: tone.fg }}>#{g.myRank}</Text>
                  {g.weekDelta ? <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: accent.main }}>+{g.weekDelta}</Text> : null}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border }}>
                <View style={{ flexDirection: 'row' }}>
                  {g.memberInitials.map((m, k) => (
                    <View key={m + k} style={{ width: 26, height: 26, borderRadius: 13, marginLeft: k ? -5 : 0, backgroundColor: [accent.soft, c.cardMuted, c.goldBg, c.bronzeBg][k % 4], borderWidth: 2, borderColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 9, color: c.text }}>{m}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.textMuted }}>Leader: {g.leader === 'me' ? 'du' : g.leader}</Text>
                <Pressable onPress={() => setLeaving(g)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${g.name} verlassen`} style={{ marginLeft: 'auto' }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.textFaint }}>Verlassen</Text>
                </Pressable>
              </View>
            </Card>
          );
        })}
      </View>
      {sheet === 'create' ? <CreateSheet visible onClose={() => setSheet(null)} onDone={() => { setSheet(null); setVersion((v) => v + 1); }} /> : null}
      {leaving ? (
        <Sheet visible onClose={() => setLeaving(null)}>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, color: c.text }}>{leaving.name} verlassen?</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: c.textMuted, marginTop: 4 }}>
            {leaving.members <= 1
              ? 'Du bist die letzte Person in dieser Gruppe – beim Verlassen wird die Gruppe gelöscht.'
              : 'Deine Punkte bleiben in den Liga-Ranglisten erhalten. Bist du Gruppen-Owner, übernimmt das am längsten dabei seiende Mitglied. Verlässt die letzte Person die Gruppe, wird sie gelöscht.'}
          </Text>
          <Button label={leaving.members <= 1 ? 'Verlassen & Gruppe löschen' : 'Gruppe verlassen'} variant="danger" style={{ marginTop: 18 }}
            onPress={async () => { await repo.leaveGroup(leaving.id); setLeaving(null); setVersion((v) => v + 1); }} />
          <Button label="Abbrechen" variant="light" style={{ marginTop: 10 }} onPress={() => setLeaving(null)} />
        </Sheet>
      ) : null}
      {sheet === 'join' ? <JoinSheet visible onClose={() => setSheet(null)} onDone={() => { setSheet(null); setVersion((v) => v + 1); }} /> : null}
    </Screen>
  );
}

function CreateSheet({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: (g: Group) => void }) {
  const { c, accent, fonts } = useTheme();
  const { sport } = useSport();
  const { all, favorite } = useMyLeagues(sport);
  const [name, setName] = useState('');
  const [sel, setSel] = useState<string[]>(favorite ? [favorite.id] : []);
  const [priv, setPriv] = useState(true);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Group | null>(null);
  const valid = name.trim().length >= 3 && sel.length > 0;
  const submit = async () => {
    setBusy(true);
    try {
      setCreated(await repo.createGroup({ name, leagueIds: sel, isPrivate: priv }));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet visible={visible} onClose={created ? () => onDone(created) : onClose}>
      {created ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, color: c.text }}>Gruppe erstellt</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: c.textMuted, marginTop: 2 }}>Teile diesen Code mit deinen Freunden:</Text>
          <Text testID="created-code" style={{ fontFamily: fonts.display, fontSize: 40, letterSpacing: 4, color: accent.main, marginVertical: 16 }}>{formatCode(created.inviteCode)}</Text>
          <Button label="Fertig" onPress={() => onDone(created)} style={{ alignSelf: 'stretch' }} />
        </View>
      ) : (
        <>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, color: c.text }}>Gruppe erstellen</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: c.textMuted }}>Lade Freunde per Code oder Link ein.</Text>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 1.6, color: c.textMuted, marginTop: 18, marginBottom: 8 }}>NAME</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 64, borderRadius: 18, borderWidth: 2, borderColor: accent.main, backgroundColor: c.bg, paddingHorizontal: 18 }}>
            <TextInput testID="group-name" value={name} onChangeText={(t) => setName(t.slice(0, 30))} placeholder="z. B. Kicker-Runde 2026" placeholderTextColor={c.textFaint} autoFocus
              style={{ flex: 1, minWidth: 0, width: 10, fontFamily: fonts.bodyBold, fontSize: 19, color: c.text, outlineStyle: 'none' } as object} />
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: c.textMuted }}>{name.length}/30</Text>
          </View>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 1.6, color: c.textMuted, marginTop: 18, marginBottom: 8 }}>LIGEN DER GRUPPE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {all.map((l) => {
              const on = sel.includes(l.id);
              return (
                <Pressable key={l.id} onPress={() => setSel(on ? sel.filter((x) => x !== l.id) : [...sel, l.id])} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                  style={{ paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, backgroundColor: on ? accent.main : c.cardMuted }}>
                  <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: on ? '#fff' : c.textMuted }}>{l.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg, borderRadius: 16, padding: 16, marginTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16, color: c.text }}>Nur mit Code beitreten</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.textMuted }}>{priv ? 'Gruppe ist privat' : 'Gruppe ist öffentlich auffindbar'}</Text>
            </View>
            <Switch value={priv} onValueChange={setPriv} trackColor={{ true: accent.main, false: c.dashed }} thumbColor="#fff" />
          </View>
          <Button testID="group-create-submit" label="Gruppe erstellen" variant={valid ? 'primary' : 'disabled'} loading={busy} onPress={submit} style={{ marginTop: 18 }} />
        </>
      )}
    </Sheet>
  );
}

function JoinSheet({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: (g: Group) => void }) {
  const { c, accent, fonts } = useTheme();
  const { all } = useMyLeagues();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef<TextInput>(null);
  const [lookup, setLookup] = useState<{ code: string; g: Group | null } | null>(null);
  const found: Group | null | undefined = code.length === CODE_LEN && lookup?.code === code ? lookup.g : undefined;
  useEffect(() => {
    if (code.length < CODE_LEN) return;
    let alive = true;
    repo.findGroupByCode(code).then((g) => alive && setLookup({ code, g: g ?? null }));
    return () => {
      alive = false;
    };
  }, [code]);
  const myIds = all.map((l) => l.id);
  const join = async () => {
    if (!found) return;
    setBusy(true);
    try {
      onDone(await repo.joinGroup(code));
    } finally {
      setBusy(false);
    }
  };
  const chars = code.padEnd(CODE_LEN).split('');
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={{ fontFamily: fonts.display, fontSize: 30, color: c.text }}>Mit Code beitreten</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 15, color: c.textMuted }}>Gib den {CODE_LEN}-stelligen Code ein, den du bekommen hast.</Text>
      <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 18 }}>
        {chars.map((ch, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {i === CODE_LEN / 2 ? <View style={{ width: 8, height: 3, borderRadius: 2, backgroundColor: c.dashed }} /> : null}
            <View style={{ width: 36, height: 48, borderRadius: 11, backgroundColor: c.cardMuted, borderWidth: i === Math.min(code.length, CODE_LEN - 1) ? 2 : 0, borderColor: accent.main, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 24, color: c.text }}>{ch.trim()}</Text>
            </View>
          </View>
        ))}
        <TextInput testID="join-code" ref={ref} value={code} onChangeText={(t) => setCode(normalizeCode(t))} autoCapitalize="characters" autoCorrect={false} autoFocus maxLength={CODE_LEN + 1}
          accessibilityLabel="Einladungscode" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%' }} />
      </Pressable>
      {found ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: accent.soft, borderRadius: 20, padding: 16 }}>
          <InitialTile text={tileText(found.name)} bg={accent.soft} fg={accent.main} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16, color: c.text }}>{found.name}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: c.textMuted }}>{found.members} Mitglieder{found.leagueIds.some((l) => myIds.includes(l)) ? ` · ${found.leagueIds.filter((l) => myIds.includes(l)).map(leagueName).join(' + ')}` : ' · keine deiner Ligen'}</Text>
          </View>
          <CheckIcon color={accent.main} size={20} />
        </View>
      ) : found === null ? (
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: c.down, textAlign: 'center' }}>Keine Gruppe mit diesem Code gefunden</Text>
      ) : null}
      {found && found.leagueIds.some((l) => !myIds.includes(l)) ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <InfoIcon color={c.textMuted} size={14} />
          <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 12.5, color: c.textMuted }}>Ligen, die du nicht gewählt hast, werden für diese Gruppe nicht angezeigt.</Text>
        </View>
      ) : null}
      <Button testID="join-submit" label="Gruppe beitreten" variant={found ? 'primary' : 'disabled'} loading={busy} onPress={join} style={{ marginTop: 18 }} />
    </Sheet>
  );
}
