import type { TippetyRepository } from '../repository';
import type { CommunityTips, Group, LeaderboardEntry, LeaderboardPeriod, Match, Score, Team } from '../types';
import { notifyTipsChanged } from '../events';
import { leagueCatalog } from '../leagueCatalog';
import { supabase } from './client';
import { tryFeature } from './features';
import { initialsOf } from '@/lib/initials';
import { resolveTeamColors, validHex } from '@/lib/teamColors';
import { normalizeCode } from '@/lib/inviteCode';

/**
 * Supabase-Implementierung gegen das live Schema (Migrationen 0001–0004) mit Feature-Detection
 * für Migration 0005 (feat/schema-client-gaps). Fehlt eine Spalte/RPC → bisherige Ersatzlösung.
 * Vertrag: docs/client-api-vertrag.md
 */
type TeamRow = { id: string; name: string; short_name: string | null; color?: string | null; primary_color?: string | null; secondary_color?: string | null; text_color?: string | null; short_display_name?: string | null };
type MatchRow = {
  id: string; sport: Match['sport']; league_id: string; round: string | null; kickoff_at: string; status: Match['status'];
  home_regular: number | null; away_regular: number | null; home_final: number | null; away_final: number | null; decided_by: Match['decision'] | null;
  is_top_match?: boolean | null; matchday?: number | null; venue?: string | null;
  home: TeamRow; away: TeamRow;
};
const BASE = 'id,sport,league_id,round,kickoff_at,status,home_regular,away_regular,home_final,away_final,decided_by';
// Keine Vereinslogos: logo_url wird bewusst nicht geladen.
const TEAM_BASE = 'id,name,short_name';
/** level 3 = + teams.short_display_name (Kurzname, geplant), 2 = Vereinsfarben + 0005, 1 = nur 0005 (teams.color), 0 = Basis */
const sel = (level: 0 | 1 | 2 | 3) => {
  const t = level === 3 ? `${TEAM_BASE},color,primary_color,secondary_color,text_color,short_display_name` : level === 2 ? `${TEAM_BASE},color,primary_color,secondary_color,text_color` : level === 1 ? `${TEAM_BASE},color` : TEAM_BASE;
  return `${BASE}${level ? ',is_top_match,matchday,venue' : ''},home:teams!matches_home_team_id_fkey(${t}),away:teams!matches_away_team_id_fkey(${t})`;
};
type Builder = ReturnType<ReturnType<ReturnType<typeof supabase>['from']>['select']>;
type Res = PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>;
/** Spiele-Query: erst mit 0005-Spalten (is_top_match, matchday, venue, teams.color), sonst Basis-Spalten */
async function queryMatches(f: (b: Builder) => Res): Promise<unknown> {
  const level0 = async () => {
    const r = await f(supabase().from('matches').select(sel(0)));
    if (r.error) throw mapDbError(r.error);
    return r.data;
  };
  const level1 = () => tryFeature<unknown>('matches_0005', () => f(supabase().from('matches').select(sel(1))), level0);
  const level2 = () => tryFeature<unknown>('team_colors', () => f(supabase().from('matches').select(sel(2))), level1);
  return tryFeature<unknown>('team_short_display_name', () => f(supabase().from('matches').select(sel(3))), level2).catch((e) => {
    throw mapDbError(e);
  });
}
const many = async (f: (b: Builder) => Res) => ((await queryMatches(f)) ?? []) as MatchRow[];
const one = async (f: (b: Builder) => Res) => ((await queryMatches(f)) ?? null) as MatchRow | null;

/** Kürzel: short_name (aus colors/*.json „short“, z. B. „SCR“) – sonst aus dem Namen abgeleitet */
const abbr = (t: TeamRow) => {
  const s = t.short_name?.trim();
  if (s && s.length <= 4 && !/\s/.test(s)) return s.toUpperCase();
  const words = t.name.replace(/[^A-Za-zÄÖÜäöü\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
  return (words.length >= 2 ? words.slice(0, 3).map((w) => w[0]).join('') : (words[0] ?? t.name).slice(0, 3)).toUpperCase();
};
const team = (t: TeamRow): Team => {
  // primary_color (neu) → color (Alias/alt) → neutral
  const c = resolveTeamColors(t.primary_color ?? t.color, t.secondary_color, t.text_color);
  const s = t.short_name?.trim();
  return { id: t.id, name: t.name, // Kurzname kommt aus eigenem DB-Feld (short_display_name); short_name ist das Kürzel. Fehlt er → voller Name.
    shortName: t.short_display_name?.trim() || (s && s.length > 4 ? s : undefined), short: abbr(t), colors: [c.bg, c.fg], secondary: validHex(t.secondary_color), noColors: c.fallback };
};
const pair = (h: number | null, a: number | null): Score | undefined => (h != null && a != null ? { home: h, away: a } : undefined);
const EMPTY_COMMUNITY: CommunityTips = { home: 0, draw: 0, away: 0, total: 0 };
const toMatch = (r: MatchRow, tip?: Score): Match => ({
  id: r.id, sport: r.sport, leagueId: r.league_id, round: r.round ?? (r.matchday != null ? `${r.matchday}. Spieltag` : ''), kickoff: r.kickoff_at, venue: r.venue ?? '', status: r.status,
  home: team(r.home), away: team(r.away), topMatch: r.is_top_match ?? undefined, matchday: r.matchday ?? undefined,
  // Wertung wie score_match(): Fußball *_final, Eishockey *_regular (nach 60 Min)
  result: r.sport === 'hockey' ? pair(r.home_regular, r.away_regular) : pair(r.home_final, r.away_final),
  finalResult: pair(r.home_final, r.away_final),
  decision: r.decided_by ?? undefined,
  myTip: tip,
  community: EMPTY_COMMUNITY,
});

const ERR: Record<string, string> = { tip_locked: 'Tippschluss erreicht', invalid_tip: 'Ungültiger Tipp', invalid_code: 'Code ungültig', already_member: 'Du bist schon in dieser Gruppe', not_member: 'Du bist nicht in dieser Gruppe', invalid_group_name: 'Ungültiger Gruppenname', not_authenticated: 'Bitte erneut anmelden' };
export const mapDbError = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? String(e);
  return new Error(ERR[m] ?? m);
};
const ok = <T,>(res: { data: T | null; error: unknown }): T => {
  if (res.error) throw mapDbError(res.error);
  return res.data as T;
};
const nowIso = () => new Date().toISOString();
async function uid() {
  const { data } = await supabase().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Nicht angemeldet');
  return id;
}
/** Eigene Tipps separat – tips ist ab Anstoß für alle lesbar, daher immer auf user_id filtern. */
async function withMyTips(rows: MatchRow[]): Promise<Match[]> {
  if (!rows.length) return [];
  const me = await uid();
  const tips = ok(await supabase().from('tips').select('match_id,home,away').eq('user_id', me).in('match_id', rows.map((r) => r.id))) as { match_id: string; home: number; away: number }[];
  const by = new Map(tips.map((t) => [t.match_id, { home: t.home, away: t.away }]));
  return rows.map((r) => toMatch(r, by.get(r.id)));
}
async function withCommunity(m: Match): Promise<Match> {
  const dist = await tryFeature<{ total: number; home_pct: number; draw_pct: number; away_pct: number }[] | null>(
    'tip_distribution',
    () => supabase().rpc('get_match_tip_distribution', { p_match_id: m.id }),
    async () => null,
  ).catch(() => null);
  const d = Array.isArray(dist) ? dist[0] : (dist as unknown as { total: number; home_pct: number; draw_pct: number; away_pct: number } | null);
  return d ? { ...m, community: { total: d.total, home: Math.round(d.home_pct), draw: Math.round(d.draw_pct), away: Math.round(d.away_pct) } } : m;
}

type LbRow = { league_id?: string | null; user_id: string; nickname: string; points: number; exact_hits: number; diff_hits: number; tendency_hits: number; rank: number; rank_change?: number | null; points_week?: number | null };
const toEntry = (r: LbRow, me: string): LeaderboardEntry => ({
  rank: r.rank, userId: r.user_id, nickname: r.nickname, initials: initialsOf(r.nickname), points: r.points, isMe: r.user_id === me,
  trend: r.rank_change == null || r.rank_change === 0 ? 'same' : r.rank_change > 0 ? 'up' : 'down',
});
const PERIOD: Record<LeaderboardPeriod, 'season' | 'matchday' | 'month'> = { season: 'season', round: 'matchday', month: 'month' };

type GroupRow = { id: string; name: string; invite_code: string; owner_id: string; is_private?: boolean | null; group_members: { user_id: string; joined_at: string }[]; group_leagues?: { league_id: string }[] };
async function loadGroups(onlyId?: string): Promise<Group[]> {
  const me = await uid();
  const run = (extra: boolean) => {
    let q = supabase().from('groups').select(`id,name,invite_code,owner_id,group_members(user_id,joined_at)${extra ? ',is_private,group_leagues(league_id)' : ''}`);
    if (onlyId) q = q.eq('id', onlyId);
    return q;
  };
  const rows = (await tryFeature<GroupRow[]>('groups_0005', () => run(true), async () => ok(await run(false)) as unknown as GroupRow[])) ?? [];
  if (!rows.length) return [];
  const lb = await tryFeature<(LbRow & { group_id: string })[]>(
    'lb_group_week',
    () => supabase().from('leaderboard_group').select('group_id,user_id,nickname,points,rank,points_week').is('league_id', null).in('group_id', rows.map((g) => g.id)),
    async () => ok(await supabase().from('leaderboard_group').select('group_id,user_id,nickname,points,rank').is('league_id', null).in('group_id', rows.map((g) => g.id))) as (LbRow & { group_id: string })[],
  );
  return rows.map((g) => {
    const board = (lb ?? []).filter((r) => r.group_id === g.id).sort((a, b) => a.rank - b.rank);
    const mine = board.find((r) => r.user_id === me);
    const known = Array.isArray(g.group_leagues) && g.group_leagues.length > 0;
    return {
      id: g.id, name: g.name, inviteCode: g.invite_code, isPrivate: g.is_private ?? true,
      members: g.group_members.length, myRank: mine?.rank ?? board.length, weekDelta: mine?.points_week ?? 0,
      leader: board[0] ? (board[0].user_id === me ? 'me' : board[0].nickname) : '—',
      memberInitials: board.slice(0, 4).map((r) => initialsOf(r.nickname)),
      // Ohne group_leagues: alle Ligen angenommen; die UI zeigt ohnehin nur die eigenen.
      leagueIds: known ? g.group_leagues!.map((x) => x.league_id) : leagueCatalog.map((l) => l.id),
      leaguesKnown: known,
    };
  });
}

export const supabaseRepository: TippetyRepository = {
  async getLeagues() {
    return leagueCatalog;
  },
  async getMatchesByDay(sport, day, ids) {
    if (!ids.length) return [];
    const from = new Date(`${day}T00:00:00`).toISOString(); // lokale Tagesgrenzen des Geräts
    const to = new Date(`${day}T23:59:59.999`).toISOString();
    return withMyTips(await many((b) => b.eq('sport', sport).in('league_id', ids).gte('kickoff_at', from).lte('kickoff_at', to).order('kickoff_at')));
  },
  async getMatch(id) {
    const row = await one((b) => b.eq('id', id).maybeSingle());
    return row ? withCommunity((await withMyTips([row]))[0]) : undefined;
  },
  async getTopMatches(sport, ids, limit = 5) {
    if (!ids.length) return [];
    const upcoming = await many((b) => b.eq('sport', sport).in('league_id', ids).eq('status', 'scheduled').gt('kickoff_at', nowIso()).order('kickoff_at').limit(40));
    // is_top_match (0005) wenn vorhanden und gesetzt, sonst nächste anstehende Spiele
    const flagged = upcoming.filter((m) => m.is_top_match);
    return withMyTips((flagged.length ? flagged : upcoming).slice(0, limit));
  },
  async getNextOpenMatch(afterId, ids) {
    if (!ids.length) return undefined;
    const cur = await one((b) => b.eq('id', afterId).maybeSingle());
    const open = (await withMyTips(await many((b) => b.in('league_id', ids).eq('status', 'scheduled').gt('kickoff_at', nowIso()).neq('id', afterId).order('kickoff_at').limit(50))))
      .filter((m) => !m.myTip && (!cur || m.sport === cur.sport));
    return open.find((m) => m.leagueId === cur?.league_id) ?? open[0];
  },
  async getRoundTips(leagueId) {
    const next = await many((b) => b.eq('league_id', leagueId).eq('status', 'scheduled').gt('kickoff_at', nowIso()).order('kickoff_at').limit(1));
    if (!next.length) return undefined;
    const n = next[0];
    // Spieltag bevorzugt über matchday (0005), sonst über round-Text
    const all = await withMyTips(await many((b) => {
      const q = b.eq('league_id', leagueId);
      return (n.matchday != null ? q.eq('matchday', n.matchday) : n.round != null ? q.eq('round', n.round) : q.eq('id', n.id)).order('kickoff_at');
    }));
    const now = Date.now();
    return {
      leagueId, round: all[0]?.round ?? '', leagueName: leagueCatalog.find((l) => l.id === leagueId)?.name ?? '', total: all.length,
      open: all.filter((m) => !m.myTip && m.status === 'scheduled' && Date.parse(m.kickoff) > now),
      tipped: all.filter((m) => !!m.myTip),
    };
  },
  async getLeaderboard(leagueId, period) {
    const me = await uid();
    const sb = supabase();
    const fromView = async () => {
      // Fallback: Saison-View (ohne Zeitraum)
      const top = ok(await sb.from('leaderboard_league').select('*').eq('league_id', leagueId).order('rank').limit(7)) as LbRow[];
      const mine = ok(await sb.from('leaderboard_league').select('*').eq('league_id', leagueId).eq('user_id', me).maybeSingle()) as LbRow | null;
      return mine ? [...top, mine] : top;
    };
    const rows = period === 'season'
      ? await fromView()
      : await tryFeature<LbRow[]>('leaderboard_period', () => sb.rpc('leaderboard_period', { p_league_id: leagueId, p_group_id: null, p_period: PERIOD[period], p_matchday: null, p_month: null }), fromView);
    const sorted = [...(rows ?? [])].sort((a, b) => a.rank - b.rank);
    const out = sorted.slice(0, 7).map((r) => toEntry(r, me));
    const mine = sorted.find((r) => r.user_id === me);
    if (mine && !out.some((r) => r.isMe)) out.push(toEntry(mine, me));
    return out;
  },
  async getGroups(ids) {
    const gs = await loadGroups();
    return gs.filter((g) => !g.leaguesKnown || g.leagueIds.some((l) => ids.includes(l)) || ids.length === 0);
  },
  async findGroupByCode(code) {
    const c = normalizeCode(code);
    type Prev = { group_id: string; name: string; member_count: number; league_ids: string[] | null };
    const placeholder = async (): Promise<Prev[]> => [{ group_id: `code:${c}`, name: `Gruppe ${c.slice(0, 4)}-${c.slice(4)}`, member_count: 0, league_ids: null }];
    let rows: Prev[] | null;
    try {
      rows = await tryFeature<Prev[]>('preview_group', () => supabase().rpc('preview_group_by_code', { p_code: c }), placeholder);
    } catch (e) {
      if ((e as { message?: string }).message === 'invalid_code') return undefined;
      throw mapDbError(e);
    }
    const p = rows?.[0];
    if (!p) return undefined;
    return { id: p.group_id, name: p.name, leagueIds: p.league_ids ?? [], leaguesKnown: !!p.league_ids, members: p.member_count, myRank: 0, weekDelta: 0, inviteCode: c, isPrivate: true, leader: '—', memberInitials: [] };
  },
  async joinGroup(code) {
    const g = ok(await supabase().rpc('join_group_by_code', { p_code: normalizeCode(code) })) as { id: string };
    return (await loadGroups(g.id))[0];
  },
  async createGroup(g) {
    const sb = supabase();
    const row = await tryFeature<{ id: string }>(
      'create_group_v2',
      () => sb.rpc('create_group', { p_name: g.name.trim(), p_league_ids: g.leagueIds.length ? g.leagueIds : null, p_is_private: g.isPrivate }),
      async () => ok(await sb.rpc('create_group', { p_name: g.name.trim() })) as { id: string },
    ).catch((e) => { throw mapDbError(e); });
    return (await loadGroups(row.id))[0];
  },
  async leaveGroup(groupId) {
    ok(await supabase().rpc('leave_group', { p_group_id: groupId }));
  },
  async getMyStats(leagueId) {
    const me = await uid();
    const r = ok(await supabase().from('leaderboard_league').select('*').eq('league_id', leagueId).eq('user_id', me).maybeSingle()) as LbRow | null;
    const hits = r ? r.exact_hits + r.diff_hits + r.tendency_hits : 0;
    // Gewertete Tipps dieser Liga
    const { count } = await supabase().from('tips').select('id,matches!inner(league_id)', { count: 'exact', head: true }).eq('user_id', me).eq('matches.league_id', leagueId).not('points', 'is', null);
    return { leagueId, points: r?.points ?? 0, hits, tips: count ?? hits, rank: r?.rank ?? 0 };
  },
  async saveTip(matchId, tip: Score) {
    ok(await supabase().rpc('upsert_tip', { p_match_id: matchId, p_home: tip.home, p_away: tip.away }));
    notifyTipsChanged();
    const m = await this.getMatch(matchId);
    if (!m) throw new Error('Spiel nicht gefunden');
    return m;
  },
};
