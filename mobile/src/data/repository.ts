import type { Group, League, LeaderboardEntry, LeaderboardPeriod, Match, Score, Sport, UserStats } from './types';

/**
 * Datenzugriff der App. Aktuell mit Mock-Daten implementiert (mockRepository),
 * später durch einen API-Client (Cloudflare Worker / Hono) ersetzbar.
 */
export interface TippetyRepository {
  getLeagues(sport: Sport): Promise<League[]>;
  getMatchesByDay(sport: Sport, day: string): Promise<Match[]>;
  getMatch(id: string): Promise<Match | undefined>;
  getTopMatch(sport: Sport): Promise<Match | undefined>;
  getLeaderboard(sport: Sport, period: LeaderboardPeriod): Promise<LeaderboardEntry[]>;
  getGroups(sport: Sport): Promise<Group[]>;
  getMyStats(sport: Sport): Promise<UserStats>;
  saveTip(matchId: string, tip: Score): Promise<Match>;
}
