import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';
import { useSession } from '@/auth/session';
import { initialsOf } from '@/lib/initials';
import { Logo } from './Logo';
import { FieldBackground } from './FieldBackground';
import { ChevronLeft } from './Icons';
import { OpenTipsPill } from './OpenTipsPill';

export const SHEET_OVERLAP = 28;

type Props = { children?: ReactNode; height?: number; back?: boolean; title?: string; center?: string; right?: ReactNode; hidePill?: boolean; hideAvatar?: boolean };

/** Kopfbereich mit Spielfeld/Eisfläche, Logo, Streak-Pill und Avatar. */
export function AppHeader({ children, height = 128, back, title, center, right, hidePill, hideAvatar }: Props) {
  const { sport } = useSport();
  const { accent, fonts, c } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const h = height + insets.top;
  return (
    <View style={{ height: h + SHEET_OVERLAP, overflow: 'hidden' }}>
      <SportFade sport={sport} width={width} height={h + SHEET_OVERLAP} />
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 22 }}>
        <View style={styles.row}>
          <View style={styles.row}>
            {back ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Zurück"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                style={[styles.back, { backgroundColor: sport === 'football' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.92)' }]}
              >
                <ChevronLeft color={sport === 'football' ? '#fff' : accent.headerText} />
              </Pressable>
            ) : null}
            {title ? (
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: accent.headerText }} numberOfLines={1}>{title}</Text>
            ) : center ? null : (
              <Logo color={accent.headerText} accent={sport === 'football' ? '#7BE0A2' : accent.main} />
            )}
          </View>
          {center ? (
            <Text style={{ position: 'absolute', left: 50, right: 50, textAlign: 'center', fontFamily: fonts.bodyHeavy, fontSize: 15, color: accent.headerText }} numberOfLines={1}>{center}</Text>
          ) : null}
          <View style={[styles.row, { gap: 8 }]}>
            {hidePill ? null : <OpenTipsPill />}
            {right}
            {hideAvatar ? null : (
              <Pressable accessibilityRole="button" accessibilityLabel="Profil & Einstellungen" onPress={() => router.push('/profil')} style={[styles.avatar, { backgroundColor: c.card }]}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: accent.main }}>{initialsOf(profile?.nickname)}</Text>
              </Pressable>
            )}
          </View>
        </View>
        <View style={{ marginTop: 4 }}>{children}</View>
      </View>
    </View>
  );
}

export function HeaderTitle({ overline, title }: { overline: string; title: string }) {
  const { accent, fonts } = useTheme();
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 2, color: accent.headerTextMuted, textTransform: 'uppercase' }} numberOfLines={1}>
        {overline}
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: accent.headerText }}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 12, borderRadius: 999 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  back: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
});

/** Farb-Fade beim Sport-Wechsel: Eisfläche wird über das Spielfeld ein-/ausgeblendet (~200 ms). */
function SportFade({ sport, width, height }: { sport: 'football' | 'hockey'; width: number; height: number }) {
  const [v] = useState(() => new Animated.Value(sport === 'hockey' ? 1 : 0));
  useEffect(() => {
    Animated.timing(v, { toValue: sport === 'hockey' ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [sport, v]);
  return (
    <>
      <FieldBackground sport="football" width={width} height={height} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: v }]}>
        <FieldBackground sport="hockey" width={width} height={height} />
      </Animated.View>
    </>
  );
}
