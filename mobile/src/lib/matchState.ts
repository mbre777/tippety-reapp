import type { Match, Score } from '@/data/types';
import { calcPoints } from './scoring';

/**
 * EINE Quelle für Status + Spielstand (Liste, Detail, Home). Vorher las die Liste die Tipp-Boxen
 * (myTip) und das Detail `resultLine()` mit „Endstand“ auch bei Live-Spielen → widersprüchlich.
 */
export type Phase = 'upcoming' | 'live' | 'finished' | 'off';
export const DECISION_LABEL = { regular: '', overtime: 'n.V.', shootout: 'n.P.' } as const;

export type MatchState = {
  phase: Phase;
  /** angezeigter Spielstand: Live = aktueller Stand, Beendet = Endstand (inkl. Verlängerung/Penaltys) */
  score?: Score;
  /** Wertungsbasis (Eishockey: nach 60 Min) */
  scoring?: Score;
  /** „n.V.“ / „n.P.“ bei Eishockey */
  decisionLabel: string;
  /** „LIVE 37'“, „Halbzeit“, „2. Drittel“, „Beendet“ … */
  statusText: string;
  tip?: Score;
  points: number | null;
};

/** Spielminute/Abschnitt. Nutzt match.minute, falls die DB sie liefert, sonst Schätzung ab Anpfiff. */
export function liveClock(m: Match, now: number): string {
  if (m.minute != null) return `${m.minute}'`;
  const e = Math.max(1, Math.floor((now - Date.parse(m.kickoff)) / 60000));
  if (m.sport === 'football') {
    if (e <= 45) return `${e}'`;
    if (e <= 60) return 'Halbzeit';
    if (e <= 105) return `${e - 15}'`;
    return "90+'";
  }
  if (e <= 20) return '1. Drittel';
  if (e <= 38) return '1. Pause';
  if (e <= 58) return '2. Drittel';
  if (e <= 76) return '2. Pause';
  if (e <= 96) return '3. Drittel';
  return 'Verlängerung';
}

export function matchState(m: Match, now = Date.now()): MatchState {
  const tip = m.myTip;
  if (m.status === 'postponed' || m.status === 'cancelled') return { phase: 'off', decisionLabel: '', statusText: m.status === 'postponed' ? 'Verschoben' : 'Abgesagt', tip, points: null };
  if (m.status === 'finished') {
    const score = m.finalResult ?? m.result;
    const scoring = m.result ?? m.finalResult;
    const decisionLabel = m.sport === 'hockey' && m.decision ? DECISION_LABEL[m.decision] : '';
    return { phase: 'finished', score, scoring, decisionLabel, statusText: 'Beendet', tip, points: tip && scoring ? calcPoints(tip, scoring) : null };
  }
  if (m.status === 'live' || (m.status === 'scheduled' && Date.parse(m.kickoff) <= now && m.result)) {
    return { phase: 'live', score: m.finalResult ?? m.result ?? { home: 0, away: 0 }, decisionLabel: '', statusText: liveClock(m, now), tip, points: null };
  }
  return { phase: 'upcoming', decisionLabel: '', statusText: '', tip, points: null };
}

export const fmtScore = (s?: Score) => (s ? `${s.home}:${s.away}` : '–:–');
