import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, G, Line, Polygon, Rect } from 'react-native-svg';
import { FootballIcon, PuckIcon } from '@/components/SportIcons';
import { setSession } from '@/auth/session';
import type { AuthProvider } from '@/auth/types';
import { Button } from '@/components/Button';
import { AppleIcon, GoogleIcon } from '@/components/Icons';
import { Logo } from '@/components/Logo';
import { allLeagues, auth } from '@/data';
import { lightAccents, lightPalette as c, fonts, shadow } from '@/theme/tokens';


/** 01 Login – sportneutral, nur Apple + Google. */
export default function Login() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<AuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heroH = Math.round(Math.min(height * 0.585, width * 1.3));
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
      <View style={{ height: heroH }}>
        <SplitField width={width} height={heroH + 40} />
        <View style={{ position: 'absolute', top: heroH * 0.3, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 }}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: '#fff' }}>Fußball · {foot} Ligen</Text>
          </View>
          <View style={[{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 }, shadow.card]}>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: lightAccents.hockey.main }}>
              Eishockey · {hockey.length === 1 ? hockey[0].name : hockey.map((l) => l.name.replace('National League', 'NL')).join(' + ')}
            </Text>
          </View>
        </View>
        <View style={{ position: 'absolute', top: heroH * 0.53, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: width * 0.15 }}>
          {(['football', 'hockey'] as const).map((s) => (
            <View key={s} style={[{ width: 92, height: 92, borderRadius: 46, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, shadow.card, { shadowOpacity: 0.18, shadowRadius: 18 }]}>
              {s === 'football' ? <FootballIcon size={54} /> : <PuckIcon size={56} />}
            </View>
          ))}
        </View>
      </View>
      <View style={{ flex: 1, marginTop: -26, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
      <View style={{ flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 30, paddingBottom: insets.bottom + 10 }}>
        <Logo color={c.text} accent={lightAccents.football.main} accent2={lightAccents.hockey.main} scale={1.75} />
        <Text style={{ fontFamily: fonts.body, fontSize: 16.5, lineHeight: 25, color: c.textMuted, textAlign: 'center', marginTop: 16 }}>
          Tippe Fußball und Eishockey mit Freunden.{'\n'}Jeden Spieltag, jede Runde.
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 26 }}>
            <Button testID="login-apple" variant="dark" label="Mit Apple anmelden" loading={busy === 'apple'} onPress={() => signIn('apple')} icon={<AppleIcon color="#fff" size={20} />} height={54} />
          <Button testID="login-google" variant="light" label="Mit Google anmelden" loading={busy === 'google'} onPress={() => signIn('google')} icon={<GoogleIcon size={20} />} height={54} />
        </View>
        {error ? <Text style={{ fontFamily: fonts.bodyBold, color: c.down, marginTop: 12 }}>{error}</Text> : null}
        <Text style={{ fontFamily: fonts.body, fontSize: 11.5, lineHeight: 18, color: c.textMuted, textAlign: 'center', marginTop: 20 }}>
          Mit der Anmeldung akzeptierst du die{' '}<Text style={{ fontFamily: fonts.bodyHeavy, color: c.text }}>Nutzungsbedingungen</Text>
          {'\n'}und die <Text style={{ fontFamily: fonts.bodyHeavy, color: c.text }}>Datenschutzerklärung</Text>.
        </Text>
      </View>
      </View>
    </View>
  );
}

/** Geteiltes Feld (01-login.png): links Rasen, rechts Eis, diagonale Trennung. Koordinaten aus designs/src/01-login.html (390×520). */
function SplitField({ width, height }: { width: number; height: number }) {
  const sx = width / 390;
  const sy = height / 520;
  const X = (v: number) => v * sx;
  const Y = (v: number) => v * sy;
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <ClipPath id="L"><Polygon points={`0,0 ${X(236)},0 ${X(154)},${height} 0,${height}`} /></ClipPath>
        <ClipPath id="R"><Polygon points={`${X(236)},0 ${width},0 ${width},${height} ${X(154)},${height}`} /></ClipPath>
      </Defs>
      <G clipPath="url(#L)">
        {Array.from({ length: 10 }).map((_, i) => <Rect key={i} x={X(i * 39)} width={X(39) + 1} height={height} fill={i % 2 ? '#169650' : '#13874a'} />)}
        <G fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={1.6}>
          <Rect x={X(-60)} y={Y(120)} width={X(200)} height={Y(300)} />
          <Circle cx={X(140)} cy={Y(270)} r={X(58)} />
          <Rect x={X(-60)} y={Y(200)} width={X(90)} height={Y(140)} />
        </G>
      </G>
      <G clipPath="url(#R)">
        <Rect width={width} height={height} fill="#e9f1fa" />
        <Line x1={X(262)} y1={0} x2={X(262)} y2={height} stroke="#d6283a" strokeOpacity={0.35} strokeWidth={4} />
        <Line x1={X(340)} y1={0} x2={X(340)} y2={height} stroke="#1f64c8" strokeOpacity={0.25} strokeWidth={6} />
        <Circle cx={X(262)} cy={Y(270)} r={X(58)} fill="none" stroke="#1f64c8" strokeOpacity={0.28} strokeWidth={2} />
        <Circle cx={X(350)} cy={Y(150)} r={X(34)} fill="none" stroke="#d6283a" strokeOpacity={0.25} strokeWidth={2} />
      </G>
      <Line x1={X(236)} y1={0} x2={X(154)} y2={height} stroke="#fff" strokeWidth={3} />
    </Svg>
  );
}
