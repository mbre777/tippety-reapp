import type { LeagueConfig, LeagueFetch, MatchStatus, NormMatch, NormSeason, NormTeam, ProviderAdapter } from '../types.ts';
import { Http } from '../core/http.ts';

const BASE = 'https://api.sportmonks.com/v3/football';

// Sportmonks state.developer_name -> eigener Status
const STATUS: Record<string, MatchStatus> = {
  NS: 'scheduled', TBA: 'scheduled', PENDING: 'scheduled',
  INPLAY_1ST_HALF: 'live', HT: 'live', INPLAY_2ND_HALF: 'live', BREAK: 'live', INPLAY_ET: 'live',
  EXTRA_TIME_BREAK: 'live', INPLAY_ET_2ND_HALF: 'live', PEN_BREAK: 'live', INPLAY_PENALTIES: 'live',
  FT: 'finished', AET: 'finished', FT_PEN: 'finished', AWARDED: 'finished', WO: 'finished',
  POSTPONED: 'postponed', DELAYED: 'postponed', SUSPENDED: 'postponed', INTERRUPTED: 'postponed',
  CANCELLED: 'cancelled', ABANDONED: 'cancelled', DELETED: 'cancelled',
};

interface SmScore { description: string; score: { goals: number; participant: 'home' | 'away' } }
interface SmParticipant { id: number; name: string; short_code: string | null; image_path: string | null; meta: { location: 'home' | 'away' } }
interface SmFixture {
  id: number; league_id: number; season_id: number; starting_at_timestamp: number | null; starting_at: string | null;
  state?: { developer_name: string }; venue?: { name: string } | null; round?: { name: string } | null;
  participants?: SmParticipant[]; scores?: SmScore[];
}

export class SportmonksAdapter implements ProviderAdapter {
  readonly provider = 'sportmonks' as const;
  private http = new Http();
  private warn: string[] = [];
  private fixtureCache = new Map<string, SmFixture[]>();
  constructor(private token: string) {}

  apiCalls() { return this.http.calls; }
  warnings() { return this.warn; }

  private url(path: string, params: Record<string, string> = {}) {
    const q = new URLSearchParams({ ...params, api_token: this.token });
    return `${BASE}${path}?${q}`;
  }

  async fetchLeagues(cfg: LeagueConfig): Promise<LeagueFetch> {
    const r = await this.http.json<{ data: { id: number; name: string; currentseason?: { id: number; name: string; starting_at?: string; ending_at?: string } } }>(
      this.url(`/leagues/${cfg.externalLeagueId}`, { include: 'currentSeason' }));
    const cs = r.data.currentseason;
    const season: NormSeason | null = cs ? {
      provider: this.provider, externalId: String(cs.id), leagueExternalId: cfg.externalLeagueId,
      name: cs.name.replace(/^(\d{4})\/\d{2}(\d{2})$/, '$1/$2'),
      startsOn: cs.starting_at ?? null, endsOn: cs.ending_at ?? null, isCurrent: true,
    } : null;
    if (!season) this.warn.push(`${cfg.key}: keine currentSeason`);
    return {
      league: {
        provider: this.provider, externalId: cfg.externalLeagueId, sport: cfg.sport, name: cfg.name,
        shortName: cfg.shortName, country: cfg.country, countryCode: cfg.countryCode,
        color: cfg.color ?? null, flagUrl: cfg.flagUrl ?? null,
      },
      season,
    };
  }

  private async fixtures(season: NormSeason): Promise<SmFixture[]> {
    const cached = this.fixtureCache.get(season.externalId);
    if (cached) return cached;
    const all: SmFixture[] = [];
    let next: string | null = this.url('/fixtures', {
      filters: `fixtureSeasons:${season.externalId}`, include: 'participants;scores;state;venue;round', per_page: '50',
    });
    while (next) {
      const r: { data?: SmFixture[]; pagination?: { has_more: boolean; next_page: string | null } } = await this.http.json(next);
      all.push(...(r.data ?? []));
      next = r.pagination?.has_more && r.pagination.next_page
        ? `${r.pagination.next_page}&api_token=${encodeURIComponent(this.token)}` : null;
    }
    this.fixtureCache.set(season.externalId, all);
    return all;
  }

  async fetchTeams(cfg: LeagueConfig, season: NormSeason | null): Promise<NormTeam[]> {
    if (!season) return [];
    const map = new Map<string, NormTeam>();
    for (const f of await this.fixtures(season)) {
      for (const p of f.participants ?? []) {
        map.set(String(p.id), {
          provider: this.provider, externalId: String(p.id), sport: cfg.sport, name: p.name,
          shortName: p.short_code ?? null, logoUrl: p.image_path ?? null, color: null,
        });
      }
    }
    return [...map.values()];
  }

  async fetchMatches(cfg: LeagueConfig, season: NormSeason | null): Promise<NormMatch[]> {
    if (!season) return [];
    const out: NormMatch[] = [];
    for (const f of await this.fixtures(season)) {
      if (String(f.league_id) !== cfg.externalLeagueId) continue;
      const home = f.participants?.find((p) => p.meta.location === 'home');
      const away = f.participants?.find((p) => p.meta.location === 'away');
      if (!home || !away) { this.warn.push(`${cfg.key}: Fixture ${f.id} ohne Heim/Gast`); continue; }
      const raw = f.state?.developer_name ?? 'UNKNOWN';
      let status = STATUS[raw];
      if (!status) { this.warn.push(`${cfg.key}: unbekannter Status ${raw} (Fixture ${f.id})`); status = 'scheduled'; }
      const goals = (desc: string, side: 'home' | 'away') =>
        f.scores?.find((s) => s.description === desc && s.score.participant === side)?.score.goals ?? null;
      const hasResult = status === 'finished' || status === 'live';
      const homeFinal = hasResult ? goals('CURRENT', 'home') : null;
      const awayFinal = hasResult ? goals('CURRENT', 'away') : null;
      // Ligaspiele: kein ET; 2ND_HALF ist bei Sportmonks kumulativ (Stand nach 90')
      const homeReg = hasResult ? (goals('2ND_HALF', 'home') ?? homeFinal) : null;
      const awayReg = hasResult ? (goals('2ND_HALF', 'away') ?? awayFinal) : null;
      const kickoff = f.starting_at_timestamp
        ? new Date(f.starting_at_timestamp * 1000).toISOString()
        : f.starting_at ? new Date(f.starting_at.replace(' ', 'T') + 'Z').toISOString() : null;
      if (!kickoff) { this.warn.push(`${cfg.key}: Fixture ${f.id} ohne Anstoss`); continue; }
      const md = f.round?.name && /^\d+$/.test(f.round.name) ? Number(f.round.name) : null;
      out.push({
        provider: this.provider, externalId: String(f.id), sport: cfg.sport, leagueExternalId: cfg.externalLeagueId,
        seasonExternalId: season.externalId, homeTeamExternalId: String(home.id), awayTeamExternalId: String(away.id),
        kickoffAt: kickoff, status, round: f.round?.name ?? null, matchday: md, venue: f.venue?.name ?? null,
        homeRegular: homeReg, awayRegular: awayReg, homeFinal, awayFinal,
        decidedBy: status === 'finished' ? (raw === 'AET' ? 'overtime' : raw === 'FT_PEN' ? 'shootout' : 'regular') : null,
        rawStatus: raw,
      });
    }
    return out;
  }
}
