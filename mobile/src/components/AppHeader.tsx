import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';
import { myStatsSync } from './headerData';
import { FieldBackground } from './FieldBackground';
import { ChevronLeft, FlameIcon } from './Icons';

export const SHEET_OVERLAP = 28;

type Props = { children?: ReactNode; height?: number; back?: boolean };

/** Kopfbereich mit Spielfeld/Eisfläche, Logo, Streak-Pill und Avatar. */
export function AppHeader({ children, height = 186, back }: Props) {
  const { sport } = useSport();
  const { accent, fonts, c } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const stats = myStatsSync(sport);
  const h = height + insets.top;
  return (
    <View style={{ height: h + SHEET_OVERLAP, overflow: 'hidden' }}>
      <FieldBackground sport={sport} width={width} height={h + SHEET_OVERLAP} />
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 22 }}>
        <View style={styles.row}>
          <View style={styles.row}>
            {back ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Zurück"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/spiele'))}
                style={[styles.back, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
              >
                <ChevronLeft color={accent.main} />
              </Pressable>
            ) : null}
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 32, letterSpacing: -0.8, color: accent.headerText }}>tippety</Text>
          </View>
          <View style={[styles.row, { gap: 8 }]}>
            <View style={[styles.pill, { backgroundColor: c.card }]}>
              <FlameIcon />
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: c.text }}>
                {stats.streak.done}/{stats.streak.of} Tage
              </Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: c.card }]}>
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: accent.main }}>{stats.initials}</Text>
            </View>
          </View>
        </View>
        <View style={{ marginTop: 14 }}>{children}</View>
      </View>
    </View>
  );
}

export function HeaderTitle({ overline, title }: { overline: string; title: string }) {
  const { accent, fonts } = useTheme();
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 2, color: accent.headerTextMuted, textTransform: 'uppercase' }} numberOfLines={1}>
        {overline}
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 38, lineHeight: 42, color: accent.headerText }}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 14, borderRadius: 999 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  back: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
});
