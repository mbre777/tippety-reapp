import type { Group, LeaderboardEntry, Match, Score } from '../types';
import { teams as T } from './teams';
import { initialsOf } from '@/lib/initials';

/** Fixes "Heute" der Beispieldaten, damit Screens reproduzierbar sind. */
export const MOCK_TODAY = '2026-10-17';

const at = (day: string, time: string) => `${day}T${time}:00+02:00`;
const c = (home: number, draw: number, away: number, total: number) => ({ home, draw, away, total });
const s = (home: number, away: number): Score => ({ home, away });
const D0 = '2026-10-17';
const D1 = '2026-10-18';
const DM = '2026-10-16';

export const matches: Match[] = [
  // ---------- Bundesliga, 7. Spieltag ----------
  { id: 'bl1', sport: 'football', leagueId: 'bl', round: '7. Spieltag', kickoff: at(D0, '15:30'), venue: 'Red Bull Arena', home: T.rbl, away: T.sge, status: 'scheduled', myTip: s(1, 1), community: c(51, 26, 23, 2890) },
  { id: 'bl2', sport: 'football', leagueId: 'bl', round: '7. Spieltag', kickoff: at(D0, '15:30'), venue: 'Mewa Arena', home: T.m05, away: T.wob, status: 'scheduled', myTip: s(2, 1), community: c(41, 30, 29, 2210) },
  { id: 'bl3', sport: 'football', leagueId: 'bl', round: '7. Spieltag', kickoff: at(D0, '18:30'), venue: 'Allianz Arena', home: T.fcb, away: T.bvb, status: 'scheduled', community: c(54, 22, 24, 4812), topMatch: true },
  { id: 'bl4', sport: 'football', leagueId: 'bl', round: '7. Spieltag', kickoff: at(D1, '15:30'), venue: 'BayArena', home: T.b04, away: T.vfb, status: 'scheduled', community: c(49, 25, 26, 3010), topMatch: true },
  { id: 'bl5', sport: 'football', leagueId: 'bl', round: '7. Spieltag', kickoff: at(D1, '17:30'), venue: 'Europa-Park Stadion', home: T.scf, away: T.wob, status: 'scheduled', myTip: s(2, 0), community: c(46, 29, 25, 1730) },
  { id: 'bl0', sport: 'football', leagueId: 'bl', round: '6. Spieltag', kickoff: at(DM, '20:30'), venue: 'Signal Iduna Park', home: T.bvb, away: T.rbl, status: 'finished', result: s(2, 1), myTip: s(2, 1), community: c(55, 23, 22, 4011) },
  // ---------- AT Bundesliga ----------
  { id: 'at1', sport: 'football', leagueId: 'abl', round: '10. Runde', kickoff: at(D0, '17:00'), venue: 'Allianz Stadion', home: T.rap, away: T.fak, status: 'scheduled', myTip: s(1, 1), community: c(49, 28, 23, 1876), topMatch: true },
  { id: 'at2', sport: 'football', leagueId: 'abl', round: '10. Runde', kickoff: at(D1, '17:00'), venue: 'Red Bull Arena', home: T.rbs, away: T.stu, status: 'scheduled', community: c(46, 26, 28, 1540) },
  // ---------- CH Super League ----------
  { id: 'ch1', sport: 'football', leagueId: 'chsl', round: '11. Runde', kickoff: at(D0, '20:30'), venue: 'Letzigrund', home: T.fcz, away: T.gc, status: 'scheduled', community: c(52, 25, 23, 960) },
  { id: 'ch2', sport: 'football', leagueId: 'chsl', round: '11. Runde', kickoff: at(D1, '16:30'), venue: 'Wankdorf', home: T.yb, away: T.fcbs, status: 'scheduled', community: c(47, 27, 26, 1320), topMatch: true },
  // ---------- National League, Runde 14 ----------
  { id: 'nl1', sport: 'hockey', leagueId: 'nl', round: 'Runde 14', kickoff: at(D0, '19:45'), venue: 'Bossard Arena', home: T.evz, away: T.fgo, status: 'finished', result: s(3, 3), finalResult: s(4, 3), decision: 'shootout', myTip: s(2, 2), community: c(44, 20, 36, 1310) },
  { id: 'nl2', sport: 'hockey', leagueId: 'nl', round: 'Runde 14', kickoff: at(D0, '19:45'), venue: 'Patinoire des Vernets', home: T.gsh, away: T.lhc, status: 'scheduled', community: c(45, 22, 33, 1210) },
  { id: 'nl3', sport: 'hockey', leagueId: 'nl', round: 'Runde 14', kickoff: at(D0, '19:45'), venue: 'Tissot Arena', home: T.bie, away: T.ehk, status: 'scheduled', myTip: s(2, 4), community: c(40, 21, 39, 1080) },
  { id: 'nl4', sport: 'hockey', leagueId: 'nl', round: 'Runde 14', kickoff: at(D0, '20:00'), venue: 'Swiss Life Arena', home: T.zsc, away: T.scb, status: 'scheduled', community: c(44, 17, 39, 2390), topMatch: true },
  { id: 'nl5', sport: 'hockey', leagueId: 'nl', round: 'Runde 14', kickoff: at(D1, '15:45'), venue: 'zondacrypto Arena', home: T.hcd, away: T.hcl, status: 'scheduled', myTip: s(3, 2), community: c(57, 17, 26, 1650), topMatch: true },
  // ---------- NHL ----------
  { id: 'nhl0', sport: 'hockey', leagueId: 'nhl', round: 'Regular Season', kickoff: at(D0, '01:00'), venue: 'Rogers Place', home: T.edm, away: T.cgy, status: 'finished', result: s(2, 2), finalResult: s(3, 2), decision: 'overtime', myTip: s(3, 2), community: c(55, 18, 27, 640) },
  { id: 'nhl1', sport: 'hockey', leagueId: 'nhl', round: 'Regular Season', kickoff: at(D1, '01:00'), venue: 'Scotiabank Arena', home: T.tor, away: T.mtl, status: 'scheduled', community: c(53, 19, 28, 880), topMatch: true },
  { id: 'nhl2', sport: 'hockey', leagueId: 'nhl', round: 'Regular Season', kickoff: at(D1, '01:00'), venue: 'Madison Square Garden', home: T.nyr, away: T.bos, status: 'scheduled', community: c(48, 20, 32, 710) },
];

const BOARD_NAMES: Record<string, [string, number, LeaderboardEntry['trend']][]> = {
  bl: [['jonas_w', 331, 'same'], ['lena_k', 312, 'up'], ['sophie_r', 298, 'down'], ['emil_h', 287, 'up'], ['mara_s', 281, 'down'], ['david_p', 276, 'up'], ['tor_tobi', 270, 'same']],
  abl: [['rapidler', 288, 'up'], ['veilchen_99', 271, 'same'], ['mozart_kick', 262, 'down'], ['lena_k', 250, 'up'], ['grazer_jung', 244, 'up'], ['jonas_w', 239, 'down'], ['ottakringer', 230, 'same']],
  chsl: [['ybfan', 301, 'same'], ['basel_bebbi', 290, 'up'], ['zuri_ost', 276, 'down'], ['gc_hopper', 265, 'up'], ['mara_s', 259, 'same'], ['berner_baer', 248, 'up'], ['luca_f', 240, 'down']],
  nl: [['zsc_fan86', 204, 'same'], ['puckmaster', 188, 'up'], ['icequeen', 179, 'down'], ['hcd_lukas', 171, 'up'], ['mara_s', 166, 'down'], ['goalie_gian', 160, 'up'], ['nina_b', 157, 'same']],
  nhl: [['leafs_nation', 222, 'up'], ['habs4ever', 210, 'same'], ['oiler_olli', 199, 'down'], ['puckmaster', 191, 'up'], ['bruins_ben', 183, 'down'], ['icequeen', 176, 'same'], ['rangers_rae', 170, 'up']],
};
const ME: Record<string, [number, number]> = { bl: [128, 212], abl: [57, 188], chsl: [312, 140], nl: [42, 131], nhl: [215, 98] };

export function leaderboardFor(leagueId: string, period: 'season' | 'round' | 'month', myNick: string): LeaderboardEntry[] {
  const f = period === 'season' ? 1 : period === 'month' ? 0.31 : 0.07;
  const rows = (BOARD_NAMES[leagueId] ?? BOARD_NAMES.bl).map(([name, pts, trend], i) => ({
    rank: i + 1, userId: `${leagueId}-${name}`, nickname: name, initials: initialsOf(name), points: Math.round(pts * f + (period === 'season' ? 0 : (7 - i) % 3)), trend,
  }));
  const [rank, pts] = ME[leagueId] ?? [99, 100];
  rows.push({ rank: period === 'season' ? rank : Math.max(8, Math.round(rank * (period === 'month' ? 0.8 : 0.5))), userId: 'me', nickname: myNick, initials: initialsOf(myNick), points: Math.round(pts * f), trend: 'up', isMe: true } as LeaderboardEntry & { isMe: boolean });
  return rows;
}

export const myStatsBase: Record<string, { points: number; hits: number; tips: number }> = {
  bl: { points: 1284, hits: 38, tips: 52 },
  abl: { points: 812, hits: 21, tips: 34 },
  chsl: { points: 540, hits: 14, tips: 22 },
  nl: { points: 1284, hits: 38, tips: 52 },
  nhl: { points: 402, hits: 11, tips: 19 },
};
export const myRank = (leagueId: string) => ME[leagueId]?.[0] ?? 99;

const AV = ['MB', 'LK', 'JW', 'SR'];
export const groups: Group[] = [
  { id: 'g1', name: 'Büro-Liga', leagueIds: ['bl', 'pl', 'nl'], members: 12, myRank: 2, weekDelta: 38, inviteCode: 'BUEROLG7', isPrivate: true, leader: 'jonas_w', memberInitials: AV },
  { id: 'g2', name: 'Familie Brenner', leagueIds: ['bl'], members: 6, myRank: 1, weekDelta: 21, inviteCode: 'FAMBREN6', isPrivate: true, leader: 'me', memberInitials: AV },
  { id: 'g3', name: 'Stammtisch Ottakring', leagueIds: ['abl'], members: 9, myRank: 5, weekDelta: 9, inviteCode: 'OTTAKR16', isPrivate: true, leader: 'jonas_w', memberInitials: AV },
  { id: 'g4', name: 'Eishockey-Stammtisch', leagueIds: ['nl'], members: 8, myRank: 1, weekDelta: 24, inviteCode: 'PUCKST44', isPrivate: true, leader: 'me', memberInitials: AV },
  { id: 'g5', name: 'ZSC Fanclub Wien', leagueIds: ['nl'], members: 23, myRank: 7, weekDelta: 15, inviteCode: 'ZSCWIEN3', isPrivate: false, leader: 'jonas_w', memberInitials: AV },
];

/** Gruppen, denen man per Code beitreten kann (noch kein Mitglied). */
export const joinableGroups: Group[] = [
  { id: 'j1', name: 'Kicker-Runde Favoriten', leagueIds: ['bl', 'pl', 'abl'], members: 14, myRank: 15, weekDelta: 0, inviteCode: 'K7Q4MXP2', isPrivate: true, leader: 'lena_k', memberInitials: ['LK', 'EH', 'DP'] },
  { id: 'j2', name: 'Puck-Freunde Wien', leagueIds: ['nl', 'nhl'], members: 7, myRank: 8, weekDelta: 0, inviteCode: 'PUC9ZLW8', isPrivate: true, leader: 'icequeen', memberInitials: ['IQ', 'PM', 'NB'] },
];

/** Bereits vergebene Nicknames (case-insensitive) */
export const takenNicknames = ['markus', 'jonas_w', 'lena_k', 'sophie_r', 'emil_h', 'mara_s', 'david_p', 'tor_tobi', 'zsc_fan86', 'puckmaster', 'icequeen', 'max', 'anna'];
