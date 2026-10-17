import type { TippetyRepository } from '../repository';
import type { Match } from '../types';
import { groups, leaderboards, matches, myStats } from './fixtures';
import { leagues } from './teams';

const delay = <T,>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), 0));
const store: Match[] = matches.map((m) => ({ ...m }));

export const mockRepository: TippetyRepository = {
  getLeagues: (sport) => delay(leagues.filter((l) => l.sport === sport)),
  getMatchesByDay: (sport, day) =>
    delay(
      store
        .filter((m) => m.sport === sport && m.kickoff.startsWith(day))
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    ),
  getMatch: (id) => delay(store.find((m) => m.id === id)),
  getTopMatch: (sport) => delay(store.find((m) => m.sport === sport && m.topMatch)),
  getTopMatches: (sport, limit = 5) =>
    delay(
      store
        .filter((m) => m.sport === sport && m.topMatch && m.status === 'scheduled')
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
        .slice(0, limit),
    ),
  getNextOpenMatch: (sport, afterId) => {
    const cur = store.find((m) => m.id === afterId);
    const now = Date.now();
    const key = (m: Match) => `${m.kickoff}|${m.id}`;
    const open = store
      .filter((m) => m.sport === sport && m.id !== afterId && !m.myTip && m.status === 'scheduled' && Date.parse(m.kickoff) > now)
      .sort((a, b) => key(a).localeCompare(key(b)));
    const after = cur ? open.find((m) => key(m) > key(cur)) : undefined;
    return delay(after ?? open[0]);
  },
  countTipsOnDay: (sport, day) => delay(store.filter((m) => m.sport === sport && m.kickoff.startsWith(day) && m.myTip).length),
  getLeaderboard: (sport) => delay(leaderboards[sport]),
  getGroups: (sport) => delay(groups.filter((g) => g.sport === 'both' || g.sport === sport)),
  getMyStats: (sport) => delay(myStats[sport]),
  saveTip: (matchId, tip) => {
    const m = store.find((x) => x.id === matchId);
    if (!m) return Promise.reject(new Error('Spiel nicht gefunden'));
    if (Date.parse(m.kickoff) <= Date.now() && m.status !== 'scheduled') {
      return Promise.reject(new Error('Tippschluss erreicht'));
    }
    m.myTip = tip;
    return delay({ ...m });
  },
};
