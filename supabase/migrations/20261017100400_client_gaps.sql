-- Tippety: Luecken fuer den App-Client (P1 + P2)

-- =============================================================== P1
alter table public.leagues
  add column short_name   text,
  add column color        text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  add column flag_url     text,
  add column country_code char(2);

alter table public.teams
  add column color    text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  add column flag_url text;

alter table public.matches
  add column is_top_match boolean not null default false,
  add column matchday     int,
  add column venue        text;
create index matches_league_matchday_idx on public.matches (league_id, matchday);

alter table public.groups
  add column is_private boolean not null default true;

alter table public.profiles
  add column reminder_enabled        boolean not null default true,
  add column reminder_minutes_before int not null default 60
             check (reminder_minutes_before between 15 and 1440);

create table public.group_leagues (
  group_id  uuid not null references public.groups(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  primary key (group_id, league_id)
);
create index group_leagues_league_idx on public.group_leagues (league_id);
alter table public.group_leagues enable row level security;
create policy group_leagues_member_read on public.group_leagues for select to authenticated
  using (public.is_group_member(group_id));

-- Ligen einer Gruppe setzen (ersetzt komplett); nur Owner
create or replace function public.set_group_leagues(p_group_id uuid, p_league_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not exists (select 1 from public.groups g where g.id = p_group_id and g.owner_id = auth.uid()) then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  delete from public.group_leagues where group_id = p_group_id;
  insert into public.group_leagues (group_id, league_id)
  select distinct p_group_id, l from unnest(coalesce(p_league_ids, '{}'::uuid[])) l;
end $$;

-- create_group: neue Signatur, abwaertskompatibel (create_group('Name') funktioniert weiter)
drop function public.create_group(text);
create function public.create_group(p_name text, p_league_ids uuid[] default null, p_is_private boolean default true)
returns public.groups language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  g public.groups;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 40 then
    raise exception 'invalid_group_name' using errcode = 'P0001';
  end if;
  for attempt in 1..10 loop
    begin
      insert into public.groups (name, invite_code, owner_id, is_private)
      values (btrim(p_name), public.generate_invite_code(), v_uid, coalesce(p_is_private, true))
      returning * into g;
      exit;
    exception when unique_violation then
      if attempt = 10 then raise; end if;
    end;
  end loop;
  insert into public.group_members (group_id, user_id, role) values (g.id, v_uid, 'owner');
  if p_league_ids is not null then
    insert into public.group_leagues (group_id, league_id)
    select distinct g.id, l from unnest(p_league_ids) l;
  end if;
  return g;
end $$;

-- Vorschau vor dem Beitritt (auch fuer Nicht-Mitglieder)
create or replace function public.preview_group_by_code(p_code text)
returns table (group_id uuid, name text, member_count int, league_ids uuid[])
language plpgsql stable security definer set search_path = '' as $$
declare
  g public.groups;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  select * into g from public.groups where invite_code = upper(btrim(coalesce(p_code, '')));
  if not found then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  return query
  select g.id, g.name,
         (select count(*)::int from public.group_members gm where gm.group_id = g.id),
         coalesce((select array_agg(gl.league_id order by gl.league_id) from public.group_leagues gl
                   where gl.group_id = g.id), '{}'::uuid[]);
end $$;

-- Profil-Einstellungen; NULL = unveraendert
create or replace function public.update_profile_settings(p_reminder_enabled boolean, p_reminder_minutes_before int)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare
  r public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_reminder_minutes_before is not null and p_reminder_minutes_before not between 15 and 1440 then
    raise exception 'invalid_reminder_minutes' using errcode = 'P0001';
  end if;
  update public.profiles
     set reminder_enabled = coalesce(p_reminder_enabled, reminder_enabled),
         reminder_minutes_before = coalesce(p_reminder_minutes_before, reminder_minutes_before),
         updated_at = now()
   where id = auth.uid()
  returning * into r;
  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;
  return r;
end $$;

-- =============================================================== P2
-- Tipp-Verteilung (nur Aggregat, auch vor Anstoss)
create or replace function public.get_match_tip_distribution(p_match_id uuid)
returns table (total int, home_pct numeric, draw_pct numeric, away_pct numeric)
language sql stable security definer set search_path = '' as $$
  select count(*)::int,
         coalesce(round(100.0 * count(*) filter (where t.home > t.away) / nullif(count(*), 0), 1), 0),
         coalesce(round(100.0 * count(*) filter (where t.home = t.away) / nullif(count(*), 0), 1), 0),
         coalesce(round(100.0 * count(*) filter (where t.home < t.away) / nullif(count(*), 0), 1), 0)
  from public.tips t
  where t.match_id = p_match_id
$$;

-- Snapshots fuer Trend (rank_change)
create table public.leaderboard_snapshots (
  snapshot_date date not null,
  scope         text not null check (scope in ('global', 'league', 'group')),
  scope_id      uuid,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  rank          int not null,
  points        int not null,
  check ((scope = 'global') = (scope_id is null)),
  unique nulls not distinct (snapshot_date, scope, scope_id, user_id)
);
create index leaderboard_snapshots_lookup_idx on public.leaderboard_snapshots (scope, scope_id, snapshot_date);
alter table public.leaderboard_snapshots enable row level security;
create policy leaderboard_snapshots_read on public.leaderboard_snapshots for select to authenticated
  using (scope in ('global', 'league') or public.is_group_member(scope_id));

-- Views neu aufbauen (points_week, rank_change)
drop view public.leaderboard_group;
drop view public.leaderboard_league;
drop view public.leaderboard_global;
drop view public.scored_tips;

create view public.scored_tips with (security_invoker = true) as
select t.user_id, m.league_id, m.sport, m.kickoff_at, m.matchday, t.points,
       (t.points = 5)::int as exact_hit,
       (t.points = 3)::int as diff_hit,
       (t.points = 2)::int as tendency_hit,
       (m.kickoff_at >= now() - interval '7 days')::int as in_week
from public.tips t
join public.matches m on m.id = t.match_id
where t.points is not null;

-- rank_change = Rang laut Snapshot von vor 7 Tagen minus aktueller Rang (positiv = verbessert)
create view public.leaderboard_global with (security_invoker = true) as
with agg as (
  select s.user_id, sum(s.points)::int as points, sum(s.exact_hit)::int as exact_hits,
         sum(s.diff_hit)::int as diff_hits, sum(s.tendency_hit)::int as tendency_hits,
         sum(s.points * s.in_week)::int as points_week,
         rank() over (order by sum(s.points) desc)::int as rank
  from public.scored_tips s group by s.user_id
)
select a.user_id, p.nickname::text as nickname, a.points, a.exact_hits, a.diff_hits, a.tendency_hits,
       a.rank, a.points_week, (ls.rank - a.rank)::int as rank_change
from agg a
join public.profiles p on p.id = a.user_id
left join public.leaderboard_snapshots ls
  on ls.scope = 'global' and ls.scope_id is null and ls.user_id = a.user_id
 and ls.snapshot_date = current_date - 7;

create view public.leaderboard_league with (security_invoker = true) as
with agg as (
  select s.league_id, s.user_id, sum(s.points)::int as points, sum(s.exact_hit)::int as exact_hits,
         sum(s.diff_hit)::int as diff_hits, sum(s.tendency_hit)::int as tendency_hits,
         sum(s.points * s.in_week)::int as points_week,
         rank() over (partition by s.league_id order by sum(s.points) desc)::int as rank
  from public.scored_tips s group by s.league_id, s.user_id
)
select a.league_id, a.user_id, p.nickname::text as nickname, a.points, a.exact_hits, a.diff_hits,
       a.tendency_hits, a.rank, a.points_week, (ls.rank - a.rank)::int as rank_change
from agg a
join public.profiles p on p.id = a.user_id
left join public.leaderboard_snapshots ls
  on ls.scope = 'league' and ls.scope_id = a.league_id and ls.user_id = a.user_id
 and ls.snapshot_date = current_date - 7;

-- league_id IS NULL = Gruppen-Gesamtwertung (alle Mitglieder); sonst pro Liga.
-- rank_change nur fuer die Gesamtwertung (Snapshots scope 'group' sind ligenuebergreifend).
create view public.leaderboard_group with (security_invoker = true) as
with per_league as (
  select gm.group_id, s.league_id, gm.user_id,
         sum(s.points) as points, sum(s.exact_hit) as exact_hits,
         sum(s.diff_hit) as diff_hits, sum(s.tendency_hit) as tendency_hits,
         sum(s.points * s.in_week) as points_week
  from public.group_members gm
  join public.scored_tips s on s.user_id = gm.user_id
  group by gm.group_id, s.league_id, gm.user_id
),
total as (
  select gm.group_id, null::uuid as league_id, gm.user_id,
         coalesce(sum(pl.points), 0) as points, coalesce(sum(pl.exact_hits), 0) as exact_hits,
         coalesce(sum(pl.diff_hits), 0) as diff_hits, coalesce(sum(pl.tendency_hits), 0) as tendency_hits,
         coalesce(sum(pl.points_week), 0) as points_week
  from public.group_members gm
  left join per_league pl on pl.group_id = gm.group_id and pl.user_id = gm.user_id
  group by gm.group_id, gm.user_id
),
u as (
  select *, rank() over (partition by group_id, league_id order by points desc)::int as rank
  from (select * from per_league union all select * from total) x
)
select u.group_id, u.league_id, u.user_id, p.nickname::text as nickname,
       u.points::int, u.exact_hits::int, u.diff_hits::int, u.tendency_hits::int, u.rank,
       u.points_week::int as points_week,
       case when u.league_id is null then (ls.rank - u.rank)::int end as rank_change
from u
join public.profiles p on p.id = u.user_id
left join public.leaderboard_snapshots ls
  on u.league_id is null and ls.scope = 'group' and ls.scope_id = u.group_id
 and ls.user_id = u.user_id and ls.snapshot_date = current_date - 7;

-- Taeglicher Snapshot (idempotent pro Tag)
create or replace function public.take_leaderboard_snapshot()
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
begin
  insert into public.leaderboard_snapshots (snapshot_date, scope, scope_id, user_id, rank, points)
  select current_date, 'global', null, user_id, rank, points from public.leaderboard_global
  union all
  select current_date, 'league', league_id, user_id, rank, points from public.leaderboard_league
  union all
  select current_date, 'group', group_id, user_id, rank, points from public.leaderboard_group where league_id is null
  on conflict (snapshot_date, scope, scope_id, user_id)
  do update set rank = excluded.rank, points = excluded.points;
  get diagnostics v_count = row_count;
  delete from public.leaderboard_snapshots where snapshot_date < current_date - 60;
  return v_count;
end $$;

-- Rangliste nach Zeitraum
create or replace function public.leaderboard_period(
  p_league_id uuid default null,
  p_group_id  uuid default null,
  p_period    text default 'season',
  p_matchday  int  default null,
  p_month     date default null)
returns table (user_id uuid, nickname text, points int, exact_hits int, diff_hits int, tendency_hits int, rank int)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if p_period not in ('matchday', 'month', 'season') then
    raise exception 'invalid_period' using errcode = 'P0001';
  end if;
  if p_period = 'matchday' and p_matchday is null then
    raise exception 'matchday_required' using errcode = 'P0001';
  end if;
  if p_group_id is not null and not public.is_group_member(p_group_id) then
    raise exception 'not_member' using errcode = 'P0001';
  end if;

  return query
  with filtered as (
    select s.* from public.scored_tips s
    where (p_league_id is null or s.league_id = p_league_id)
      and (p_period = 'season'
           or (p_period = 'matchday' and s.matchday = p_matchday)
           or (p_period = 'month' and date_trunc('month', s.kickoff_at at time zone 'Europe/Vienna')
                                     = date_trunc('month', coalesce(p_month, (now() at time zone 'Europe/Vienna')::date)::timestamp)))
  ),
  agg as (
    select f.user_id, sum(f.points) as points, sum(f.exact_hit) as exact_hits,
           sum(f.diff_hit) as diff_hits, sum(f.tendency_hit) as tendency_hits
    from filtered f group by f.user_id
  ),
  base as (
    select gm.user_id from public.group_members gm where p_group_id is not null and gm.group_id = p_group_id
    union
    select a.user_id from agg a where p_group_id is null
  )
  select b.user_id, p.nickname::text,
         coalesce(a.points, 0)::int, coalesce(a.exact_hits, 0)::int,
         coalesce(a.diff_hits, 0)::int, coalesce(a.tendency_hits, 0)::int,
         (rank() over (order by coalesce(a.points, 0) desc))::int
  from base b
  join public.profiles p on p.id = b.user_id
  left join agg a on a.user_id = b.user_id
  order by 7, 2;
end $$;

-- pg_cron: taeglich 03:00 UTC
select cron.schedule('tippety_leaderboard_snapshot', '0 3 * * *', 'select public.take_leaderboard_snapshot()');

-- =============================================================== Grants haerten
revoke all on public.group_leagues, public.leaderboard_snapshots from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.group_leagues, public.leaderboard_snapshots from authenticated;
revoke all on public.scored_tips, public.leaderboard_global, public.leaderboard_league,
  public.leaderboard_group from anon;
revoke insert, update, delete, truncate, references, trigger on public.scored_tips,
  public.leaderboard_global, public.leaderboard_league, public.leaderboard_group from authenticated;
grant select on public.group_leagues, public.leaderboard_snapshots, public.scored_tips,
  public.leaderboard_global, public.leaderboard_league, public.leaderboard_group to authenticated;

revoke execute on function
  public.set_group_leagues(uuid, uuid[]), public.create_group(text, uuid[], boolean),
  public.preview_group_by_code(text), public.update_profile_settings(boolean, int),
  public.get_match_tip_distribution(uuid), public.leaderboard_period(uuid, uuid, text, int, date),
  public.take_leaderboard_snapshot()
  from public, anon;
grant execute on function
  public.set_group_leagues(uuid, uuid[]), public.create_group(text, uuid[], boolean),
  public.preview_group_by_code(text), public.update_profile_settings(boolean, int),
  public.get_match_tip_distribution(uuid), public.leaderboard_period(uuid, uuid, text, int, date)
  to authenticated;
revoke execute on function public.take_leaderboard_snapshot() from authenticated;
grant execute on function public.take_leaderboard_snapshot() to service_role;
grant execute on all functions in schema public to service_role;
