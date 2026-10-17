import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Card({ style, accentTop, ...rest }: ViewProps & { accentTop?: boolean }) {
  const { c, radius, shadow, accent } = useTheme();
  return (
    <View
      {...rest}
      style={[
        { backgroundColor: c.card, borderRadius: radius.lg, padding: 16 },
        shadow.card,
        accentTop ? { borderTopWidth: 3, borderTopColor: accent.main } : null,
        style,
      ]}
    />
  );
}
