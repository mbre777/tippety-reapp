import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { addDays, dayParts } from '@/lib/date';

export function DayStrip({ today, selected, onSelect }: { today: string; selected: string; onSelect: (d: string) => void }) {
  const { accent, fonts } = useTheme();
  const days = [-1, 0, 1, 2, 3].map((n) => addDays(today, n));
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
      {days.map((d) => {
        const p = dayParts(d);
        const sel = d === selected;
        return (
          <Pressable key={d} onPress={() => onSelect(d)} style={{ alignItems: 'center', width: 58 }} accessibilityRole="button" accessibilityState={{ selected: sel }}>
            <Text style={{ fontFamily: sel ? fonts.bodyHeavy : fonts.bodySemi, fontSize: 13, color: sel ? accent.headerText : accent.headerTextMuted }}>
              {d === today ? 'Heute' : p.weekday}
            </Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: sel ? accent.headerText : accent.headerTextMuted }}>{p.dayNum}</Text>
            <View style={{ height: 3, width: 26, borderRadius: 2, backgroundColor: sel ? accent.headerText : 'transparent' }} />
          </Pressable>
        );
      })}
    </View>
  );
}
