import type { NormMatch, Provider } from '../types.ts';
import { LEAGUES } from '../leagues.config.ts';
import { makeAdapter } from './run.ts';

/** Spiele im Ergebnis-Fenster (nur bekannte, ueber external_ids zugeordnete Spiele). */
export const WINDOW_SQL = `
select em.provider, em.external_id, el.external_id as league_ext
from public.matches m
join public.external_ids em on em.entity_type = 'match' and em.entity_id = m.id
join public.external_ids el on el.entity_type = 'league' and el.entity_id = m.league_id and el.provider = em.provider
where m.kickoff_at between now() - interval '4 hours' and now() + interval '15 minutes'
  and m.status <> 'cancelled'`;

export interface WindowRow { provider: Provider; external_id: string; league_ext: string }

export interface ResultsFetch { matches: NormMatch[]; callsByProvider: Map<Provider, number>; warnings: string[]; requested: number }

/** Holt nur fuer die Spiele im Fenster aktuelle Daten. Leeres Fenster -> 0 API-Calls. */
export async function fetchResults(rows: WindowRow[], from: Date, to: Date): Promise<ResultsFetch> {
  const callsByProvider = new Map<Provider, number>();
  const warnings: string[] = [];
  const matches: NormMatch[] = [];
  const groups = new Map<string, WindowRow[]>();
  for (const r of rows) {
    const k = `${r.provider}|${r.league_ext}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  for (const [k, list] of groups) {
    const [provider, leagueExt] = k.split('|');
    const cfg = LEAGUES.find((l) => l.enabled && l.provider === provider && l.externalLeagueId === leagueExt);
    if (!cfg) { warnings.push(`keine aktive Whitelist-Liga fuer ${k}`); continue; }
    const a = makeAdapter(cfg.provider);
    matches.push(...await a.fetchResults(cfg, list.map((r) => r.external_id), from, to));
    callsByProvider.set(cfg.provider, (callsByProvider.get(cfg.provider) ?? 0) + a.apiCalls());
    warnings.push(...a.warnings());
  }
  return { matches, callsByProvider, warnings, requested: rows.length };
}

const lit = (v: string | number | null) =>
  v === null ? 'null' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;

/** Nur Updates bestehender Spiele (Status, Anstoss, Ergebnisse). Keine Inserts. Eine Transaktion. */
export function buildResultsSql(r: ResultsFetch): string {
  const s: string[] = ['begin;'];
  if (r.matches.length) {
    const vals = r.matches.map((m) => `(${[m.provider, m.externalId, m.kickoffAt, m.status, m.homeRegular, m.awayRegular, m.homeFinal, m.awayFinal, m.decidedBy].map(lit).join(',')})`).join(',\n  ');
    s.push(`update public.matches x set kickoff_at = v.kickoff_at::timestamptz, status = v.status,
  home_regular = v.hr::int, away_regular = v.ar::int, home_final = v.hf::int, away_final = v.af::int, decided_by = v.decided_by
from (values\n  ${vals}\n) v(provider, external_id, kickoff_at, status, hr, ar, hf, af, decided_by)
join public.external_ids e on e.provider = v.provider and e.entity_type = 'match' and e.external_id = v.external_id
where x.id = e.entity_id
  and (x.kickoff_at, x.status, x.home_regular, x.away_regular, x.home_final, x.away_final, x.decided_by)
  is distinct from (v.kickoff_at::timestamptz, v.status, v.hr::int, v.ar::int, v.hf::int, v.af::int, v.decided_by);`);
  }
  for (const [p, calls] of r.callsByProvider) {
    const n = r.matches.filter((m) => m.provider === p).length;
    s.push(`insert into public.sync_runs (provider, job, started_at, finished_at, status, api_calls, rows_upserted, error)
values (${lit(p)}, 'results', now(), clock_timestamp(), 'ok', ${calls}, ${n}, ${r.warnings.length ? lit(r.warnings.join(' | ').slice(0, 2000)) : 'null'});`);
  }
  s.push('commit;');
  return s.join('\n');
}
