import { useState } from 'react';
import { Image, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { setSession } from '@/auth/session';
import type { AuthProvider } from '@/auth/types';
import { Button } from '@/components/Button';
import { AppleIcon, GoogleIcon } from '@/components/Icons';
import { Logo } from '@/components/Logo';
import { allLeagues, auth } from '@/data';
import { lightAccents, lightPalette as c, fonts } from '@/theme/tokens';

const hero = require('../../assets/login-hero.jpg');

/** 01 Login – sportneutral, nur Apple + Google. */
export default function Login() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<AuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heroH = Math.round(Math.min(height * 0.39, width * 0.9));
  const foot = allLeagues.filter((l) => l.sport === 'football' && l.available).length;
  const hockey = allLeagues.filter((l) => l.sport === 'hockey' && l.available);

  const signIn = async (p: AuthProvider) => {
    setBusy(p);
    setError(null);
    try {
      setSession(await auth.signIn(p));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ height: heroH, overflow: 'hidden' }}>
        <Image source={hero} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />
        <Svg width={width} height={heroH * 0.55} style={{ position: 'absolute', bottom: 0 }}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#fff" stopOpacity={0} />
              <Stop offset="1" stopColor="#fff" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={heroH * 0.55} fill="url(#fade)" />
        </Svg>
        <View style={{ position: 'absolute', top: insets.top + 46, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 26 }}>
          <View style={{ backgroundColor: 'rgba(20,52,32,0.72)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13.5, color: '#fff' }}>Fußball · {foot} Ligen</Text>
          </View>
          <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13.5, color: lightAccents.hockey.main }}>
              Eishockey · {hockey.length === 1 ? hockey[0].name : `${hockey.map((l) => l.name.replace('National League', 'NL')).join(' + ')}`}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', paddingBottom: insets.bottom + 60 }}>
        <Logo color={c.text} accent={lightAccents.football.main} accent2={lightAccents.hockey.main} scale={2.15} />
        <Text style={{ fontFamily: fonts.body, fontSize: 16.5, lineHeight: 25, color: c.textMuted, textAlign: 'center', marginTop: 18 }}>
          Tippe Fußball und Eishockey mit Freunden.{'\n'}Jeden Spieltag, jede Runde.
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 14, marginTop: 30 }}>
            <Button testID="login-apple" variant="dark" label="Mit Apple anmelden" loading={busy === 'apple'} onPress={() => signIn('apple')} icon={<AppleIcon color="#fff" size={20} />} height={62} />
          <Button testID="login-google" variant="light" label="Mit Google anmelden" loading={busy === 'google'} onPress={() => signIn('google')} icon={<GoogleIcon size={20} />} height={62} />
        </View>
        {error ? <Text style={{ fontFamily: fonts.bodyBold, color: c.down, marginTop: 12 }}>{error}</Text> : null}
        <Text style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 20, color: c.textMuted, textAlign: 'center', marginTop: 22 }}>
          Mit der Anmeldung akzeptierst du die <Text style={{ fontFamily: fonts.bodyHeavy, color: c.text }}>Nutzungsbedingungen</Text>
          {'\n'}und die <Text style={{ fontFamily: fonts.bodyHeavy, color: c.text }}>Datenschutzerklärung</Text>.
        </Text>
      </View>
    </View>
  );
}
