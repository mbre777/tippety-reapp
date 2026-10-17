export type Sport = 'football' | 'hockey';

export type Team = {
  id: string;
  name: string;
  /** Kürzel fürs Platzhalter-Wappen, max. 3–4 Zeichen */
  short: string;
  /** Vereinsfarben: [Grundfarbe, Schriftfarbe] */
  colors: [string, string];
};

export type League = {
  id: string;
  sport: Sport;
  name: string;
  country: string;
};

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export type Score = { home: number; away: number };

export type CommunityTips = { home: number; draw: number; away: number; total: number };

export type Match = {
  id: string;
  sport: Sport;
  leagueId: string;
  round: string;
  /** ISO-Zeitpunkt des Anpfiffs / Bully */
  kickoff: string;
  venue: string;
  home: Team;
  away: Team;
  status: MatchStatus;
  result?: Score;
  myTip?: Score;
  community: CommunityTips;
  topMatch?: boolean;
};

export type LeaderboardPeriod = 'total' | 'week' | 'month' | 'group';

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  initials: string;
  points: number;
  trend: 'up' | 'down' | 'same';
  isMe?: boolean;
};

export type Group = {
  id: string;
  name: string;
  sport: Sport | 'both';
  members: number;
  myRank: number;
  weekDelta: number;
  inviteCode: string;
  kind: 'challenge' | 'private';
  subtitle?: string;
};

export type UserStats = {
  userId: string;
  name: string;
  initials: string;
  points: number;
  hits: number;
  tips: number;
  rank: number;
  streak: { done: number; of: number };
  /** Lieblingsliga je Sportart (für die Header-Pill) */
  favoriteLeagueId: string;
};

export type OpenRoundTips = {
  leagueId: string;
  leagueName: string;
  round: string;
  open: Match[];
};
