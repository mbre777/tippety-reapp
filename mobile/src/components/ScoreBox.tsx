import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/** Tipp-Kästchen: gefüllt (getippt) oder gestrichelt leer (offen). */
export function ScoreBox({ value, size = 46 }: { value?: number; size?: number }) {
  const { accent, c, fonts } = useTheme();
  const filled = value !== undefined;
  return (
    <View
      style={{
        width: size,
        height: size * 1.05,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? accent.soft : 'transparent',
        borderWidth: filled ? 0 : 1.5,
        borderStyle: 'dashed',
        borderColor: c.dashed,
      }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: filled ? size * 0.62 : size * 0.4, color: filled ? accent.dark : c.textFaint }}>
        {filled ? value : '–'}
      </Text>
    </View>
  );
}
