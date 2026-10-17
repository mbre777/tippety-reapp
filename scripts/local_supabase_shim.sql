-- NUR fuer lokale Tests auf Vanilla-Postgres: bildet die minimalen Supabase-Bausteine nach
-- (Rollen, auth.users, auth.uid(), Default-Grants). Nicht gegen Supabase ausfuehren.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text, created_at timestamptz default now());
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
$$;
grant usage on schema auth, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- Stubs fuer pg_net und Vault (nur falls nicht vorhanden; Supabase stellt die echten bereit)
do $$ begin
  if not exists (select from pg_extension where extname = 'pg_net') then
    create schema if not exists net;
    create or replace function net.http_post(url text, body jsonb default '{}', params jsonb default '{}',
      headers jsonb default '{}', timeout_milliseconds int default 5000) returns bigint language sql as 'select 0::bigint';
  end if;
end $$;
create schema if not exists vault;
create table if not exists vault.secrets_stub (name text primary key, decrypted_secret text);
create or replace view vault.decrypted_secrets as select name, decrypted_secret from vault.secrets_stub;
