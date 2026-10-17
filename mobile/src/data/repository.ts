import type { Group, League, LeaderboardEntry, LeaderboardPeriod, Match, NewGroup, OpenRoundTips, Score, Sport, UserStats } from './types';

/**
 * Datenzugriff der App. Implementierungen:
 *  - mock/mockRepository.ts (aktiv, Beispieldaten)
 *  - supabase/supabaseRepository.ts (Gerüst, supabase-js direkt gegen Postgres + RLS)
 * `leagueIds` sind immer die vom User gewählten Ligen – nicht gewählte Ligen erscheinen nirgends.
 */
export interface TippetyRepository {
  getLeagues(): Promise<League[]>;
  getMatchesByDay(sport: Sport, day: string, leagueIds: string[]): Promise<Match[]>;
  getMatch(id: string): Promise<Match | undefined>;
  /** Kommende Topspiele der Sportart, nach Anstoß sortiert */
  getTopMatches(sport: Sport, leagueIds: string[], limit?: number): Promise<Match[]>;
  /** Nächstes noch nicht getipptes, tippbares Spiel nach `afterMatchId` (gleiche Liga zuerst) */
  getNextOpenMatch(afterMatchId: string, leagueIds: string[]): Promise<Match | undefined>;
  /** Nächster Spieltag einer Liga mit offenen/getippten Spielen (Header-Pill, „Alle getippt“) */
  getRoundTips(leagueId: string): Promise<OpenRoundTips | undefined>;
  getLeaderboard(leagueId: string, period: LeaderboardPeriod): Promise<LeaderboardEntry[]>;
  getGroups(leagueIds: string[]): Promise<Group[]>;
  findGroupByCode(code: string): Promise<Group | undefined>;
  joinGroup(code: string): Promise<Group>;
  createGroup(g: NewGroup): Promise<Group>;
  /** Owner-Übergabe an ältestes Mitglied; letzte Person löscht die Gruppe (serverseitig). */
  leaveGroup(groupId: string): Promise<void>;
  getMyStats(leagueId: string): Promise<UserStats>;
  saveTip(matchId: string, tip: Score): Promise<Match>;
}
