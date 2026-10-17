import type { TippetyRepository } from '../repository';
import type { Group, Match } from '../types';
import { groups as G, joinableGroups, leaderboardFor, matches, myRank, myStatsBase } from './fixtures';
import { leagues } from './teams';
import { notifyTipsChanged } from '../events';
import { getSession } from '@/auth/session';
import { normalizeCode, randomCode } from '@/lib/inviteCode';

const delay = <T,>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), 0));
const store: Match[] = matches.map((m) => ({ ...m }));
const myGroups: Group[] = G.map((g) => ({ ...g }));
const byKick = (a: Match, b: Match) => `${a.kickoff}|${a.id}`.localeCompare(`${b.kickoff}|${b.id}`);
const isOpen = (m: Match, now = Date.now()) => m.status === 'scheduled' && Date.parse(m.kickoff) > now;
const nick = () => getSession().profile?.nickname ?? 'du';

export const mockRepository: TippetyRepository = {
  getLeagues: () => delay(leagues),
  getMatchesByDay: (sport, day, ids) => delay(store.filter((m) => m.sport === sport && ids.includes(m.leagueId) && m.kickoff.startsWith(day)).sort(byKick)),
  getMatch: (id) => delay(store.find((m) => m.id === id)),
  getTopMatches: (sport, ids, limit = 5) => delay(store.filter((m) => m.sport === sport && ids.includes(m.leagueId) && m.topMatch && m.status === 'scheduled').sort(byKick).slice(0, limit)),
  getNextOpenMatch: (afterId, ids) => {
    const cur = store.find((m) => m.id === afterId);
    const open = store.filter((m) => m.id !== afterId && ids.includes(m.leagueId) && !m.myTip && isOpen(m) && (!cur || m.sport === cur.sport)).sort(byKick);
    const same = cur ? open.filter((m) => m.leagueId === cur.leagueId) : [];
    return delay(same[0] ?? open[0]);
  },
  getRoundTips: (leagueId) => {
    const upcoming = store.filter((m) => m.leagueId === leagueId && isOpen(m)).sort(byKick);
    if (!upcoming.length) return delay(undefined);
    const round = upcoming[0].round;
    const all = store.filter((m) => m.leagueId === leagueId && m.round === round).sort(byKick);
    return delay({
      leagueId,
      leagueName: leagues.find((l) => l.id === leagueId)?.name ?? leagueId,
      round,
      total: all.length,
      open: all.filter((m) => !m.myTip && isOpen(m)),
      tipped: all.filter((m) => !!m.myTip),
    });
  },
  getLeaderboard: (leagueId, period) => delay(leaderboardFor(leagueId, period, nick())),
  getGroups: (ids) => delay(myGroups.filter((g) => g.leagueIds.some((l) => ids.includes(l)))),
  findGroupByCode: (code) => delay(joinableGroups.find((g) => g.inviteCode === normalizeCode(code)) ?? myGroups.find((g) => g.inviteCode === normalizeCode(code))),
  joinGroup: (code) => {
    const g = joinableGroups.find((x) => x.inviteCode === normalizeCode(code));
    if (!g) return Promise.reject(new Error('Code ungültig'));
    if (!myGroups.some((x) => x.id === g.id)) myGroups.push({ ...g, members: g.members + 1 });
    return delay(g);
  },
  createGroup: ({ name, leagueIds, isPrivate }) => {
    const g: Group = { id: `n${Date.now()}`, name: name.trim(), leagueIds, isPrivate, members: 1, myRank: 1, weekDelta: 0, inviteCode: randomCode(), leader: 'me', memberInitials: [nick().slice(0, 2).toUpperCase()] };
    myGroups.unshift(g);
    return delay(g);
  },
  leaveGroup: (groupId) => {
    const i = myGroups.findIndex((g) => g.id === groupId);
    if (i >= 0) myGroups.splice(i, 1);
    return delay(undefined);
  },
  getMyStats: (leagueId) => delay({ ...(myStatsBase[leagueId] ?? { points: 0, hits: 0, tips: 0 }), rank: myRank(leagueId), leagueId }),
  saveTip: (matchId, tip) => {
    const m = store.find((x) => x.id === matchId);
    if (!m) return Promise.reject(new Error('Spiel nicht gefunden'));
    // Tippschluss ab Anstoß (serverseitig zusätzlich per RLS/Trigger erzwungen)
    if (!isOpen(m)) return Promise.reject(new Error('Tippschluss erreicht'));
    m.myTip = tip;
    notifyTipsChanged();
    return delay({ ...m });
  },
};

/** Nur Demo/Screenshots: alle offenen Spiele des nächsten Spieltags einer Liga tippen. */
export function mockTipWholeRound(leagueId: string) {
  const up = store.filter((m) => m.leagueId === leagueId && isOpen(m)).sort(byKick);
  if (!up.length) return;
  store.filter((m) => m.leagueId === leagueId && m.round === up[0].round && isOpen(m) && !m.myTip).forEach((m, i) => (m.myTip = { home: 2 + (i % 2), away: 1 }));
  notifyTipsChanged();
}
