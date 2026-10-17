import type { LeagueConfig } from './types.ts';

/**
 * Import-Whitelist. Es werden AUSSCHLIESSLICH Eintraege mit enabled: true importiert.
 * Erweiterung (z.B. Premier League = Sportmonks 8, Serie A = 384, Ligue 1 = 301) nur durch neuen Eintrag hier.
 */
export const LEAGUES: LeagueConfig[] = [
  {
    key: 'de-bundesliga', enabled: true, provider: 'sportmonks', sport: 'football',
    externalLeagueId: '82', name: 'Bundesliga', shortName: 'BL', country: 'Deutschland', countryCode: 'DE',
    color: '#D20515',
  },
  {
    key: 'at-bundesliga', enabled: true, provider: 'sportmonks', sport: 'football',
    externalLeagueId: '181', name: 'Admiral Bundesliga', shortName: 'ABL', country: 'Österreich', countryCode: 'AT',
    color: '#E30613',
  },
  {
    key: 'ch-super-league', enabled: true, provider: 'sportmonks', sport: 'football',
    externalLeagueId: '591', name: 'Super League', shortName: 'CSL', country: 'Schweiz', countryCode: 'CH',
    color: '#1F2A44',
  },
  {
    key: 'ch-national-league', enabled: true, provider: 'sihf', sport: 'hockey',
    externalLeagueId: '1', name: 'National League', shortName: 'NL', country: 'Schweiz', countryCode: 'CH',
    color: '#003399',
    // phase: SIHF-Phasen-Alias (657 = Regular Season 2026/27); 'all' fuer alle Phasen
    options: { phase: '657' },
  },
  {
    key: 'nhl', enabled: true, provider: 'nhl', sport: 'hockey',
    externalLeagueId: 'NHL', name: 'NHL', shortName: 'NHL', country: 'Nordamerika', countryCode: 'US',
    color: '#000000',
    // gameTypes: 2 = Regular Season, 3 = Playoffs
    options: { gameTypes: '2,3' },
  },
];
