-- Tippety: Kernschema (Stammdaten, Spiele, Tipps, Profile, Gruppen)

create schema if not exists extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pg_cron;  -- Jobs werden spaeter separat angelegt

-- ---------------------------------------------------------------- Stammdaten
create table public.sports (
  id   text primary key check (id in ('football', 'hockey')),
  name text not null
);
insert into public.sports (id, name) values ('football', 'Fußball'), ('hockey', 'Eishockey');

create table public.leagues (
  id         uuid primary key default gen_random_uuid(),
  sport      text not null references public.sports(id),
  name       text not null,
  country    text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index leagues_sport_idx on public.leagues (sport);

create table public.seasons (
  id         uuid primary key default gen_random_uuid(),
  league_id  uuid not null references public.leagues(id) on delete cascade,
  name       text not null,            -- z.B. '2026/27'
  starts_on  date,
  ends_on    date,
  is_current boolean not null default false,
  unique (league_id, name)
);

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  sport      text not null references public.sports(id),
  name       text not null,
  short_name text,
  logo_url   text,
  created_at timestamptz not null default now()
);

create table public.matches (
  id             uuid primary key default gen_random_uuid(),
  sport          text not null references public.sports(id),
  league_id      uuid not null references public.leagues(id),
  season_id      uuid references public.seasons(id),
  round          text,
  home_team_id   uuid not null references public.teams(id),
  away_team_id   uuid not null references public.teams(id),
  kickoff_at     timestamptz not null,
  status         text not null default 'scheduled'
                 check (status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  -- Ergebnis nach regulaerer Spielzeit (Fussball 90', Eishockey 60')
  home_regular   int check (home_regular >= 0),
  away_regular   int check (away_regular >= 0),
  -- Endergebnis inkl. Verlaengerung / Penaltyschiessen
  home_final     int check (home_final >= 0),
  away_final     int check (away_final >= 0),
  decided_by     text check (decided_by in ('regular', 'overtime', 'shootout')),
  result_version int not null default 0,
  updated_at     timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);
create index matches_kickoff_idx on public.matches (kickoff_at);
create index matches_league_kickoff_idx on public.matches (league_id, kickoff_at);

-- Quellenunabhaengige Zuordnung externer IDs (sportmonks, sihf, api_hockey, nhl, ...)
create table public.external_ids (
  id          bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('league', 'season', 'team', 'match')),
  entity_id   uuid not null,
  provider    text not null,
  external_id text not null,
  created_at  timestamptz not null default now(),
  unique (provider, entity_type, external_id)
);
create index external_ids_entity_idx on public.external_ids (entity_type, entity_id);

create table public.sync_runs (
  id          bigint generated always as identity primary key,
  provider    text not null,
  job         text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      text not null default 'running' check (status in ('running', 'ok', 'error')),
  api_calls   int not null default 0,
  rows_upserted int not null default 0,
  error       text
);

-- ---------------------------------------------------------------- Nutzer
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   extensions.citext unique
             check (nickname::text ~ '^[a-z0-9_]{3,16}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sperrliste: kind 'exact' = exakter Treffer, 'contains' = Teilstring (Schimpfwoerter)
create table public.reserved_nicknames (
  term text primary key check (term = lower(term)),
  kind text not null default 'exact' check (kind in ('exact', 'contains'))
);
insert into public.reserved_nicknames (term, kind) values
  ('admin', 'exact'), ('administrator', 'exact'), ('tippety', 'exact'), ('support', 'exact'),
  ('moderator', 'exact'), ('mod', 'exact'), ('root', 'exact'), ('system', 'exact'),
  ('staff', 'exact'), ('help', 'exact'),
  ('fuck', 'contains'), ('shit', 'contains'), ('arsch', 'contains'), ('fotze', 'contains'),
  ('hure', 'contains'), ('wichser', 'contains'), ('nazi', 'contains'), ('hitler', 'contains'),
  ('nigger', 'contains'), ('schlampe', 'contains'), ('bitch', 'contains'), ('cunt', 'contains');

create table public.user_leagues (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  league_id   uuid not null references public.leagues(id) on delete cascade,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (user_id, league_id)
);
create unique index user_leagues_one_favorite on public.user_leagues (user_id) where is_favorite;

create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  invite_code text not null unique check (invite_code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create table public.tips (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  match_id       uuid not null references public.matches(id) on delete cascade,
  home           int not null check (home between 0 and 99),
  away           int not null check (away between 0 and 99),
  points         int check (points in (0, 2, 3, 5)),
  scored_version int,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, match_id)
);
create index tips_match_idx on public.tips (match_id);
