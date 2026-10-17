import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';
import { FieldBackground } from './FieldBackground';
import { ChevronLeft } from './Icons';
import { Logo } from './Logo';

const HEAD = 130;

/** Onboarding-Rahmen: Spielfeld-Header mit Logo + Schritt-Punkten, Sheet, fixierter Footer. */
export function OnboardingFrame({ step, of, title, subtitle, children, footer, back }: { step?: number; of?: number; title: string; subtitle: ReactNode; children: ReactNode; footer: ReactNode; back?: boolean }) {
  const { sport } = useSport();
  const { c, accent, fonts } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const h = HEAD + insets.top;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h + 40, overflow: 'hidden' }}>
        <FieldBackground sport={sport} width={width} height={h + 40} />
      </View>
      <View style={{ paddingTop: insets.top + 18, paddingHorizontal: 24, height: h, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {back ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Zurück" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profil'))}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: sport === 'football' ? 'rgba(255,255,255,0.18)' : '#fff' }}>
              <ChevronLeft color={sport === 'football' ? '#fff' : accent.headerText} />
            </Pressable>
          ) : null}
          <Logo color={accent.headerText} accent={sport === 'football' ? '#fff' : accent.main} />
        </View>
        {step && of ? (
          <View style={{ flexDirection: 'row', gap: 5, marginTop: 12 }} accessibilityLabel={`Schritt ${step} von ${of}`}>
            {Array.from({ length: of }).map((_, i) => (
              <View key={i} style={{ height: 7, width: i + 1 === step ? 22 : 7, borderRadius: 4, backgroundColor: i + 1 === step ? (sport === 'football' ? '#fff' : accent.headerText) : sport === 'football' ? 'rgba(255,255,255,0.45)' : 'rgba(19,40,74,0.25)' }} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, marginTop: -2, backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: 150 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step && of ? (
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12.5, letterSpacing: 1.6, color: accent.main }}>SCHRITT {step} VON {of}</Text>
          ) : null}
          <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: c.text, marginTop: 4 }}>{title}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15.5, lineHeight: 23, color: c.textMuted, marginTop: 2 }}>{subtitle}</Text>
          <View style={{ marginTop: 18 }}>{children}</View>
        </ScrollView>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 14) + 8, backgroundColor: 'rgba(244,246,248,0.94)' }}>{footer}</View>
      </View>
    </View>
  );
}
