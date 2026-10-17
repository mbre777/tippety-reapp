import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'display' | 'title' | 'section' | 'body' | 'bodyBold' | 'caption' | 'overline' | 'score';

export function Txt({ variant = 'body', color, style, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  const { c, fonts } = useTheme();
  const map: Record<Variant, TextStyle> = {
    display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: c.text },
    title: { fontFamily: fonts.display, fontSize: 21, lineHeight: 24, color: c.text },
    section: { fontFamily: fonts.bodyHeavy, fontSize: 18, color: c.text },
    body: { fontFamily: fonts.body, fontSize: 14, color: c.text },
    bodyBold: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: c.text },
    caption: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.textMuted },
    overline: { fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: c.textMuted },
    score: { fontFamily: fonts.display, fontSize: 30, color: c.text },
  };
  return <Text {...rest} style={[map[variant], color ? { color } : null, style]} />;
}
