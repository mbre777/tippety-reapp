import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { addDays, dayParts } from '@/lib/date';

export function DayStrip({ today, selected, onSelect }: { today: string; selected: string; onSelect: (d: string) => void }) {
  const { accent, fonts, c } = useTheme();
  const days = [-1, 0, 1, 2, 3].map((n) => addDays(today, n));
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
      {days.map((d) => {
        const p = dayParts(d);
        const sel = d === selected;
        return (
          <Pressable key={d} onPress={() => onSelect(d)} style={{ alignItems: 'center', width: 62, paddingVertical: 8, borderRadius: 16, backgroundColor: sel ? c.card : 'transparent' }} accessibilityRole="button" accessibilityState={{ selected: sel }}>
            <Text style={{ fontFamily: sel ? fonts.bodyHeavy : fonts.bodySemi, fontSize: 13, color: sel ? accent.main : accent.headerTextMuted }}>
              {d === today ? 'Heute' : p.weekday}
            </Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: sel ? c.text : accent.headerText }}>{p.dayNum}.</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
