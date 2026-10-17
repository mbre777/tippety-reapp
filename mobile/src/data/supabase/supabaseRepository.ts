import type { TippetyRepository } from '../repository';
import type { Group, LeaderboardEntry, Match, Score, Team } from '../types';
import { notifyTipsChanged } from '../events';
import { leagueCatalog } from '../leagueCatalog';
import { supabase } from './client';
import { initialsOf } from '@/lib/initials';
import { normalizeCode } from '@/lib/inviteCode';

/**
 * GERÜST: Supabase-Implementierung, exakt am Schema aus PR #2 ausgerichtet:
 *  Tabellen leagues, teams, matches, tips (lesen), user_leagues (direkt schreibbar),
 *  RPCs upsert_tip, create_group, join_group_by_code, leave_group, Views leaderboard_league / leaderboard_group.
 * Was das Schema (noch) nicht hat, ist mit „OFFEN“ markiert → docs/client-api-vertrag.md.
 */
type TeamRow = { id: string; name: string; short_name: string | null; logo_url: string | null };
type MatchRow = {
  id: string; sport: Match['sport']; league_id: string; round: string | null; kickoff_at: string; status: Match['status'];
  home_regular: number | null; away_regular: number | null; home_final: number | null; away_final: number | null; decided_by: Match['decision'] | null;
  home: TeamRow; away: TeamRow;
};
const SELECT = 'id,sport,league_id,round,kickoff_at,status,home_regular,away_regular,home_final,away_final,decided_by,' +
  'home:teams!matches_home_team_id_fkey(id,name,short_name,logo_url),away:teams!matches_away_team_id_fkey(id,name,short_name,logo_url)';

// OFFEN: teams hat keine Vereinsfarben/Kürzel → neutrales Wappen; logo_url später im Crest anzeigen.
const team = (t: TeamRow): Team => ({ id: t.id, name: t.name, shortName: t.short_name ?? undefined, short: (t.short_name ?? t.name).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), colors: ['#5D6E86', '#FFFFFF'] });
const pair = (h: number | null, a: number | null): Score | undefined => (h != null && a != null ? { home: h, away: a } : undefined);
const toMatch = (r: MatchRow, tip?: Score): Match => ({
  id: r.id, sport: r.sport, leagueId: r.league_id, round: r.round ?? '', kickoff: r.kickoff_at, venue: '', status: r.status,
  home: team(r.home), away: team(r.away),
  // Wertung: Fußball *_final, Eishockey *_regular (nach 60 Min) – wie score_match()
  result: r.sport === 'hockey' ? pair(r.home_regular, r.away_regular) : pair(r.home_final, r.away_final),
  finalResult: pair(r.home_final, r.away_final),
  decision: r.decided_by ?? undefined,
  myTip: tip,
  community: { home: 0, draw: 0, away: 0, total: 0 }, // OFFEN: Community-Verteilung vor Anstoß (RLS erlaubt fremde Tipps erst ab Anstoß)
});
const ok = <T,>(res: { data: T | null; error: unknown }): T => {
  if (res.error) throw mapDbError(res.error);
  return res.data as T;
};
const ERR: Record<string, string> = { tip_locked: 'Tippschluss erreicht', invalid_tip: 'Ungültiger Tipp', invalid_code: 'Code ungültig', already_member: 'Du bist schon in dieser Gruppe', not_member: 'Du bist nicht in dieser Gruppe', invalid_group_name: 'Ungültiger Gruppenname', not_authenticated: 'Bitte erneut anmelden' };
const mapDbError = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? String(e);
  return new Error(ERR[m] ?? m);
};
const nowIso = () => new Date().toISOString();
async function uid() {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error('Nicht angemeldet');
  return user.id;
}
/** Eigene Tipps separat laden – tips ist ab Anstoß für alle lesbar, daher immer auf user_id filtern. */
async function withMyTips(rows: MatchRow[]): Promise<Match[]> {
  if (!rows.length) return [];
  const me = await uid();
  const tips = ok(await supabase().from('tips').select('match_id,home,away').eq('user_id', me).in('match_id', rows.map((r) => r.id))) as { match_id: string; home: number; away: number }[];
  const by = new Map(tips.map((t) => [t.match_id, { home: t.home, away: t.away }]));
  return rows.map((r) => toMatch(r, by.get(r.id)));
}
const matches = () => supabase().from('matches').select(SELECT);

type LbRow = { league_id: string | null; user_id: string; nickname: string; points: number; exact_hits: number; diff_hits: number; tendency_hits: number; rank: number };
const toEntry = (r: LbRow, me: string): LeaderboardEntry => ({ rank: r.rank, userId: r.user_id, nickname: r.nickname, initials: initialsOf(r.nickname), points: r.points, trend: 'same', isMe: r.user_id === me }); // OFFEN: Trend (Vorwoche)

async function loadGroups(filter?: (q: ReturnType<typeof groupQuery>) => ReturnType<typeof groupQuery>): Promise<Group[]> {
  const me = await uid();
  let q = groupQuery();
  if (filter) q = filter(q);
  const rows = ok(await q) as unknown as { id: string; name: string; invite_code: string; owner_id: string; group_members: { user_id: string; joined_at: string }[] }[];
  if (!rows.length) return [];
  const lb = ok(await supabase().from('leaderboard_group').select('group_id,league_id,user_id,nickname,points,rank').is('league_id', null).in('group_id', rows.map((g) => g.id))) as (LbRow & { group_id: string })[];
  return rows.map((g) => {
    const board = lb.filter((r) => r.group_id === g.id).sort((a, b) => a.rank - b.rank);
    const mine = board.find((r) => r.user_id === me);
    return {
      id: g.id, name: g.name, inviteCode: g.invite_code, isPrivate: true, // Schema: Beitritt immer per Code
      members: g.group_members.length, myRank: mine?.rank ?? board.length, weekDelta: 0, // OFFEN: Punkte „diese Woche“
      leader: board[0] ? (board[0].user_id === me ? 'me' : board[0].nickname) : '—',
      memberInitials: board.slice(0, 4).map((r) => initialsOf(r.nickname)),
      leagueIds: leagueCatalog.map((l) => l.id), // OFFEN: Gruppen haben im Schema keine Ligen → alle eigenen Ligen
    };
  });
}
const groupQuery = () => supabase().from('groups').select('id,name,invite_code,owner_id,group_members(user_id,joined_at)');

export const supabaseRepository: TippetyRepository = {
  async getLeagues() {
    return leagueCatalog;
  },
  async getMatchesByDay(sport, day, ids) {
    if (!ids.length) return [];
    const from = new Date(`${day}T00:00:00`).toISOString(); // lokale Tagesgrenzen des Geräts
    const to = new Date(`${day}T23:59:59.999`).toISOString();
    return withMyTips(ok(await matches().eq('sport', sport).in('league_id', ids).gte('kickoff_at', from).lte('kickoff_at', to).order('kickoff_at')) as unknown as MatchRow[]);
  },
  async getMatch(id) {
    const row = ok(await matches().eq('id', id).maybeSingle()) as unknown as MatchRow | null;
    return row ? (await withMyTips([row]))[0] : undefined;
  },
  async getTopMatches(sport, ids, limit = 5) {
    // OFFEN: kein Topspiel-Flag im Schema → nächste anstehende Spiele der eigenen Ligen
    if (!ids.length) return [];
    return withMyTips(ok(await matches().eq('sport', sport).in('league_id', ids).eq('status', 'scheduled').gt('kickoff_at', nowIso()).order('kickoff_at').limit(limit)) as unknown as MatchRow[]);
  },
  async getNextOpenMatch(afterId, ids) {
    const cur = await this.getMatch(afterId);
    if (!ids.length) return undefined;
    const open = (await withMyTips(ok(await matches().in('league_id', ids).eq('status', 'scheduled').gt('kickoff_at', nowIso()).neq('id', afterId).order('kickoff_at').limit(50)) as unknown as MatchRow[]))
      .filter((m) => !m.myTip && (!cur || m.sport === cur.sport));
    return open.find((m) => m.leagueId === cur?.leagueId) ?? open[0];
  },
  async getRoundTips(leagueId) {
    const next = ok(await supabase().from('matches').select('round').eq('league_id', leagueId).eq('status', 'scheduled').gt('kickoff_at', nowIso()).order('kickoff_at').limit(1)) as { round: string | null }[];
    if (!next.length) return undefined;
    const round = next[0].round ?? '';
    const all = await withMyTips(ok(await matches().eq('league_id', leagueId).eq('round', round).order('kickoff_at')) as unknown as MatchRow[]);
    const now = Date.now();
    return {
      leagueId, round, leagueName: leagueCatalog.find((l) => l.id === leagueId)?.name ?? '', total: all.length,
      open: all.filter((m) => !m.myTip && m.status === 'scheduled' && Date.parse(m.kickoff) > now),
      tipped: all.filter((m) => !!m.myTip),
    };
  },
  async getLeaderboard(leagueId, period) {
    // OFFEN: leaderboard_league ist Saison-Gesamt; „Spieltag“/„Monat“ fehlen im Schema → vorerst Saison.
    void period;
    const me = await uid();
    const sb = supabase();
    const top = ok(await sb.from('leaderboard_league').select('*').eq('league_id', leagueId).order('rank').limit(7)) as LbRow[];
    const mine = ok(await sb.from('leaderboard_league').select('*').eq('league_id', leagueId).eq('user_id', me).maybeSingle()) as LbRow | null;
    const rows = top.map((r) => toEntry(r, me));
    if (mine && !rows.some((r) => r.isMe)) rows.push(toEntry(mine, me));
    return rows;
  },
  async getGroups(ids) {
    void ids; // Gruppen haben keine Ligen im Schema (OFFEN) → alle eigenen Gruppen
    return loadGroups();
  },
  async findGroupByCode(code) {
    // OFFEN: Vorschau vor dem Beitritt nicht möglich (groups nur für Mitglieder lesbar). Platzhalter:
    const c = normalizeCode(code);
    return { id: `code:${c}`, name: `Gruppe ${c.slice(0, 4)}-${c.slice(4)}`, leagueIds: [], members: 0, myRank: 0, weekDelta: 0, inviteCode: c, isPrivate: true, leader: '—', memberInitials: [] };
  },
  async joinGroup(code) {
    const g = ok(await supabase().rpc('join_group_by_code', { p_code: normalizeCode(code) })) as { id: string };
    return (await loadGroups((q) => q.eq('id', g.id)))[0];
  },
  async createGroup(g) {
    // Schema: create_group(p_name) – Ligen/Sichtbarkeit der Gruppe gibt es (noch) nicht (OFFEN)
    const row = ok(await supabase().rpc('create_group', { p_name: g.name.trim() })) as { id: string };
    return (await loadGroups((q) => q.eq('id', row.id)))[0];
  },
  async leaveGroup(groupId) {
    ok(await supabase().rpc('leave_group', { p_group_id: groupId }));
  },
  async getMyStats(leagueId) {
    const me = await uid();
    const r = ok(await supabase().from('leaderboard_league').select('*').eq('league_id', leagueId).eq('user_id', me).maybeSingle()) as LbRow | null;
    const { count } = await supabase().from('tips').select('id', { count: 'exact', head: true }).eq('user_id', me).not('points', 'is', null);
    return { leagueId, points: r?.points ?? 0, hits: r ? r.exact_hits + r.diff_hits + r.tendency_hits : 0, tips: count ?? 0, rank: r?.rank ?? 0 };
  },
  async saveTip(matchId, tip: Score) {
    ok(await supabase().rpc('upsert_tip', { p_match_id: matchId, p_home: tip.home, p_away: tip.away }));
    notifyTipsChanged();
    const m = await this.getMatch(matchId);
    if (!m) throw new Error('Spiel nicht gefunden');
    return m;
  },
};
