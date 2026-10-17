export type Sport = 'football' | 'hockey';

export type Team = {
  id: string;
  name: string;
  /** Kurzname für Listen (z. B. „FC Bayern“) */
  shortName?: string;
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
  flag: string;
  /** Kürzel fürs Liga-Badge */
  code: string;
  color: string;
  /** false = „bald verfügbar“, noch nicht wählbar */
  available: boolean;
};

/** = matches.status in Supabase. postponed/cancelled sind gesperrt (tip_locked). */
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';

export type Score = { home: number; away: number };

/** Wie wurde das Spiel entschieden (Eishockey): reguläre Zeit, Verlängerung, Penaltyschießen */
export type Decision = 'regular' | 'overtime' | 'shootout';

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
  /** Wertungsergebnis: Fußball nach 90 Min, Eishockey nach 60 Min */
  result?: Score;
  /** Endergebnis inkl. n.V./n.P. (nur wenn abweichend) */
  finalResult?: Score;
  decision?: Decision;
  myTip?: Score;
  community: CommunityTips;
  topMatch?: boolean;
};

export type LeaderboardPeriod = 'season' | 'round' | 'month';

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  nickname: string;
  initials: string;
  points: number;
  trend: 'up' | 'down' | 'same';
  isMe?: boolean;
};

export type Group = {
  id: string;
  name: string;
  /** Ligen der Gruppe (Anzeige nur geschnitten mit den Ligen des Users) */
  leagueIds: string[];
  members: number;
  myRank: number;
  weekDelta: number;
  inviteCode: string;
  isPrivate: boolean;
  leader: string;
  memberInitials: string[];
};

export type UserStats = {
  points: number;
  hits: number;
  tips: number;
  rank: number;
  /** Liga, auf die sich der Rang bezieht */
  leagueId: string;
};

export type OpenRoundTips = {
  leagueId: string;
  leagueName: string;
  round: string;
  total: number;
  open: Match[];
  tipped: Match[];
};

export type NewGroup = { name: string; leagueIds: string[]; isPrivate: boolean };
