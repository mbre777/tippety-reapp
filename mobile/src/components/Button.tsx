import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'outline' | 'soft' | 'dark' | 'light' | 'danger' | 'disabled';

export function Button({ label, onPress, variant = 'primary', icon, loading, style, height = 58, testID, fontSize = 17 }: { fontSize?: number; label: string; onPress?: () => void; variant?: Variant; icon?: ReactNode; loading?: boolean; style?: ViewStyle; height?: number; testID?: string }) {
  const { c, accent, fonts } = useTheme();
  const conf: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: accent.main, fg: accent.onAccent },
    outline: { bg: c.card, fg: accent.main, border: accent.main },
    soft: { bg: accent.soft, fg: accent.main },
    dark: { bg: '#14181D', fg: '#fff' },
    light: { bg: c.card, fg: c.text, border: c.border },
    danger: { bg: c.card, fg: c.down, border: '#F3C7C7' },
    disabled: { bg: '#E1E4E9', fg: c.textFaint },
  };
  const v = conf[variant];
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled: variant === 'disabled' }} disabled={variant === 'disabled' || loading} onPress={onPress}
      style={({ pressed }) => [{ height, borderRadius: height / 2, backgroundColor: v.bg, borderWidth: v.border ? 1.5 : 0, borderColor: v.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {icon}
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize, color: v.fg }}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
