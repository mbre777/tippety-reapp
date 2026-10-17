import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppHeader, HeaderTitle } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Crest } from '@/components/Crest';
import { ClockIcon, MinusIcon, PlusIcon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { MOCK_TODAY, leagueName, repo, useQuery, type Score, type Team } from '@/data';
import { countdown, fmtNum, relDay, timeOf } from '@/lib/date';
import { useSport } from '@/sport/SportContext';
import { useTheme } from '@/theme/ThemeProvider';

const QUICK: Record<'football' | 'hockey', Score[]> = {
  football: [{ home: 1, away: 0 }, { home: 2, away: 1 }, { home: 2, away: 0 }, { home: 1, away: 1 }, { home: 3, away: 1 }],
  hockey: [{ home: 3, away: 2 }, { home: 4, away: 2 }, { home: 2, away: 1 }, { home: 3, away: 3 }, { home: 2, away: 4 }],
};

export default function Spieldetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setSport } = useSport();
  const { c, accent, fonts } = useTheme();
  const { data: match, setData } = useQuery(() => repo.getMatch(id), [id]);
  const [draft, setTip] = useState<Score | null>(null);
  const [saved, setSaved] = useState(false);
  const [now, setNow] = useState(() => Date.now());

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
  const change = (side: keyof Score, d: number) => {
    setSaved(false);
    setTip({ ...tip, [side]: Math.max(0, Math.min(15, tip[side] + d)) });
  };
  const save = async () => {
    const m = await repo.saveTip(match.id, tip);
    setData(m);
    setSaved(true);
  };

  const shares = [
    { label: match.home.short, sub: 'Sieg', v: match.community.home, bg: accent.soft, fg: accent.main },
    { label: 'X', sub: hockey ? 'Remis (60′)' : 'Remis', v: match.community.draw, bg: c.cardMuted, fg: c.textMuted },
    { label: match.away.short, sub: 'Sieg', v: match.community.away, bg: c.warningBg, fg: c.warning },
  ];

  return (
    <Screen
      header={<AppHeader height={150} back><HeaderTitle overline={`${leagueName(match.leagueId)} · ${match.round}`} title="Spieldetail" /></AppHeader>}
      footer={
        <Pressable onPress={save} disabled={locked} accessibilityRole="button"
          style={{ height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: locked ? c.dashed : accent.main }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: accent.onAccent }}>
            {locked ? 'Tippschluss erreicht' : saved ? '✓ Tipp gespeichert' : 'Tipp speichern'}
          </Text>
        </Pressable>
      }
    >
      <Card accentTop style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 10 }}>
        <TeamCol team={match.home} />
        <View style={{ width: 120, alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.textMuted, textAlign: 'center' }} numberOfLines={2}>
            {relDay(match.kickoff.slice(0, 10), MOCK_TODAY)} · {match.venue}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 40, color: c.text }}>{timeOf(match.kickoff)}</Text>
          {!locked ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.warningBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <ClockIcon color={c.warning} size={13} />
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: c.warning, fontVariant: ['tabular-nums'] }}>{countdown(match.kickoff, now)}</Text>
            </View>
          ) : match.result ? (
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: c.textMuted }}>Endstand {match.result.home}:{match.result.away}</Text>
          ) : null}
        </View>
        <TeamCol team={match.away} />
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 18, color: c.text }}>Dein Tipp</Text>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: c.textMuted }}>{hockey ? 'Zählt nach 60 Minuten' : 'Tippschluss bei Spielbeginn'}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 10 }}>
        <Stepper value={tip.home} onChange={(d) => change('home', d)} disabled={locked} label={match.home.name} />
        <Text style={{ fontFamily: fonts.display, fontSize: 34, color: c.textMuted }}>:</Text>
        <Stepper value={tip.away} onChange={(d) => change('away', d)} disabled={locked} label={match.away.name} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {QUICK[match.sport].map((q) => {
          const sel = q.home === tip.home && q.away === tip.away;
          return (
            <Pressable key={`${q.home}-${q.away}`} disabled={locked} onPress={() => { setSaved(false); setTip(q); }}
              style={{ paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: sel ? accent.main : c.card }}>
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: sel ? accent.onAccent : c.text }}>{q.home}:{q.away}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 11, letterSpacing: 1.4, color: c.textMuted }}>COMMUNITY-TIPPS</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: c.textMuted }}>{fmtNum(match.community.total)} Tipps</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {shares.map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 14, padding: 10 }}>
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: c.text }} numberOfLines={1}>{s.label}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: c.textMuted }} numberOfLines={1}>{s.sub}</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 26, color: s.fg, marginTop: 6 }}>{s.v} %</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function TeamCol({ team }: { team: Team }) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
      <Crest team={team} size={52} />
      <Text style={{ fontFamily: fonts.display, fontSize: 19, lineHeight: 21, color: c.text, textAlign: 'center', marginTop: 8 }} numberOfLines={3}>
        {team.name}
      </Text>
    </View>
  );
}

function Stepper({ value, onChange, disabled, label }: { value: number; onChange: (d: number) => void; disabled: boolean; label: string }) {
  const { c, accent, fonts, shadow } = useTheme();
  const btn = (d: number) => (
    <Pressable disabled={disabled} onPress={() => onChange(d)} accessibilityRole="button" accessibilityLabel={`${label} ${d > 0 ? 'plus' : 'minus'} eins`}
      style={[{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }, shadow.card]}>
      {d > 0 ? <PlusIcon color={accent.main} /> : <MinusIcon color={accent.main} />}
    </Pressable>
  );
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      {btn(1)}
      <View style={{ width: 74, height: 70, borderRadius: 18, backgroundColor: accent.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 44, color: accent.dark }}>{value}</Text>
      </View>
      {btn(-1)}
    </View>
  );
}
