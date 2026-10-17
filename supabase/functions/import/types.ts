// Normalisierte, quellenunabhaengige Typen fuer den Import.

export type Sport = 'football' | 'hockey';
export type Provider = 'sportmonks' | 'sihf' | 'nhl';
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
export type DecidedBy = 'regular' | 'overtime' | 'shootout';

/** Eintrag der Import-Whitelist (leagues.config.ts). */
export interface LeagueConfig {
  key: string;                 // stabiler interner Schluessel, z.B. 'de-bundesliga'
  enabled: boolean;
  provider: Provider;
  sport: Sport;
  externalLeagueId: string;    // ID der Liga beim Provider
  name: string;
  shortName: string;
  country: string;
  countryCode: string;         // ISO 3166-1 alpha-2
  color?: string;              // '#RRGGBB'
  flagUrl?: string;
  options?: Record<string, string>;
}

export interface NormLeague {
  provider: Provider;
  externalId: string;
  sport: Sport;
  name: string;
  shortName: string | null;
  country: string | null;
  countryCode: string | null;
  color: string | null;
  flagUrl: string | null;
}

export interface NormSeason {
  provider: Provider;
  externalId: string;
  leagueExternalId: string;
  name: string;               // z.B. '2026/27'
  startsOn: string | null;    // YYYY-MM-DD
  endsOn: string | null;
  isCurrent: boolean;
}

export interface NormTeam {
  provider: Provider;
  externalId: string;
  sport: Sport;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  color: string | null;
}

export interface NormMatch {
  provider: Provider;
  externalId: string;
  sport: Sport;
  leagueExternalId: string;
  seasonExternalId: string | null;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  kickoffAt: string;          // ISO-8601 UTC
  status: MatchStatus;
  round: string | null;
  matchday: number | null;
  venue: string | null;
  /** Stand nach regulaerer Spielzeit (Fussball 90', Eishockey 60') */
  homeRegular: number | null;
  awayRegular: number | null;
  /** Endstand inkl. Verlaengerung / Penaltyschiessen */
  homeFinal: number | null;
  awayFinal: number | null;
  decidedBy: DecidedBy | null;
  /** Rohstatus des Providers (fuer Qualitaetspruefung, wird nicht gespeichert) */
  rawStatus: string;
}

export interface LeagueFetch {
  league: NormLeague;
  season: NormSeason | null;
}

/** Jeder Provider implementiert dieses Interface. */
export interface ProviderAdapter {
  readonly provider: Provider;
  fetchLeagues(cfg: LeagueConfig): Promise<LeagueFetch>;
  fetchTeams(cfg: LeagueConfig, season: NormSeason | null): Promise<NormTeam[]>;
  fetchMatches(cfg: LeagueConfig, season: NormSeason | null): Promise<NormMatch[]>;
  /** Anzahl HTTP-Calls seit Erzeugung (fuer sync_runs) */
  apiCalls(): number;
  /** Warnungen (z.B. unbekannter Status) */
  warnings(): string[];
}

export interface ImportBundle {
  provider: Provider;
  configKey: string;
  league: NormLeague;
  season: NormSeason | null;
  teams: NormTeam[];
  matches: NormMatch[];
  apiCalls: number;
  warnings: string[];
}
