import type { ImportBundle, LeagueConfig, ProviderAdapter, Provider } from '../types.ts';
import { LEAGUES } from '../leagues.config.ts';
import { SportmonksAdapter } from '../adapters/sportmonks.ts';
import { SihfAdapter } from '../adapters/sihf.ts';
import { NhlAdapter } from '../adapters/nhl.ts';
import { env } from '../env.ts';

export function makeAdapter(p: Provider): ProviderAdapter {
  switch (p) {
    case 'sportmonks': return new SportmonksAdapter(env('SPORTMONKS_API_TOKEN')!);
    case 'sihf': return new SihfAdapter();
    case 'nhl': return new NhlAdapter();
  }
}

/** Holt alle Whitelist-Ligen (enabled). Ein Adapter pro Liga, damit api_calls pro Liga zaehlbar sind. */
export async function fetchAll(leagues: LeagueConfig[] = LEAGUES, only?: string[]): Promise<ImportBundle[]> {
  const out: ImportBundle[] = [];
  for (const cfg of leagues.filter((l) => l.enabled && (!only || only.includes(l.key)))) {
    const a = makeAdapter(cfg.provider);
    const { league, season } = await a.fetchLeagues(cfg);
    const teams = await a.fetchTeams(cfg, season);
    const matches = await a.fetchMatches(cfg, season);
    out.push({ provider: cfg.provider, configKey: cfg.key, league, season, teams, matches, apiCalls: a.apiCalls(), warnings: [...a.warnings()] });
  }
  return out;
}

export interface QualityReport {
  key: string; teams: number; matches: number; byStatus: Record<string, number>; rawStatus: Record<string, number>;
  missing: Record<string, number>; issues: string[]; firstKickoff?: string; lastKickoff?: string;
}

export function quality(b: ImportBundle): QualityReport {
  const missing: Record<string, number> = {};
  const inc = (k: string) => (missing[k] = (missing[k] ?? 0) + 1);
  const byStatus: Record<string, number> = {}; const rawStatus: Record<string, number> = {};
  const issues = [...b.warnings];
  const teamIds = new Set(b.teams.map((t) => t.externalId));
  for (const t of b.teams) { if (!t.shortName) inc('team.short_name'); if (!t.logoUrl) inc('team.logo_url'); if (!t.color) inc('team.color'); }
  for (const m of b.matches) {
    byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
    rawStatus[m.rawStatus] = (rawStatus[m.rawStatus] ?? 0) + 1;
    if (m.matchday === null) inc('match.matchday');
    if (!m.venue) inc('match.venue');
    if (!teamIds.has(m.homeTeamExternalId) || !teamIds.has(m.awayTeamExternalId)) issues.push(`Spiel ${m.externalId}: Team fehlt`);
    if (m.status === 'finished') {
      if (m.homeFinal === null || m.awayFinal === null) issues.push(`Spiel ${m.externalId}: finished ohne Endstand`);
      if (m.homeRegular === null || m.awayRegular === null) issues.push(`Spiel ${m.externalId}: finished ohne regulaeres Ergebnis`);
      if (m.sport === 'hockey' && m.decidedBy !== 'regular' && m.homeRegular !== m.awayRegular)
        issues.push(`Spiel ${m.externalId}: ${m.decidedBy} aber nach 60' nicht unentschieden`);
      if (m.sport === 'hockey' && m.decidedBy === 'regular' && (m.homeRegular !== m.homeFinal || m.awayRegular !== m.awayFinal))
        issues.push(`Spiel ${m.externalId}: regular aber Endstand != 60'-Stand`);
    }
    if (m.status === 'scheduled' && new Date(m.kickoffAt) < new Date(Date.now() - 6 * 3600e3))
      issues.push(`Spiel ${m.externalId}: scheduled, Anstoss aber > 6h vorbei (${m.kickoffAt})`);
  }
  const ko = b.matches.map((m) => m.kickoffAt).sort();
  return { key: b.configKey, teams: b.teams.length, matches: b.matches.length, byStatus, rawStatus, missing, issues, firstKickoff: ko[0], lastKickoff: ko.at(-1) };
}
