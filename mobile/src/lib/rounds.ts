import type { Match, Sport } from '@/data/types';
import { matchState } from './matchState';

/** Spieltag/Runde einer Liga, abgeleitet aus matches.matchday (0005) bzw. Zahl in matches.round. */
export type RoundInfo = {
  key: string;
  num?: number;
  /** „7. Spieltag“ / „Runde 14“ / Datum (wenn die Quelle keine Rundennummer liefert, z. B. NHL) */
  title: string;
  /** Chip-Kopf: „ST“ / „RUNDE“ / Wochentag */
  chipLabel: string;
  chipValue: string;
  from?: string;
  to?: string;
  matches: Match[];
  total: number;
  tipped: number;
  open: number;
  points: number;
  phase: 'past' | 'current' | 'future';
};

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MO = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const d = (iso: string) => new Date(iso);
const dm = (iso: string) => `${d(iso).getDate()}.${d(iso).getMonth() + 1}.`;
/** „16.–18.10.“ bzw. „30.10.–1.11.“ bzw. „Fr 16.10.“ */
export function chipDates(from?: string, to?: string, sport?: Sport): string {
  if (!from) return '';
  const a = d(from), b = d(to ?? from);
  if (a.toDateString() === b.toDateString()) return sport === 'hockey' ? `${WD[a.getDay()]} ${dm(from)}` : dm(from);
  return a.getMonth() === b.getMonth() ? `${a.getDate()}.–${dm(to!)}` : `${dm(from)}–${dm(to!)}`;
}
/** „16.–18. Oktober“ */
export function longDates(from?: string, to?: string): string {
  if (!from) return '';
  const a = d(from), b = d(to ?? from);
  if (a.toDateString() === b.toDateString()) return `${WD[a.getDay()]} ${a.getDate()}. ${MO[a.getMonth()]}`;
  return a.getMonth() === b.getMonth() ? `${a.getDate()}.–${b.getDate()}. ${MO[a.getMonth()]}` : `${a.getDate()}. ${MO[a.getMonth()]} – ${b.getDate()}. ${MO[b.getMonth()]}`;
}

export function roundNum(m: Match): number | undefined {
  if (m.matchday != null) return m.matchday;
  const n = m.round.match(/\d+/);
  return n ? Number(n[0]) : undefined;
}

/**
 * Gruppiert Liga-Spiele in Runden. `totalRounds` (Fußball 34, Eishockey 52) ergänzt leere Chips für
 * Runden ohne Spiele im Datenbestand. Ohne Rundennummer (z. B. NHL „Regular Season“) → je Spieltag (Datum).
 */
export function groupRounds(matches: Match[], sport: Sport, now = Date.now(), totalRounds?: number): RoundInfo[] {
  const byKey = new Map<string, RoundInfo>();
  const numbered = matches.some((m) => roundNum(m) != null);
  for (const m of [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff))) {
    const num = numbered ? roundNum(m) : undefined;
    const key = num != null ? String(num) : m.kickoff.slice(0, 10);
    let r = byKey.get(key);
    if (!r) {
      r = { key, num, title: '', chipLabel: '', chipValue: '', matches: [], total: 0, tipped: 0, open: 0, points: 0, phase: 'future' };
      byKey.set(key, r);
    }
    r.matches.push(m);
  }
  if (numbered && totalRounds) for (let i = 1; i <= totalRounds; i++) if (!byKey.has(String(i))) byKey.set(String(i), { key: String(i), num: i, title: '', chipLabel: '', chipValue: '', matches: [], total: 0, tipped: 0, open: 0, points: 0, phase: 'future' });
  const list = [...byKey.values()].sort((a, b) => (a.num != null && b.num != null ? a.num - b.num : a.key.localeCompare(b.key)));
  for (const r of list) {
    r.total = r.matches.length;
    r.from = r.matches[0]?.kickoff;
    r.to = r.matches[r.matches.length - 1]?.kickoff;
    for (const m of r.matches) {
      const st = matchState(m, now);
      if (m.myTip) r.tipped++;
      else if (st.phase === 'upcoming' && Date.parse(m.kickoff) > now) r.open++;
      if (st.points) r.points += st.points;
    }
    const done = r.total > 0 && r.matches.every((m) => { const p = matchState(m, now).phase; return p === 'finished' || p === 'off'; });
    r.phase = done ? 'past' : 'future';
    if (r.num != null) {
      r.title = sport === 'football' ? `${r.num}. Spieltag` : `Runde ${r.num}`;
      r.chipLabel = sport === 'football' ? 'ST' : 'RUNDE';
      r.chipValue = String(r.num);
    } else {
      const a = d(r.from!);
      r.title = longDates(r.from);
      r.chipLabel = WD[a.getDay()].toUpperCase();
      r.chipValue = String(a.getDate());
    }
  }
  // aktuell = erste nicht abgeschlossene Runde mit Spielen; sonst letzte mit Spielen
  const cur = list.find((r) => r.total > 0 && r.phase !== 'past') ?? [...list].reverse().find((r) => r.total > 0);
  if (cur) cur.phase = 'current';
  // Runden ohne Spiele vor der aktuellen gelten als vergangen
  const ci = cur ? list.indexOf(cur) : -1;
  list.forEach((r, i) => { if (r.total === 0 && i < ci) r.phase = 'past'; });
  return list;
}
