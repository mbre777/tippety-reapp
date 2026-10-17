import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { Barlow_800ExtraBold_Italic } from '@expo-google-fonts/barlow';
import { Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Toolbar } from '@/components/Toolbar';
import { onboardingStep, setSession, useSession } from '@/auth/session';
import { auth } from '@/data';
import { readDemoParams } from '@/lib/demo';
import { SportProvider, useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

const demo = readDemoParams();

/** Routing-Gate: Login → Nickname → Ligen → App. */
function useAuthGate() {
  const { ready, profile } = useSession();
  const segments = useSegments() as string[];
  useEffect(() => {
    if (!ready) auth.getProfile().then(setSession, () => setSession(null));
  }, [ready]);
  useEffect(() => auth.onSignedOut?.(() => setSession(null)), []);
  const step = onboardingStep(profile);
  const first = segments[0] ?? '';
  const second = segments[1] ?? '';
  useEffect(() => {
    if (!ready || first === 'auth-callback') return;
    if (step === 'login' && first !== 'login') router.replace('/login');
    else if (step === 'nickname' && !(first === 'onboarding' && second === 'nickname')) router.replace('/onboarding/nickname');
    else if (step === 'leagues' && !(first === 'onboarding' && second === 'ligen')) router.replace('/onboarding/ligen');
    else if (step === 'done' && first === 'login') router.replace('/');
  }, [ready, step, first, second]);
  return ready;
}

function Shell() {
  const { c } = useTheme();
  const { sport, setSport } = useSport();
  const { hasFootball, hasHockey } = useMyLeagues();
  const ready = useAuthGate();
  const segments = useSegments() as string[];
  // Sportart ohne gewählte Liga gibt es nicht → automatisch umschalten.
  useEffect(() => {
    if (sport === 'hockey' && !hasHockey && hasFootball) setSport('football');
    if (sport === 'football' && !hasFootball && hasHockey) setSport('hockey');
  }, [sport, hasFootball, hasHockey, setSport]);
  const lightBar = sport === 'football' || segments[0] === 'login'; // Login: Uhrzeit liegt auf dem Rasen
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={lightBar ? 'light' : 'dark'} />
      <>
          <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 150, contentStyle: { backgroundColor: c.bg } }}>
            <Stack.Screen name="spiel/[id]" options={{ animation: 'slide_from_right', animationDuration: 200, gestureEnabled: true, fullScreenGestureEnabled: true }} />
            <Stack.Screen name="profil" options={{ animation: 'slide_from_right', animationDuration: 200 }} />
          </Stack>
          {ready ? <Toolbar /> : <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.bg }} />}
      </>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Barlow_800ExtraBold_Italic,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [initialSport] = useState(demo.sport ?? 'football');
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <SportProvider initial={initialSport}>
        <ThemeProvider>
          <Shell />
        </ThemeProvider>
      </SportProvider>
    </SafeAreaProvider>
  );
}
