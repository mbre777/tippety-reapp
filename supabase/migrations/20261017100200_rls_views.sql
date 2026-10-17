-- Tippety: Row Level Security und Ranglisten-Views

alter table public.sports             enable row level security;
alter table public.leagues            enable row level security;
alter table public.seasons            enable row level security;
alter table public.teams              enable row level security;
alter table public.matches            enable row level security;
alter table public.external_ids       enable row level security;
alter table public.sync_runs          enable row level security;
alter table public.profiles           enable row level security;
alter table public.reserved_nicknames enable row level security;
alter table public.user_leagues       enable row level security;
alter table public.groups             enable row level security;
alter table public.group_members      enable row level security;
alter table public.tips               enable row level security;

-- Stammdaten: lesen fuer authenticated; Schreiben nur service_role (umgeht RLS).
create policy sports_read  on public.sports  for select to authenticated using (true);
create policy leagues_read on public.leagues for select to authenticated using (true);
create policy seasons_read on public.seasons for select to authenticated using (true);
create policy teams_read   on public.teams   for select to authenticated using (true);
create policy matches_read on public.matches for select to authenticated using (true);
-- external_ids, sync_runs, reserved_nicknames: keine Policies -> nur service_role / security definer.

-- Profile: Nicknames sind oeffentlich (Ranglisten); Aenderung nur via set_nickname().
create policy profiles_read on public.profiles for select to authenticated using (true);

-- Eigene Ligen
create policy user_leagues_select on public.user_leagues for select to authenticated
  using (user_id = (select auth.uid()));
create policy user_leagues_insert on public.user_leagues for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy user_leagues_update on public.user_leagues for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy user_leagues_delete on public.user_leagues for delete to authenticated
  using (user_id = (select auth.uid()));

-- Gruppen: nur Mitglieder sehen Gruppe und Mitgliederliste; Schreiben nur via RPCs.
create policy groups_member_read on public.groups for select to authenticated
  using (public.is_group_member(id));
create policy group_members_member_read on public.group_members for select to authenticated
  using (public.is_group_member(group_id));

-- Tipps: eigene immer, fremde erst ab Anstoss; Schreiben nur via upsert_tip().
create policy tips_read on public.tips for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.matches m where m.id = match_id and m.kickoff_at <= now())
  );

-- Direkte Schreibrechte fuer Clients entziehen (RPCs laufen als security definer).
revoke insert, update, delete on all tables in schema public from anon, authenticated;
grant insert, update, delete on public.user_leagues to authenticated;
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------- Ranglisten
-- Basis: gewertete Tipps (points not null) mit Kategorie
create view public.scored_tips with (security_invoker = true) as
select t.user_id, m.league_id, m.sport, t.points,
       (t.points = 5)::int as exact_hit,
       (t.points = 3)::int as diff_hit,
       (t.points = 2)::int as tendency_hit
from public.tips t
join public.matches m on m.id = t.match_id
where t.points is not null;

create view public.leaderboard_global with (security_invoker = true) as
select s.user_id, p.nickname::text as nickname,
       sum(s.points)::int as points,
       sum(s.exact_hit)::int as exact_hits,
       sum(s.diff_hit)::int as diff_hits,
       sum(s.tendency_hit)::int as tendency_hits,
       rank() over (order by sum(s.points) desc)::int as rank
from public.scored_tips s
join public.profiles p on p.id = s.user_id
group by s.user_id, p.nickname;

create view public.leaderboard_league with (security_invoker = true) as
select s.league_id, s.user_id, p.nickname::text as nickname,
       sum(s.points)::int as points,
       sum(s.exact_hit)::int as exact_hits,
       sum(s.diff_hit)::int as diff_hits,
       sum(s.tendency_hit)::int as tendency_hits,
       rank() over (partition by s.league_id order by sum(s.points) desc)::int as rank
from public.scored_tips s
join public.profiles p on p.id = s.user_id
group by s.league_id, s.user_id, p.nickname;

-- Gruppen-Rangliste: league_id IS NULL = Gesamtwertung der Gruppe ueber alle Ligen
-- (alle Mitglieder, auch ohne Punkte); league_id gesetzt = Wertung pro Liga
-- (nur Mitglieder mit mind. einem gewerteten Tipp in der Liga).
-- Sichtbar nur fuer Mitglieder (RLS auf group_members via security_invoker).
create view public.leaderboard_group with (security_invoker = true) as
with per_league as (
  select gm.group_id, s.league_id, gm.user_id,
         sum(s.points) as points, sum(s.exact_hit) as exact_hits,
         sum(s.diff_hit) as diff_hits, sum(s.tendency_hit) as tendency_hits
  from public.group_members gm
  join public.scored_tips s on s.user_id = gm.user_id
  group by gm.group_id, s.league_id, gm.user_id
),
total as (
  select gm.group_id, null::uuid as league_id, gm.user_id,
         coalesce(sum(pl.points), 0) as points, coalesce(sum(pl.exact_hits), 0) as exact_hits,
         coalesce(sum(pl.diff_hits), 0) as diff_hits, coalesce(sum(pl.tendency_hits), 0) as tendency_hits
  from public.group_members gm
  left join per_league pl on pl.group_id = gm.group_id and pl.user_id = gm.user_id
  group by gm.group_id, gm.user_id
),
u as (select * from per_league union all select * from total)
select u.group_id, u.league_id, u.user_id, p.nickname::text as nickname,
       u.points::int, u.exact_hits::int, u.diff_hits::int, u.tendency_hits::int,
       rank() over (partition by u.group_id, u.league_id order by u.points desc)::int as rank
from u
join public.profiles p on p.id = u.user_id;

grant select on public.scored_tips, public.leaderboard_global, public.leaderboard_league,
  public.leaderboard_group to authenticated;
