begin;
select plan(26);

insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c');
update public.profiles set nickname = 'anna' where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set nickname = 'ben'  where id = '00000000-0000-0000-0000-00000000000b';
update public.profiles set nickname = 'cleo' where id = '00000000-0000-0000-0000-00000000000c';
insert into public.leagues (id, sport, name, short_name, color, country_code) values
  ('10000000-0000-0000-0000-000000000001', 'football', 'Bundesliga', 'BL', '#D20515', 'DE'),
  ('10000000-0000-0000-0000-000000000002', 'hockey', 'National League', 'NL', '#003399', 'CH');
select throws_ok($$ update public.leagues set color = 'red' $$, '23514', null, 'color-Check');
insert into public.teams (id, sport, name, color) values
  ('20000000-0000-0000-0000-000000000001', 'football', 'A', '#FFFFFF'), ('20000000-0000-0000-0000-000000000002', 'football', 'B', '#000000');
insert into public.matches (id, sport, league_id, home_team_id, away_team_id, kickoff_at, matchday, venue, is_top_match) values
  ('30000000-0000-0000-0000-000000000001', 'football', '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', now() + interval '1 day', 1, 'Arena', true),
  ('30000000-0000-0000-0000-000000000002', 'football', '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', now() + interval '1 day', 2, null, false);
insert into public.tips (user_id, match_id, home, away) values
  ('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001', 2, 1),
  ('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', 1, 1),
  ('00000000-0000-0000-0000-00000000000c', '30000000-0000-0000-0000-000000000001', 0, 1),
  ('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000002', 1, 0);

create temp table g on commit drop as select null::uuid as id, null::text as code where false;
grant all on g to authenticated;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';

-- Tipp-Verteilung vor Anstoss (nur Aggregat)
select is((select total from public.get_match_tip_distribution('30000000-0000-0000-0000-000000000001')), 3, 'Verteilung: 3 Tipps');
select is((select home_pct from public.get_match_tip_distribution('30000000-0000-0000-0000-000000000001')), 33.3, 'home_pct 33.3');
select is((select total from public.get_match_tip_distribution(gen_random_uuid())), 0, 'ohne Tipps: total 0');
select is((select count(*)::int from public.tips where user_id <> auth.uid() and match_id in ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002')), 0, 'Einzeltipps anderer weiterhin unsichtbar');

-- Gruppen
insert into g select id, invite_code from public.create_group('Liga-Runde', array['10000000-0000-0000-0000-000000000001'::uuid], false);
select is((select is_private from public.groups), false, 'create_group mit is_private=false');
select is((select count(*)::int from public.group_leagues), 1, 'create_group setzt Ligen');
select lives_ok($$ select public.create_group('Alt') $$, 'alte Signatur create_group(name) funktioniert');
select is((select is_private from public.groups where name = 'Alt'), true, 'Default is_private = true');
select lives_ok($$ select public.set_group_leagues((select id from g), array['10000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid]) $$, 'Owner setzt Ligen');
select is((select count(*)::int from public.group_leagues where group_id = (select id from g)), 2, 'Ligen ersetzt');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b"}';
select is((select count(*)::int from public.group_leagues), 0, 'Nicht-Mitglied sieht group_leagues nicht');
select is((select member_count from public.preview_group_by_code(lower((select code from g)))), 1, 'Preview: member_count');
select is((select cardinality(league_ids) from public.preview_group_by_code((select code from g))), 2, 'Preview: league_ids');
select throws_ok($$ select * from public.preview_group_by_code('ZZZZZZZZ') $$, 'P0001', 'invalid_code', 'Preview invalid_code');
select throws_ok($$ select * from public.leaderboard_period(p_group_id := (select id from g)) $$, 'P0001', 'not_member', 'leaderboard_period: not_member');
select public.join_group_by_code((select code from g));
select throws_ok($$ select public.set_group_leagues((select id from g), '{}') $$, 'P0001', 'not_owner', 'set_group_leagues: not_owner');

-- Profil-Einstellungen
select is((public.update_profile_settings(false, 30)).reminder_minutes_before, 30, 'Reminder-Minuten gesetzt');
select is((select reminder_enabled from public.profiles where id = auth.uid()), false, 'Reminder deaktiviert');
select throws_ok($$ select public.update_profile_settings(null, 5) $$, 'P0001', 'invalid_reminder_minutes', 'Reminder < 15 abgelehnt');

-- Wertung: Spiel 1 = 2:1 (heute), Spiel 2 = 1:0
reset role;
update public.matches set kickoff_at = now() - interval '2 hours';
update public.matches set status = 'finished', home_final = 2, away_final = 1, home_regular = 2, away_regular = 1
  where id = '30000000-0000-0000-0000-000000000001';
update public.matches set status = 'finished', home_final = 1, away_final = 0, home_regular = 1, away_regular = 0
  where id = '30000000-0000-0000-0000-000000000002';
-- Snapshot von vor 7 Tagen: ben war 1., anna 3.
insert into public.leaderboard_snapshots (snapshot_date, scope, scope_id, user_id, rank, points) values
  (current_date - 7, 'global', null, '00000000-0000-0000-0000-00000000000a', 3, 0),
  (current_date - 7, 'global', null, '00000000-0000-0000-0000-00000000000b', 1, 0);

set local role authenticated;
select is((select points_week from public.leaderboard_global where nickname = 'anna'), 5, 'points_week');
select is((select rank_change from public.leaderboard_global where nickname = 'anna'), (select 3 - rank from public.leaderboard_global where nickname = 'anna'), 'rank_change = Snapshot-Rang 3 minus aktueller Rang');
select is((select rank_change from public.leaderboard_global where nickname = 'cleo'), null, 'rank_change null ohne Snapshot');
select is((select points from public.leaderboard_period(p_league_id := '10000000-0000-0000-0000-000000000001', p_period := 'matchday', p_matchday := 2) where nickname = 'ben'), 5, 'leaderboard_period matchday');
select is((select count(*)::int from public.leaderboard_period(p_group_id := (select id from g), p_period := 'month')), 2, 'leaderboard_period Gruppe/Monat: alle Mitglieder');

reset role;
select cmp_ok(public.take_leaderboard_snapshot(), '>', 0, 'take_leaderboard_snapshot schreibt Zeilen');

select * from finish();
rollback;
