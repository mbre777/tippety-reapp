import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Share, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Crest } from '@/components/Crest';
import { CheckIcon, ClockIcon, InfoIcon, MinusIcon, PlusIcon, ShareIcon } from '@/components/Icons';
import { resultLine } from '@/components/MatchCard';
import { Screen } from '@/components/Screen';
import { MOCK_TODAY, leagueName, repo, useQuery, type Match, type Score, type Team } from '@/data';
import { countdown, fmtNum, relDay, timeOf } from '@/lib/date';
import { calcPoints } from '@/lib/scoring';
import { useSport } from '@/sport/SportContext';
import { useMyLeagues } from '@/sport/useMyLeagues';
import { useTheme } from '@/theme/ThemeProvider';

const QUICK: Record<'football' | 'hockey', Score[]> = {
  football: [{ home: 1, away: 0 }, { home: 2, away: 1 }, { home: 2, away: 0 }, { home: 1, away: 1 }, { home: 3, away: 1 }],
  hockey: [{ home: 2, away: 1 }, { home: 3, away: 2 }, { home: 4, away: 2 }, { home: 2, away: 3 }, { home: 1, away: 3 }],
};
const label = (t: Team) => t.shortName ?? t.name;

/** 06 Tippen (+ gespeichert). Nach dem letzten offenen Tipp des Spieltags → „Alle getippt“. */
export default function Tippen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setSport } = useSport();
  const { c, accent, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: match, setData } = useQuery(() => repo.getMatch(id), [id]);
  const { ids } = useMyLeagues(match?.sport);
  const [draft, setTip] = useState<Score | null>(null);
  const [saved, setSaved] = useState(false);
  const [openLeft, setOpenLeft] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const next = useQuery(() => repo.getNextOpenMatch(id, ids), [id, ids, saved]).data;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (match) setSport(match.sport);
  }, [match, setSport]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!match) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  const tip: Score = draft ?? match.myTip ?? { home: 0, away: 0 };
  const locked = match.status !== 'scheduled' || Date.parse(match.kickoff) <= now;
  const hockey = match.sport === 'hockey';
  const isSaved = saved && !!match.myTip && match.myTip.home === tip.home && match.myTip.away === tip.away;
  const change = (side: keyof Score, d: number) => {
    setSaved(false);
    setTip({ ...tip, [side]: Math.max(0, Math.min(15, tip[side] + d)) });
  };
  const save = async () => {
    const wasTipped = !!match.myTip;
    const m = await repo.saveTip(match.id, tip);
    setData(m);
    setSaved(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const round = await repo.getRoundTips(match.leagueId);
    const left = round && round.round === match.round ? round.open.length : 0;
    setOpenLeft(left);
    if (wasTipped) return; // geänderter Tipp → auf dem Screen bleiben
    timers.current.push(
      setTimeout(async () => {
        if (left === 0) return router.replace({ pathname: '/fertig', params: { league: match.leagueId } });
        const n = await repo.getNextOpenMatch(match.id, ids);
        if (n) router.replace(`/spiel/${n.id}`);
      }, 1800),
    );
  };

  const pts = match.result && match.myTip ? calcPoints(match.myTip, match.result) : null;
  return (
    <View style={{ flex: 1 }}>
      <Screen
        header={<AppHeader height={74} back hidePill hideAvatar center={`${leagueName(match.leagueId)} · ${match.round}`} right={<HeaderShare match={match} />} />}
        fixedFooter={
          <View>
            {locked ? (
              <Button label={pts !== null ? `Dein Tipp ${match.myTip!.home}:${match.myTip!.away} · +${pts} Pkt` : 'Tippschluss erreicht'} variant="disabled" />
            ) : isSaved ? (
              <Button testID="tip-saved" label={`Tipp gespeichert · ${tip.home}:${tip.away}`} variant="soft" icon={<CheckIcon color={accent.main} size={18} />} onPress={save} />
            ) : (
              <Button testID="tip-save" label="Tipp speichern" onPress={save} />
            )}
            {next ? (
              <Pressable onPress={() => router.replace(`/spiel/${next.id}`)} accessibilityRole="link" style={{ alignItems: 'center', marginTop: 14 }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: isSaved ? accent.main : c.textMuted }} numberOfLines={1}>
                  {isSaved ? 'Weiter zu' : 'Nächstes:'} {label(next.home)} – {label(next.away)} ›
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
      >
        <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 10, borderTopWidth: 3, borderTopColor: accent.main }}>
          <TeamCol team={match.home} />
          <View style={{ width: 132, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.textMuted, textAlign: 'center' }} numberOfLines={1}>
              {relDay(match.kickoff.slice(0, 10), MOCK_TODAY)} · {match.venue}
            </Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 42, lineHeight: 48, color: c.text }}>{timeOf(match.kickoff)}</Text>
            {!locked ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.warningBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                <ClockIcon color={c.warning} size={13} />
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: c.warning, fontVariant: ['tabular-nums'] }}>noch {countdown(match.kickoff, now)}</Text>
              </View>
            ) : match.result ? (
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: c.textMuted, textAlign: 'center' }}>{resultLine(match)}</Text>
            ) : null}
          </View>
          <TeamCol team={match.away} />
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 18, color: c.text }}>Dein Tipp</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.textMuted }}>{hockey ? 'Wertung nach 60 Min · Tippschluss bei Anpfiff' : 'Tippschluss bei Anpfiff'}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 26, marginTop: 10 }}>
          <Stepper value={tip.home} onChange={(d) => change('home', d)} disabled={locked} label={match.home.name} solid={isSaved} />
          <Text style={{ fontFamily: fonts.display, fontSize: 34, color: c.textMuted }}>:</Text>
          <Stepper value={tip.away} onChange={(d) => change('away', d)} disabled={locked} label={match.away.name} solid={isSaved} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {QUICK[match.sport].map((q) => {
            const sel = q.home === tip.home && q.away === tip.away;
            return (
              <Pressable key={`${q.home}-${q.away}`} disabled={locked} onPress={() => { setSaved(false); setTip(q); }}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: sel ? accent.main : c.card }}>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: sel ? accent.onAccent : c.text }}>{q.home}:{q.away}</Text>
              </Pressable>
            );
          })}
        </View>

        <Community match={match} />
      </Screen>
      {isSaved && openLeft !== null ? (
        <View testID="toast" style={{ position: 'absolute', top: insets.top + 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#14181D', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11 }}>
          <CheckIcon color="#4ADE80" size={16} />
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: '#fff' }}>Gespeichert · {openLeft ? `noch ${openLeft} offen` : 'alle getippt'}</Text>
        </View>
      ) : null}
    </View>
  );
}

function HeaderShare({ match }: { match: Match }) {
  const { sport } = useSport();
  const { accent } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Teilen" onPress={() => Share.share({ message: `Tippe mit mir: ${match.home.name} – ${match.away.name} auf Tippety` }).catch(() => {})}
      style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: sport === 'football' ? 'rgba(255,255,255,0.18)' : '#fff' }}>
      <ShareIcon color={sport === 'football' ? '#fff' : accent.headerText} size={18} />
    </Pressable>
  );
}

function Community({ match }: { match: Match }) {
  const { c, accent, fonts } = useTheme();
  const hockey = match.sport === 'hockey';
  const k = match.community;
  return (
    <Card style={{ marginTop: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11.5, letterSpacing: 1.4, color: c.textMuted }}>COMMUNITY-TIPPS</Text>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.textMuted }}>{fmtNum(k.total)} Tipps</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 3, height: 9 }}>
        <View style={{ flex: k.home, backgroundColor: accent.main, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }} />
        <View style={{ flex: k.draw, backgroundColor: '#C9CED6' }} />
        <View style={{ flex: k.away, backgroundColor: '#E5A426', borderTopRightRadius: 5, borderBottomRightRadius: 5 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: accent.main }}>{match.home.short} Sieg {k.home} %</Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.textMuted }}>{hockey ? "Remis n. 60' " : 'Remis '}{k.draw} %</Text>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: c.warning }}>{match.away.short} Sieg {k.away} %</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'flex-start' }}>
        <View style={{ marginTop: 2 }}><InfoIcon color={c.textMuted} size={14} /></View>
        <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.textMuted }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, color: c.text }}>5</Text> exakt · <Text style={{ fontFamily: fonts.bodyHeavy, color: c.text }}>3</Text> Tordifferenz (außer Remis) · <Text style={{ fontFamily: fonts.bodyHeavy, color: c.text }}>2</Text> Tendenz{hockey ? ' · nach 60 Min' : ''}
        </Text>
      </View>
    </Card>
  );
}

function TeamCol({ team }: { team: Team }) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
      <Crest team={team} size={54} />
      <Text style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 23, color: c.text, textAlign: 'center', marginTop: 8 }} numberOfLines={2}>{label(team)}</Text>
    </View>
  );
}

function Stepper({ value, onChange, disabled, label: l, solid }: { value: number; onChange: (d: number) => void; disabled: boolean; label: string; solid?: boolean }) {
  const { c, accent, fonts, shadow } = useTheme();
  const btn = (d: number) => (
    <Pressable disabled={disabled} onPress={() => onChange(d)} accessibilityRole="button" accessibilityLabel={`${l} ${d > 0 ? 'plus' : 'minus'} eins`}
      style={[{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }, shadow.card]}>
      {d > 0 ? <PlusIcon color={accent.main} /> : <MinusIcon color={accent.main} />}
    </Pressable>
  );
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      {btn(1)}
      <View style={{ width: 82, height: 74, borderRadius: 18, backgroundColor: solid ? accent.main : accent.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 48, color: solid ? '#fff' : accent.dark }}>{value}</Text>
      </View>
      {btn(-1)}
    </View>
  );
}
