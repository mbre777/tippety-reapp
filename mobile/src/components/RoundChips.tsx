import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { chipDates, type RoundInfo } from '@/lib/rounds';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';

const W = 70;
const G = 8;

/**
 * 05 Spiele: horizontal scrollbare Spieltag-/Runden-Chips. Aktiver Chip zentriert, AKTUELL-Badge,
 * Punkt = offene Tipps, ✓ +Punkte = vergangen. „Zur aktuellen Runde ›“ erscheint beim Wegscrollen.
 */
export function RoundChips({ rounds, selected, onSelect }: { rounds: RoundInfo[]; selected?: string; onSelect: (key: string) => void }) {
  const { sport } = useSport();
  const fb = sport === 'football';
  const { accent, c, fonts, shadow } = useTheme();
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const [x, setX] = useState(0);
  const pad = (width - W) / 2;
  const offsetOf = (i: number) => Math.max(0, i * (W + G));
  const selIdx = Math.max(0, rounds.findIndex((r) => r.key === selected));
  const curIdx = rounds.findIndex((r) => r.phase === 'current');

  useEffect(() => {
    if (!rounds.length) return;
    const t = setTimeout(() => ref.current?.scrollTo({ x: offsetOf(selIdx), animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.length, selected]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setX(e.nativeEvent.contentOffset.x);
  const curVisible = curIdx < 0 || Math.abs(offsetOf(curIdx) - x) < width / 2 - W / 2;
  const showBack = curIdx >= 0 && (!curVisible || selIdx !== curIdx);

  return (
    <View style={{ marginHorizontal: -22, marginTop: 6 }}>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32}
        snapToInterval={W + G} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: pad, paddingTop: 10, paddingBottom: 6, gap: G }}>
        {rounds.map((r, i) => {
          const on = i === selIdx;
          const t1 = on ? accent.main : fb ? 'rgba(255,255,255,0.75)' : 'rgba(15,45,92,0.6)';
          const t2 = on ? c.text : fb ? '#fff' : '#0f2d5c';
          return (
            <Pressable key={r.key} testID={`round-${r.key}`} onPress={() => onSelect(r.key)} accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={`${r.title}${r.phase === 'current' ? ', aktuell' : ''}`}
              style={[{ width: W, height: 78, borderRadius: 18, alignItems: 'center', paddingTop: 7,
                backgroundColor: on ? '#fff' : fb ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.75)' }, on ? shadow.card : null]}>
              {i === curIdx ? (
                <View style={{ position: 'absolute', top: -8, backgroundColor: '#E09B1A', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontFamily: fonts.bodyHeavy, fontSize: 9, letterSpacing: 0.4 }}>AKTUELL</Text>
                </View>
              ) : null}
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 10, letterSpacing: 0.5, color: t1 }}>{r.chipLabel}</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 25, lineHeight: 27, color: t2 }}>{r.chipValue}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 9.5, color: t1 }} numberOfLines={1}>{chipDates(r.from, r.to, sport) || '–'}</Text>
              {r.phase === 'past' && r.total ? (
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 10, color: on ? accent.main : fb ? '#BFF0D2' : accent.main }}>✓ +{r.points}</Text>
              ) : r.open ? (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E09B1A', marginTop: 4 }} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {showBack ? (
        <Pressable testID="round-current" onPress={() => { onSelect(rounds[curIdx].key); ref.current?.scrollTo({ x: offsetOf(curIdx), animated: true }); }}
          style={[{ position: 'absolute', top: -40, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 }, shadow.card]}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: accent.main }}>Zur aktuellen Runde ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
