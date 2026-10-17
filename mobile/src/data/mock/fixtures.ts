import type { Group, LeaderboardEntry, Match, Sport, UserStats } from '../types';
import { teams as T } from './teams';

/** Fixes "Heute" der Beispieldaten, damit Screens reproduzierbar sind. */
export const MOCK_TODAY = '2026-10-17';

const at = (day: string, time: string) => `${day}T${time}:00+02:00`;
const c = (home: number, draw: number, away: number, total: number) => ({ home, draw, away, total });

export const matches: Match[] = [
  // ---------- Fußball ----------
  { id: 'f1', sport: 'football', leagueId: 'bl', round: '7. Spieltag', kickoff: at('2026-10-17', '15:30'), venue: 'Red Bull Arena', home: T.rbl, away: T.scf, status: 'scheduled', myTip: { home: 2, away: 0 }, community: c(58, 24, 18, 3120) },
  { id: 'f2', sport: 'football', leagueId: 'bl', round: '7. Spieltag', kickoff: at('2026-10-17', '15:30'), venue: 'Mewa Arena', home: T.m05, away: T.wob, status: 'scheduled', community: c(41, 30, 29, 2210) },
  { id: 'f3', sport: 'football', leagueId: 'abl', round: '10. Runde', kickoff: at('2026-10-17', '17:00'), venue: 'Allianz Stadion', home: T.rap, away: T.fak, status: 'scheduled', myTip: { home: 1, away: 1 }, community: c(49, 28, 23, 1876) },
  { id: 'f4', sport: 'football', leagueId: 'bl', round: '7. Spieltag', kickoff: at('2026-10-17', '18:30'), venue: 'Allianz Arena', home: T.fcb, away: T.bvb, status: 'scheduled', myTip: { home: 2, away: 1 }, community: c(54, 22, 24, 4812), topMatch: true },
  { id: 'f5', sport: 'football', leagueId: 'pl', round: 'Matchweek 8', kickoff: at('2026-10-17', '18:30'), venue: 'Emirates Stadium', home: T.ars, away: T.mci, status: 'scheduled', community: c(38, 27, 35, 3990) },
  { id: 'f6', sport: 'football', leagueId: 'seriea', round: '8ª Giornata', kickoff: at('2026-10-17', '20:45'), venue: 'San Siro', home: T.int, away: T.juv, status: 'scheduled', community: c(47, 31, 22, 2650) },
  { id: 'f7', sport: 'football', leagueId: 'laliga', round: 'Jornada 9', kickoff: at('2026-10-18', '16:15'), venue: 'Santiago Bernabéu', home: T.rma, away: T.bar, status: 'scheduled', community: c(44, 21, 35, 5230) },
  { id: 'f8', sport: 'football', leagueId: 'ligue1', round: '8e journée', kickoff: at('2026-10-18', '20:45'), venue: 'Parc des Princes', home: T.psg, away: T.om, status: 'scheduled', community: c(63, 20, 17, 2140) },
  { id: 'f9', sport: 'football', leagueId: 'abl', round: '10. Runde', kickoff: at('2026-10-18', '17:00'), venue: 'Red Bull Arena', home: T.rbs, away: T.stu, status: 'scheduled', community: c(46, 26, 28, 1540) },
  { id: 'f10', sport: 'football', leagueId: 'pl', round: 'Matchweek 8', kickoff: at('2026-10-16', '21:00'), venue: 'Anfield', home: T.liv, away: T.che, status: 'finished', result: { home: 2, away: 1 }, myTip: { home: 2, away: 1 }, community: c(55, 23, 22, 4011) },
  // ---------- Eishockey (National League) ----------
  { id: 'h1', sport: 'hockey', leagueId: 'nl', round: '14. Runde', kickoff: at('2026-10-17', '19:45'), venue: 'Swiss Life Arena', home: T.zsc, away: T.hcd, status: 'scheduled', myTip: { home: 4, away: 2 }, community: c(52, 18, 30, 1984), topMatch: true },
  { id: 'h2', sport: 'hockey', leagueId: 'nl', round: '14. Runde', kickoff: at('2026-10-17', '19:45'), venue: 'PostFinance Arena', home: T.scb, away: T.evz, status: 'scheduled', community: c(40, 21, 39, 1420) },
  { id: 'h3', sport: 'hockey', leagueId: 'nl', round: '14. Runde', kickoff: at('2026-10-17', '19:45'), venue: 'Patinoire des Vernets', home: T.gsh, away: T.fgo, status: 'scheduled', myTip: { home: 3, away: 3 }, community: c(45, 22, 33, 1210) },
  { id: 'h4', sport: 'hockey', leagueId: 'nl', round: '14. Runde', kickoff: at('2026-10-17', '20:00'), venue: 'Cornèr Arena', home: T.hcl, away: T.amb, status: 'scheduled', community: c(57, 17, 26, 1650) },
  { id: 'h5', sport: 'hockey', leagueId: 'nl', round: '15. Runde', kickoff: at('2026-10-18', '15:45'), venue: 'St. Galler Kantonalbank Arena', home: T.scr, away: T.ehk, status: 'scheduled', community: c(48, 20, 32, 980) },
  { id: 'h6', sport: 'hockey', leagueId: 'nl', round: '15. Runde', kickoff: at('2026-10-18', '15:45'), venue: 'Vaudoise Aréna', home: T.lhc, away: T.bie, status: 'scheduled', community: c(44, 21, 35, 1102) },
  { id: 'h7', sport: 'hockey', leagueId: 'nl', round: '15. Runde', kickoff: at('2026-10-18', '17:00'), venue: 'Raiffeisen Arena', home: T.ajo, away: T.scl, status: 'scheduled', community: c(36, 22, 42, 870) },
  { id: 'h8', sport: 'hockey', leagueId: 'nl', round: '13. Runde', kickoff: at('2026-10-16', '19:45'), venue: 'Eisstadion Davos', home: T.hcd, away: T.evz, status: 'finished', result: { home: 3, away: 2 }, myTip: { home: 2, away: 1 }, community: c(50, 19, 31, 1690) },
];

const lb = (rank: number, name: string, points: number, trend: LeaderboardEntry['trend'], isMe = false): LeaderboardEntry => ({
  rank,
  userId: `u${rank}`,
  name,
  initials: name.replace('Du · ', '').split(/[\s.]+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
  points,
  trend,
  isMe,
});

export const leaderboards: Record<Sport, LeaderboardEntry[]> = {
  football: [
    lb(1, 'Jonas W.', 2315, 'same'), lb(2, 'Lena K.', 2140, 'up'), lb(3, 'Sophie R.', 2006, 'down'),
    lb(4, 'Emil H.', 1988, 'up'), lb(5, 'Mara S.', 1942, 'down'), lb(6, 'David P.', 1910, 'up'),
    lb(7, 'Felix B.', 1897, 'same'), lb(128, 'Du · Markus B.', 1284, 'up', true),
  ],
  hockey: [
    lb(1, 'Reto M.', 1460, 'up'), lb(2, 'Nina Z.', 1392, 'same'), lb(3, 'Luca F.', 1355, 'up'),
    lb(4, 'Andrea G.', 1301, 'down'), lb(5, 'Simon K.', 1288, 'up'), lb(6, 'Claudia B.', 1240, 'down'),
    lb(7, 'Marco T.', 1199, 'same'), lb(42, 'Du · Markus B.', 812, 'up', true),
  ],
};

export const groups: Group[] = [
  { id: 'g0', name: 'Tippety Challenge', sport: 'both', members: 48210, myRank: 128, weekDelta: 64, inviteCode: 'TIPPETY', kind: 'challenge', subtitle: 'Saison 26/27 · Endet in 212 Tagen' },
  { id: 'g1', name: 'Büro-Liga', sport: 'football', members: 12, myRank: 2, weekDelta: 38, inviteCode: 'BUERO7', kind: 'private' },
  { id: 'g2', name: 'Stammtisch Ottakring', sport: 'football', members: 8, myRank: 5, weekDelta: 12, inviteCode: 'OTTA16', kind: 'private' },
  { id: 'g3', name: 'Familie Brenner', sport: 'both', members: 6, myRank: 1, weekDelta: 21, inviteCode: 'FAM123', kind: 'private' },
  { id: 'g4', name: 'Puck Buddies', sport: 'hockey', members: 9, myRank: 3, weekDelta: 17, inviteCode: 'PUCK44', kind: 'private' },
];

export const myStats: Record<Sport, UserStats> = {
  football: { userId: 'me', name: 'Markus B.', initials: 'MB', points: 1284, hits: 38, tips: 52, rank: 128, streak: { done: 5, of: 7 } },
  hockey: { userId: 'me', name: 'Markus B.', initials: 'MB', points: 812, hits: 21, tips: 34, rank: 42, streak: { done: 5, of: 7 } },
};
