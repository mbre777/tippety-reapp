import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { CalendarIcon, HomeIcon, TrophyIcon, UsersIcon } from './Icons';
import { SportGlyph } from './SportIcons';

export const TOOLBAR_SPACE = 104;
/** Kein Toolbar auf Login, Onboarding und Profil */
const HIDDEN = ['/login', '/onboarding', '/profil', '/auth-callback'];

type Tab = { href: '/' | '/spiele' | '/rangliste' | '/gruppen'; label: string };
const TABS: Tab[] = [
  { href: '/', label: 'Home' },
  { href: '/spiele', label: 'Spiele' },
  { href: '/rangliste', label: 'Rangliste' },
  { href: '/gruppen', label: 'Gruppen' },
];

/** Schwebende, verbundene Toolbar-Pill + freistehender runder Sport-Button. */
export function Toolbar() {
  const pathname = usePathname();
  const { sport, toggleSport } = useSport();
  const { c, accent, fonts, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasFootball, hasHockey } = useMyLeagues();
  const active = pathname.startsWith('/spiel') || pathname.startsWith('/fertig') ? '/spiele' : pathname;
  if (HIDDEN.some((h) => pathname.startsWith(h))) return null;

  const icon = (href: Tab['href'], color: string) => {
    switch (href) {
      case '/':
        return <HomeIcon color={color} />;
      case '/spiele':
        return <CalendarIcon color={color} size={24} strokeWidth={1.8} />;
      case '/rangliste':
        return <TrophyIcon color={color} />;
      default:
        return <UsersIcon color={color} />;
    }
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 14) + 6 }]}>
      <View style={[styles.pill, shadow.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {TABS.map((t) => {
          const isActive = active === t.href;
          const color = isActive ? accent.main : c.textFaint;
          return (
            <Pressable
              key={t.href}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t.label}
              onPress={() => router.navigate(t.href)}
              style={[styles.tab, isActive && { backgroundColor: accent.soft }]}
            >
              {icon(t.href, color)}
              <Text style={{ fontFamily: isActive ? fonts.bodyHeavy : fonts.bodySemi, fontSize: 11.5, color: isActive ? accent.main : c.textMuted }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hasFootball && hasHockey ? (
      <Pressable
        testID="sport-toggle"
        accessibilityRole="switch"
        accessibilityLabel={sport === 'football' ? 'Zu Eishockey wechseln' : 'Zu Fußball wechseln'}
        onPress={toggleSport}
        style={[styles.sport, shadow.card, { backgroundColor: c.card, borderColor: accent.main }]}
      >
        <SportGlyph sport={sport} size={40} />
      </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: { flex: 1, flexDirection: 'row', height: 70, borderRadius: 35, padding: 6, borderWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 29 },
  sport: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5 },
});
