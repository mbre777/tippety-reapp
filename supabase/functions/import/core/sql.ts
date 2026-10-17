import type { ImportBundle } from '../types.ts';

/**
 * Erzeugt idempotentes Upsert-SQL (eine Transaktion). Zuordnung ausschliesslich ueber
 * public.external_ids (provider, entity_type, external_id). Neue Entitaeten bekommen eigene UUIDs.
 * Bestehende werden aktualisiert; Ergebnis-/Statusaenderungen loesen die Wertung per Trigger aus.
 */
const lit = (v: string | number | boolean | null | undefined): string =>
  v === null || v === undefined ? 'null'
  : typeof v === 'number' ? (Number.isFinite(v) ? String(v) : 'null')
  : typeof v === 'boolean' ? String(v)
  : `'${String(v).replace(/'/g, "''")}'`;

const values = (rows: (string | number | boolean | null)[][]) => rows.map((r) => `(${r.map(lit).join(',')})`).join(',\n  ');

export function buildSql(bundles: ImportBundle[], opts: { transaction?: boolean } = {}): string {
  const tx = opts.transaction ?? true;
  const leagues = bundles.map((b) => b.league);
  const seasons = bundles.flatMap((b) => (b.season ? [b.season] : []));
  const teamMap = new Map<string, ImportBundle['teams'][number]>();
  for (const t of bundles.flatMap((b) => b.teams)) teamMap.set(`${t.provider}:${t.externalId}`, t);
  const teams = [...teamMap.values()];
  const matches = bundles.flatMap((b) => b.matches);

  const s: string[] = [];
  s.push(`-- Tippety Import, erzeugt ${new Date().toISOString()}`);
  s.push(`-- Ligen: ${bundles.map((b) => `${b.configKey}(${b.teams.length} Teams/${b.matches.length} Spiele)`).join(', ')}`);
  if (tx) s.push('begin;');
  s.push(`create temp table stg_leagues (provider text, external_id text, sport text, name text, short_name text, country text, country_code text, color text, flag_url text) on commit drop;
create temp table stg_seasons (provider text, external_id text, league_ext text, name text, starts_on date, ends_on date, is_current boolean) on commit drop;
create temp table stg_teams (provider text, external_id text, sport text, name text, short_name text, logo_url text, color text) on commit drop;
create temp table stg_matches (provider text, external_id text, sport text, league_ext text, season_ext text, home_ext text, away_ext text,
  kickoff_at timestamptz, status text, round text, matchday int, venue text,
  home_regular int, away_regular int, home_final int, away_final int, decided_by text) on commit drop;`);

  if (leagues.length) s.push(`insert into stg_leagues values\n  ${values(leagues.map((l) => [l.provider, l.externalId, l.sport, l.name, l.shortName, l.country, l.countryCode, l.color, l.flagUrl]))};`);
  if (seasons.length) s.push(`insert into stg_seasons values\n  ${values(seasons.map((x) => [x.provider, x.externalId, x.leagueExternalId, x.name, x.startsOn, x.endsOn, x.isCurrent]))};`);
  if (teams.length) s.push(`insert into stg_teams values\n  ${values(teams.map((t) => [t.provider, t.externalId, t.sport, t.name, t.shortName, t.logoUrl, t.color]))};`);
  for (let i = 0; i < matches.length; i += 500) {
    s.push(`insert into stg_matches values\n  ${values(matches.slice(i, i + 500).map((m) => [m.provider, m.externalId, m.sport, m.leagueExternalId, m.seasonExternalId,
      m.homeTeamExternalId, m.awayTeamExternalId, m.kickoffAt, m.status, m.round, m.matchday, m.venue,
      m.homeRegular, m.awayRegular, m.homeFinal, m.awayFinal, m.decidedBy]))};`);
  }

  // Generisches Muster: neue Entitaeten anlegen + external_ids, danach bestehende aktualisieren.
  s.push(`
-- Ligen
with n as materialized (
  select s.*, gen_random_uuid() as id from stg_leagues s
  where not exists (select 1 from public.external_ids e where e.provider = s.provider and e.entity_type = 'league' and e.external_id = s.external_id)
), i as (
  insert into public.leagues (id, sport, name, short_name, country, country_code, color, flag_url)
  select id, sport, name, short_name, country, country_code, color, flag_url from n returning id
)
insert into public.external_ids (entity_type, entity_id, provider, external_id) select 'league', id, provider, external_id from n;
update public.leagues l set name = s.name, short_name = s.short_name, country = s.country, country_code = s.country_code,
  color = coalesce(s.color, l.color), flag_url = coalesce(s.flag_url, l.flag_url)
from stg_leagues s join public.external_ids e on e.provider = s.provider and e.entity_type = 'league' and e.external_id = s.external_id
where l.id = e.entity_id;

-- Saisons
with n as materialized (
  select s.*, gen_random_uuid() as id, el.entity_id as league_id from stg_seasons s
  join public.external_ids el on el.provider = s.provider and el.entity_type = 'league' and el.external_id = s.league_ext
  where not exists (select 1 from public.external_ids e where e.provider = s.provider and e.entity_type = 'season' and e.external_id = s.external_id)
), i as (
  insert into public.seasons (id, league_id, name, starts_on, ends_on, is_current)
  select id, league_id, name, starts_on, ends_on, is_current from n returning id
)
insert into public.external_ids (entity_type, entity_id, provider, external_id) select 'season', id, provider, external_id from n;
update public.seasons x set name = s.name, starts_on = s.starts_on, ends_on = s.ends_on, is_current = s.is_current
from stg_seasons s join public.external_ids e on e.provider = s.provider and e.entity_type = 'season' and e.external_id = s.external_id
where x.id = e.entity_id;
update public.seasons x set is_current = false
where x.is_current and x.league_id in (select el.entity_id from stg_seasons s join public.external_ids el
  on el.provider = s.provider and el.entity_type = 'league' and el.external_id = s.league_ext)
  and x.id not in (select e.entity_id from stg_seasons s join public.external_ids e
  on e.provider = s.provider and e.entity_type = 'season' and e.external_id = s.external_id);

-- Teams
with n as materialized (
  select s.*, gen_random_uuid() as id from stg_teams s
  where not exists (select 1 from public.external_ids e where e.provider = s.provider and e.entity_type = 'team' and e.external_id = s.external_id)
), i as (
  insert into public.teams (id, sport, name, short_name, logo_url, color)
  select id, sport, name, short_name, logo_url, color from n returning id
)
insert into public.external_ids (entity_type, entity_id, provider, external_id) select 'team', id, provider, external_id from n;
update public.teams t set name = s.name, short_name = coalesce(s.short_name, t.short_name),
  logo_url = coalesce(s.logo_url, t.logo_url), color = coalesce(s.color, t.color)
from stg_teams s join public.external_ids e on e.provider = s.provider and e.entity_type = 'team' and e.external_id = s.external_id
where t.id = e.entity_id and (t.name, t.short_name, t.logo_url, t.color) is distinct from (s.name, coalesce(s.short_name, t.short_name), coalesce(s.logo_url, t.logo_url), coalesce(s.color, t.color));

-- Spiele (IDs fuer Liga/Saison/Teams ueber external_ids aufloesen)
create temp table stg_m2 on commit drop as
select s.*, el.entity_id as league_id, es.entity_id as season_id, eh.entity_id as home_team_id, ea.entity_id as away_team_id,
       em.entity_id as match_id
from stg_matches s
join public.external_ids el on el.provider = s.provider and el.entity_type = 'league' and el.external_id = s.league_ext
left join public.external_ids es on es.provider = s.provider and es.entity_type = 'season' and es.external_id = s.season_ext
join public.external_ids eh on eh.provider = s.provider and eh.entity_type = 'team' and eh.external_id = s.home_ext
join public.external_ids ea on ea.provider = s.provider and ea.entity_type = 'team' and ea.external_id = s.away_ext
left join public.external_ids em on em.provider = s.provider and em.entity_type = 'match' and em.external_id = s.external_id;

do $chk$ declare a int; b int; begin
  select count(*) into a from stg_matches; select count(*) into b from stg_m2;
  if a <> b then raise exception 'import: % von % Spielen ohne aufloesbare Liga/Teams', a - b, a; end if;
end $chk$;

with n as materialized (
  select m.*, gen_random_uuid() as id from stg_m2 m where m.match_id is null
), i as (
  insert into public.matches (id, sport, league_id, season_id, round, matchday, venue, home_team_id, away_team_id, kickoff_at, status,
    home_regular, away_regular, home_final, away_final, decided_by)
  select id, sport, league_id, season_id, round, matchday, venue, home_team_id, away_team_id, kickoff_at, status,
    home_regular, away_regular, home_final, away_final, decided_by from n returning id
)
insert into public.external_ids (entity_type, entity_id, provider, external_id) select 'match', id, provider, external_id from n;

update public.matches x set season_id = m.season_id, round = m.round, matchday = m.matchday, venue = coalesce(m.venue, x.venue),
  home_team_id = m.home_team_id, away_team_id = m.away_team_id, kickoff_at = m.kickoff_at, status = m.status,
  home_regular = m.home_regular, away_regular = m.away_regular, home_final = m.home_final, away_final = m.away_final,
  decided_by = m.decided_by
from stg_m2 m
where x.id = m.match_id
  and (x.season_id, x.round, x.matchday, x.venue, x.home_team_id, x.away_team_id, x.kickoff_at, x.status,
       x.home_regular, x.away_regular, x.home_final, x.away_final, x.decided_by)
  is distinct from
      (m.season_id, m.round, m.matchday, coalesce(m.venue, x.venue), m.home_team_id, m.away_team_id, m.kickoff_at, m.status,
       m.home_regular, m.away_regular, m.home_final, m.away_final, m.decided_by);
`);

  // sync_runs je Provider
  const byProvider = new Map<string, { calls: number; rows: number; keys: string[] }>();
  for (const b of bundles) {
    const p = byProvider.get(b.provider) ?? { calls: 0, rows: 0, keys: [] };
    p.calls += b.apiCalls; p.rows += 1 + (b.season ? 1 : 0) + b.teams.length + b.matches.length; p.keys.push(b.configKey);
    byProvider.set(b.provider, p);
  }
  for (const [p, v] of byProvider) {
    s.push(`insert into public.sync_runs (provider, job, started_at, finished_at, status, api_calls, rows_upserted)
values (${lit(p)}, ${lit('full-import:' + v.keys.join(','))}, now(), clock_timestamp(), 'ok', ${v.calls}, ${v.rows});`);
  }
  if (tx) s.push('commit;');
  return s.join('\n') + '\n';
}
