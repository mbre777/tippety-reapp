import type { LeagueConfig, LeagueFetch, MatchStatus, NormMatch, NormSeason, NormTeam, ProviderAdapter } from '../types.ts';
import { Http, seasonStartYear } from '../core/http.ts';

const BASE = 'https://data.sihf.ch/Statistic/api/cms/cache300';

interface SihfTeam { id: number; name: string; acronym: string }
interface SihfStatus { id: number; name: string; canceled: boolean; startDateTime: string }
// Zeile: [tag, datum, zeit, home, away, result, periods, decision, status, detailLink, broadcasts]
type SihfRow = [string, string, string, SihfTeam, SihfTeam,
  { homeTeam: string; awayTeam: string }, { homeTeam: string[]; awayTeam: string[] }, string, SihfStatus,
  { gameId: string }, unknown];

export class SihfAdapter implements ProviderAdapter {
  readonly provider = 'sihf' as const;
  private http = new Http();
  private warn: string[] = [];
  private rowsCache: SihfRow[] | null = null;
  constructor(private now = new Date()) {}

  apiCalls() { return this.http.calls; }
  warnings() { return this.warn; }

  private seasonAlias() { return String(seasonStartYear(this.now) + 1); } // SIHF: 2026/27 -> '2027'

  fetchLeagues(cfg: LeagueConfig): Promise<LeagueFetch> {
    const y = seasonStartYear(this.now);
    const season: NormSeason = {
      provider: this.provider, externalId: `${cfg.externalLeagueId}-${this.seasonAlias()}`,
      leagueExternalId: cfg.externalLeagueId, name: `${y}/${String(y + 1).slice(2)}`,
      startsOn: `${y}-08-01`, endsOn: `${y + 1}-06-30`, isCurrent: true,
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

  private async rows(cfg: LeagueConfig): Promise<SihfRow[]> {
    if (this.rowsCache) return this.rowsCache;
    const y = seasonStartYear(this.now);
    const phase = cfg.options?.phase ?? 'all';
    const q = new URLSearchParams({
      alias: 'results', searchQuery: `${cfg.externalLeagueId}//${cfg.externalLeagueId}`,
      filterQuery: `${this.seasonAlias()}/${phase}/01.08.${y}-30.06.${y + 1}`,
      filterBy: 'Season,Phase,Date', orderBy: 'gameLocalTimestamp', orderByDescending: 'false',
      take: '2000', language: 'de',
    });
    const r = await this.http.json<{ data: SihfRow[] }>(`${BASE}?${q}`);
    this.rowsCache = r.data ?? [];
    return this.rowsCache;
  }

  async fetchTeams(cfg: LeagueConfig): Promise<NormTeam[]> {
    const map = new Map<string, NormTeam>();
    for (const r of await this.rows(cfg)) {
      for (const t of [r[3], r[4]]) {
        map.set(String(t.id), {
          provider: this.provider, externalId: String(t.id), sport: cfg.sport, name: t.name,
          shortName: t.acronym ?? null, logoUrl: null, color: null,
        });
      }
    }
    return [...map.values()];
  }

  private status(s: SihfStatus): MatchStatus {
    if (s.canceled) return 'cancelled';
    if (/verschoben/i.test(s.name)) return 'postponed';
    if (s.id === 12) return 'finished';      // 'Ende'
    if (s.id === 0) return 'scheduled';      // 'Wie geplant'
    if (s.id > 0 && s.id < 12) return 'live';
    this.warn.push(`SIHF: unbekannter Status ${s.id} '${s.name}'`);
    return 'scheduled';
  }

  async fetchMatches(cfg: LeagueConfig, season: NormSeason | null): Promise<NormMatch[]> {
    const num = (v: string | undefined) => (v === undefined || v === '-' || v === '' ? null : Number(v));
    const out: NormMatch[] = [];
    for (const r of await this.rows(cfg)) {
      const st = r[8];
      const status = this.status(st);
      const hasResult = status === 'finished' || status === 'live';
      const ph = r[6].homeTeam.slice(0, 3).map(num);
      const pa = r[6].awayTeam.slice(0, 3).map(num);
      const sum = (a: (number | null)[]) => (a.length === 3 && a.every((x) => x !== null) ? a.reduce((s, x) => s + x!, 0) : null);
      const dec = r[7];
      out.push({
        provider: this.provider, externalId: r[9].gameId, sport: cfg.sport, leagueExternalId: cfg.externalLeagueId,
        seasonExternalId: season?.externalId ?? null,
        homeTeamExternalId: String(r[3].id), awayTeamExternalId: String(r[4].id),
        kickoffAt: new Date(st.startDateTime).toISOString(), status, round: null, matchday: null, venue: null,
        homeRegular: hasResult ? sum(ph) : null, awayRegular: hasResult ? sum(pa) : null,
        homeFinal: hasResult ? num(r[5].homeTeam) : null, awayFinal: hasResult ? num(r[5].awayTeam) : null,
        decidedBy: status === 'finished' ? (dec === 'OT' ? 'overtime' : dec === 'SO' ? 'shootout' : 'regular') : null,
        rawStatus: `${st.id}:${st.name}${dec ? '/' + dec : ''}`,
      });
    }
    return out;
  }
}
