import type { LeagueConfig, LeagueFetch, MatchStatus, NormMatch, NormSeason, NormTeam, ProviderAdapter } from '../types.ts';
import { Http, seasonStartYear } from '../core/http.ts';

const BASE = 'https://api-web.nhle.com/v1';

interface NhlTeamRef { id: number; abbrev: string; commonName?: { default: string }; placeName?: { default: string }; logo?: string; score?: number }
interface NhlGame {
  id: number; season: number; gameType: number; startTimeUTC: string; venue?: { default: string };
  gameState: string; gameScheduleState: string; homeTeam: NhlTeamRef; awayTeam: NhlTeamRef;
  gameOutcome?: { lastPeriodType: 'REG' | 'OT' | 'SO' };
}

const STATE: Record<string, MatchStatus> = {
  FUT: 'scheduled', PRE: 'scheduled', LIVE: 'live', CRIT: 'live', FINAL: 'finished', OFF: 'finished',
};

export class NhlAdapter implements ProviderAdapter {
  readonly provider = 'nhl' as const;
  private http = new Http();
  private warn: string[] = [];
  private teamsCache: NormTeam[] | null = null;
  constructor(private now = new Date()) {}

  apiCalls() { return this.http.calls; }
  warnings() { return this.warn; }

  private seasonId() { const y = seasonStartYear(this.now); return `${y}${y + 1}`; }

  fetchLeagues(cfg: LeagueConfig): Promise<LeagueFetch> {
    const y = seasonStartYear(this.now);
    const season: NormSeason = {
      provider: this.provider, externalId: this.seasonId(), leagueExternalId: cfg.externalLeagueId,
      name: `${y}/${String(y + 1).slice(2)}`, startsOn: `${y}-09-01`, endsOn: `${y + 1}-06-30`, isCurrent: true,
    };
    return Promise.resolve({
      league: {
        provider: this.provider, externalId: cfg.externalLeagueId, sport: cfg.sport, name: cfg.name,
        shortName: cfg.shortName, country: cfg.country, countryCode: cfg.countryCode,
        color: cfg.color ?? null, flagUrl: cfg.flagUrl ?? null,
      },
      season,
    });
  }

  async fetchTeams(cfg: LeagueConfig): Promise<NormTeam[]> {
    if (this.teamsCache) return this.teamsCache;
    const r = await this.http.json<{ standings: { teamAbbrev: { default: string }; teamName: { default: string }; teamLogo: string }[] }>(`${BASE}/standings/now`);
    // Standings liefern keine numerische Team-ID -> IDs aus dem Spielplan des ersten Teams nachschlagen.
    const abbrevs = r.standings.map((s) => s.teamAbbrev.default);
    const idByAbbrev = new Map<string, number>();
    for (const g of await this.schedule(abbrevs)) {
      idByAbbrev.set(g.homeTeam.abbrev, g.homeTeam.id); idByAbbrev.set(g.awayTeam.abbrev, g.awayTeam.id);
    }
    this.teamsCache = r.standings.flatMap((s) => {
      const id = idByAbbrev.get(s.teamAbbrev.default);
      if (!id) { this.warn.push(`NHL: keine ID fuer ${s.teamAbbrev.default}`); return []; }
      return [{
        provider: this.provider, externalId: String(id), sport: cfg.sport, name: s.teamName.default,
        shortName: s.teamAbbrev.default, logoUrl: s.teamLogo ?? null, color: null,
      }];
    });
    return this.teamsCache;
  }

  private scheduleCache: NhlGame[] | null = null;
  private async schedule(abbrevs: string[]): Promise<NhlGame[]> {
    if (this.scheduleCache) return this.scheduleCache;
    const byId = new Map<number, NhlGame>();
    for (const a of abbrevs) {
      const r = await this.http.json<{ games: NhlGame[] }>(`${BASE}/club-schedule-season/${a}/${this.seasonId()}`);
      for (const g of r.games ?? []) byId.set(g.id, g);
    }
    this.scheduleCache = [...byId.values()];
    return this.scheduleCache;
  }

  async fetchMatches(cfg: LeagueConfig, season: NormSeason | null): Promise<NormMatch[]> {
    const teams = await this.fetchTeams(cfg);
    const types = new Set((cfg.options?.gameTypes ?? '2').split(',').map(Number));
    const known = new Set(teams.map((t) => t.externalId));
    const out: NormMatch[] = [];
    for (const g of await this.schedule(teams.map((t) => t.shortName!))) {
      if (!types.has(g.gameType)) continue;
      if (!known.has(String(g.homeTeam.id)) || !known.has(String(g.awayTeam.id))) {
        this.warn.push(`NHL: Spiel ${g.id} mit unbekanntem Team (${g.homeTeam.abbrev}-${g.awayTeam.abbrev}) uebersprungen`);
        continue;
      }
      let status: MatchStatus = STATE[g.gameState] ?? 'scheduled';
      if (!STATE[g.gameState]) this.warn.push(`NHL: unbekannter gameState ${g.gameState}`);
      if (g.gameScheduleState === 'PPD') status = 'postponed';
      if (g.gameScheduleState === 'CNCL') status = 'cancelled';
      const hasResult = status === 'finished' || status === 'live';
      const hf = hasResult ? g.homeTeam.score ?? null : null;
      const af = hasResult ? g.awayTeam.score ?? null : null;
      const lpt = g.gameOutcome?.lastPeriodType;
      // NHL: OT/SO-Spiele waren nach 60' unentschieden; Sieger hat im Endstand genau 1 Tor mehr.
      const tied = status === 'finished' && (lpt === 'OT' || lpt === 'SO') && hf !== null && af !== null;
      out.push({
        provider: this.provider, externalId: String(g.id), sport: cfg.sport, leagueExternalId: cfg.externalLeagueId,
        seasonExternalId: season?.externalId ?? null,
        homeTeamExternalId: String(g.homeTeam.id), awayTeamExternalId: String(g.awayTeam.id),
        kickoffAt: new Date(g.startTimeUTC).toISOString(), status,
        round: g.gameType === 3 ? 'Playoffs' : null, matchday: null, venue: g.venue?.default ?? null,
        homeRegular: tied ? Math.min(hf!, af!) : status === 'finished' ? hf : null,
        awayRegular: tied ? Math.min(hf!, af!) : status === 'finished' ? af : null,
        homeFinal: hf, awayFinal: af,
        decidedBy: status === 'finished' ? (lpt === 'OT' ? 'overtime' : lpt === 'SO' ? 'shootout' : 'regular') : null,
        rawStatus: `${g.gameState}/${g.gameScheduleState}${lpt ? '/' + lpt : ''}`,
      });
    }
    return out;
  }
}
