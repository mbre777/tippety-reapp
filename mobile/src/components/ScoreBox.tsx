import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/** Tipp-Kästchen: gefüllt (getippt) oder gestrichelt leer (offen). variant="result": Spielstand (neutral, live rot). */
export function ScoreBox({ value, size = 46, variant = 'tip' }: { value?: number; size?: number; variant?: 'tip' | 'result' | 'live' }) {
  const { accent, c, fonts } = useTheme();
  const filled = value !== undefined;
  const res = variant !== 'tip';
  return (
    <View
      style={{
        width: size,
        height: size * 1.05,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: res ? c.cardMuted : filled ? accent.soft : 'transparent',
        borderWidth: filled || res ? 0 : 1.5,
        borderStyle: 'dashed',
        borderColor: c.dashed,
      }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: filled ? size * 0.62 : size * 0.4, color: variant === 'live' ? c.down : res ? c.text : filled ? accent.dark : c.textFaint }}>
        {filled ? value : '–'}
      </Text>
    </View>
  );
}
