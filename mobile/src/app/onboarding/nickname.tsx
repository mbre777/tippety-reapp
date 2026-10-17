import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { setSession, useSession } from '@/auth/session';
import type { NicknameCheck } from '@/auth/types';
import { Button } from '@/components/Button';
import { CheckIcon, InfoIcon, XIcon } from '@/components/Icons';
import { OnboardingFrame } from '@/components/OnboardingFrame';
import { profileApi } from '@/data';
import { NICK_MAX, NICK_MIN, NICK_PATTERN, checkNickFormat, nickSuggestions, type NickStatus } from '@/lib/nickname';
import { useTheme } from '@/theme/ThemeProvider';

/** 02 Nickname – Live-Validierung (lokal sofort, Eindeutigkeit per Server, entprellt). */
export default function Nickname() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const { profile } = useSession();
  const { c, accent, fonts } = useTheme();
  const [value, setValue] = useState(isEdit ? profile?.nickname ?? '' : '');
  const [server, setServer] = useState<{ v: string; r: NicknameCheck } | null>(null);
  const [suggest, setSuggest] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const fmt = checkNickFormat(value);
  useEffect(() => {
    if (fmt !== 'ok') return;
    let alive = true;
    const t = setTimeout(async () => {
      const r = await profileApi.checkNickname(value);
      if (!alive) return;
      setServer({ v: value, r });
      if (r === 'taken') {
        const free: string[] = [];
        for (const cand of nickSuggestions(value, () => true)) if ((await profileApi.checkNickname(cand)) === 'available') free.push(cand);
        if (alive) setSuggest(free);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value, fmt]);

  const status: NickStatus = fmt !== 'ok' ? fmt : server?.v !== value ? 'checking' : server.r === 'taken' ? 'taken' : server.r === 'available' ? 'available' : server.r === 'reserved' ? 'reserved' : 'chars';
  const lenOk = value.length >= NICK_MIN && value.length <= NICK_MAX;
  const charsOk = value.length > 0 && NICK_PATTERN.test(value);
  const error = status === 'chars' || status === 'taken' || status === 'reserved' || (status === 'length' && value.length > 0);
  const ok = status === 'available';
  const ring = error ? c.down : ok ? accent.main : focused ? accent.main : c.border;
  const unchanged = isEdit && value === profile?.nickname;

  const msg = (() => {
    switch (status) {
      case 'empty': return { icon: 'info', text: '3–16 Zeichen: a–z, 0–9 und _', color: c.textMuted };
      case 'chars': return { icon: 'x', text: 'Nur Kleinbuchstaben a–z, Ziffern 0–9 und _ erlaubt', color: c.down };
      case 'length': return { icon: 'x', text: value.length < NICK_MIN ? 'Mindestens 3 Zeichen' : 'Höchstens 16 Zeichen', color: c.down };
      case 'reserved': return { icon: 'x', text: 'Dieser Name ist nicht erlaubt', color: c.down };
      case 'taken': return { icon: 'x', text: `${value} ist schon vergeben`, color: c.down };
      case 'available': return { icon: 'check', text: unchanged ? 'Dein aktueller Nickname' : `${value} ist verfügbar`, color: accent.main };
      default: return { icon: 'info', text: 'Prüfe Verfügbarkeit …', color: c.textMuted };
    }
  })();

  const rules: { label: string; state: 'idle' | 'ok' | 'bad' }[] = [
    { label: '3–16 Zeichen', state: value.length === 0 ? 'idle' : lenOk ? 'ok' : 'bad' },
    { label: 'Nur a–z, 0–9 und _', state: value.length === 0 ? 'idle' : charsOk ? 'ok' : 'bad' },
    { label: 'Noch nicht vergeben', state: status === 'available' ? 'ok' : status === 'taken' || status === 'reserved' ? 'bad' : 'idle' },
  ];

  const submit = async () => {
    if (!ok) return;
    setSaving(true);
    try {
      const p = await profileApi.setNickname(value);
      setSession(p);
      if (isEdit) router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingFrame
      step={isEdit ? undefined : 1}
      of={isEdit ? undefined : 2}
      back={isEdit}
      title={isEdit ? 'Nickname ändern' : 'Wähle deinen Nickname'}
      subtitle="So sehen dich andere in Ranglisten und Gruppen. Groß-/Kleinschreibung zählt nicht."
      footer={<Button testID="nick-next" label={isEdit ? 'Speichern' : 'Weiter'} variant={ok && !unchanged ? 'primary' : 'disabled'} loading={saving} onPress={submit} height={62} />}
    >
      <Pressable onPress={() => inputRef.current?.focus()} style={{ flexDirection: 'row', alignItems: 'center', height: 70, borderRadius: 18, backgroundColor: c.card, borderWidth: 2, borderColor: ring, paddingLeft: 18, paddingRight: 12 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 21, color: c.textMuted }}>@</Text>
        <TextInput
          testID="nick-input"
          ref={inputRef}
          value={value}
          onChangeText={(t) => setValue(t.slice(0, 20))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          maxLength={20}
          placeholder="dein_nickname"
          placeholderTextColor={c.textFaint}
          accessibilityLabel="Nickname"
          onSubmitEditing={submit}
          style={{ flex: 1, minWidth: 0, width: 10, fontFamily: fonts.bodyBold, fontSize: 21, color: c.text, paddingVertical: 8, paddingLeft: 2, outlineStyle: 'none' } as object}
        />
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: value.length > NICK_MAX ? c.down : c.textMuted, marginRight: 10 }}>{value.length}/{NICK_MAX}</Text>
        {error || ok ? (
          <Pressable accessibilityRole="button" accessibilityLabel={error ? 'Eingabe löschen' : 'Verfügbar'} disabled={!error} onPress={() => setValue('')}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: error ? c.down : accent.main, alignItems: 'center', justifyContent: 'center' }}>
            {error ? <XIcon color="#fff" size={16} /> : <CheckIcon color="#fff" size={17} />}
          </Pressable>
        ) : null}
      </Pressable>

      <View testID="nick-message" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 6 }} accessibilityLiveRegion="polite">
        {msg.icon === 'x' ? <XIcon color={msg.color} size={16} /> : msg.icon === 'check' ? <CheckIcon color={msg.color} size={16} /> : <InfoIcon color={msg.color} size={16} />}
        <Text style={{ flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 14, color: msg.color }}>{msg.text}</Text>
      </View>

      <View style={{ backgroundColor: c.card, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 22, marginTop: 24, gap: 12 }}>
        {rules.map((r) => (
          <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {r.state === 'bad' ? <XIcon color={c.down} size={16} /> : <CheckIcon color={r.state === 'ok' ? accent.main : c.textFaint} size={16} />}
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: r.state === 'bad' ? c.down : c.text }}>{r.label}</Text>
          </View>
        ))}
      </View>

      {status === 'taken' && suggest.length ? (
        <View style={{ marginTop: 26 }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12.5, letterSpacing: 1.6, color: c.textMuted }}>VORSCHLÄGE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {suggest.map((s) => (
              <Pressable key={s} onPress={() => setValue(s)} accessibilityRole="button" style={{ backgroundColor: c.card, borderRadius: 999, paddingHorizontal: 17, paddingVertical: 11 }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 15, color: c.text }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </OnboardingFrame>
  );
}
