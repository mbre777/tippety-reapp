-- Tippety: Cron-Aufrufe der Edge Function "import" (pg_cron + pg_net).
-- Voraussetzung (NICHT in dieser Migration, Secret nie committen):
--   select vault.create_secret('<IMPORT_SECRET>', 'import_secret', 'Header x-import-secret fuer Edge Function import');

create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_import(p_mode text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_secret text;
begin
  if p_mode not in ('full', 'results') then
    raise exception 'invalid_mode' using errcode = 'P0001';
  end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'import_secret';
  if v_secret is null then
    raise exception 'import_secret_missing' using errcode = 'P0001';
  end if;
  return net.http_post(
    url := 'https://whfhjpneehvjvlyhuzpb.supabase.co/functions/v1/import',
    body := jsonb_build_object('mode', p_mode),
    headers := jsonb_build_object('content-type', 'application/json', 'x-import-secret', v_secret),
    timeout_milliseconds := case when p_mode = 'full' then 150000 else 60000 end
  );
end $$;
revoke execute on function public.invoke_import(text) from public, anon, authenticated;

-- Voller Import taeglich 03:30 Europe/Vienna (pg_cron laeuft in UTC: 01:30 und 02:30 UTC planen,
-- nur die Ausfuehrung mit lokaler Stunde 3 ruft auf -> sommer-/winterzeitfest).
select cron.schedule('tippety_import_full', '30 1,2 * * *', $cmd$
  select public.invoke_import('full')
  where extract(hour from now() at time zone 'Europe/Vienna') = 3
$cmd$);

-- Ergebnis-/Status-Update alle 10 Minuten, nur wenn ein Spiel im Fenster liegt (sonst kein Aufruf, keine API-Calls).
select cron.schedule('tippety_import_results', '*/10 * * * *', $cmd$
  select public.invoke_import('results')
  where exists (select 1 from public.matches m
                where m.kickoff_at between now() - interval '4 hours' and now() + interval '15 minutes'
                  and m.status <> 'cancelled')
$cmd$);
