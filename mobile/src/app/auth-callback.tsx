import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { setSession } from '@/auth/session';
import { auth } from '@/data';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * OAuth-Rücksprung (tippety://auth-callback bzw. exp://…/--/auth-callback, Web: /auth-callback).
 * Web: supabase-js tauscht den ?code= automatisch (detectSessionInUrl + PKCE).
 * Native: openAuthSessionAsync hat den Code schon getauscht – hier nur Profil laden.
 */
export default function AuthCallback() {
  const { c, accent, fonts } = useTheme();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const run = async () => {
      for (let i = 0; i < 20 && alive; i++) {
        const p = await auth.getProfile().catch(() => null);
        if (p) {
          setSession(p);
          router.replace('/');
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      if (alive) setError('Anmeldung fehlgeschlagen – bitte erneut versuchen.');
    };
    run();
    return () => {
      alive = false;
    };
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, gap: 14 }}>
      {error ? (
        <Text onPress={() => router.replace('/login')} style={{ fontFamily: fonts.bodyBold, color: c.down, textAlign: 'center', paddingHorizontal: 30 }}>{error}{'\n'}Zurück zum Login</Text>
      ) : (
        <>
          <ActivityIndicator color={accent.main} />
          <Text style={{ fontFamily: fonts.bodyBold, color: c.textMuted }}>Anmeldung wird abgeschlossen …</Text>
        </>
      )}
    </View>
  );
}
