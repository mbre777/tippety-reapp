begin;
select plan(17);

-- calc_points: 5 / 3 (nur Nicht-Remis) / 2 / 0
select is(public.calc_points(2,1, 2,1), 5, 'exakt = 5');
select is(public.calc_points(3,2, 2,1), 3, 'richtige Differenz Heimsieg = 3');
select is(public.calc_points(0,2, 1,3), 3, 'richtige Differenz Auswaertssieg = 3');
select is(public.calc_points(3,0, 2,1), 2, 'nur Tendenz = 2');
select is(public.calc_points(1,1, 2,2), 2, 'Remis mit falschem Ergebnis = 2 (keine 3)');
select is(public.calc_points(0,0, 0,0), 5, 'Remis exakt = 5');
select is(public.calc_points(1,1, 2,1), 0, 'falsche Tendenz = 0');
select is(public.calc_points(2,1, 1,2), 0, 'Gegenteil = 0');

-- Setup
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
insert into public.leagues (id, sport, name) values
  ('10000000-0000-0000-0000-000000000001', 'football', 'Bundesliga'),
  ('10000000-0000-0000-0000-000000000002', 'hockey', 'National League');
insert into public.teams (id, sport, name) values
  ('20000000-0000-0000-0000-000000000001', 'football', 'A'), ('20000000-0000-0000-0000-000000000002', 'football', 'B'),
  ('20000000-0000-0000-0000-000000000003', 'hockey', 'ZSC'), ('20000000-0000-0000-0000-000000000004', 'hockey', 'HCD');
insert into public.matches (id, sport, league_id, home_team_id, away_team_id, kickoff_at) values
  ('30000000-0000-0000-0000-000000000001', 'football', '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', now() + interval '1 day'),
  ('30000000-0000-0000-0000-000000000002', 'hockey', '10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', now() + interval '1 day');
insert into public.tips (user_id, match_id, home, away) values
  ('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001', 2, 1),
  ('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', 1, 1),
  ('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000002', 2, 2),
  ('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000002', 3, 2);

-- Spiele beginnen und enden (Admin/Import)
update public.matches set kickoff_at = now() - interval '3 hours';
update public.matches set status = 'finished', home_regular = 2, away_regular = 1, home_final = 2, away_final = 1,
  decided_by = 'regular' where id = '30000000-0000-0000-0000-000000000001';
-- Hockey: 2:2 nach 60 Min, 3:2 nach Verlaengerung
update public.matches set status = 'finished', home_regular = 2, away_regular = 2, home_final = 3, away_final = 2,
  decided_by = 'overtime' where id = '30000000-0000-0000-0000-000000000002';

select is((select points from public.tips where user_id = '00000000-0000-0000-0000-00000000000a' and match_id = '30000000-0000-0000-0000-000000000001'), 5, 'Fussball exakt automatisch gewertet');
select is((select points from public.tips where user_id = '00000000-0000-0000-0000-00000000000b' and match_id = '30000000-0000-0000-0000-000000000001'), 0, 'Fussball Remis-Tipp bei Heimsieg = 0');
select is((select points from public.tips where user_id = '00000000-0000-0000-0000-00000000000a' and match_id = '30000000-0000-0000-0000-000000000002'), 5, 'Hockey: 2:2 nach 60 Min zaehlt (exakt)');
select is((select points from public.tips where user_id = '00000000-0000-0000-0000-00000000000b' and match_id = '30000000-0000-0000-0000-000000000002'), 0, 'Hockey: OT-Ergebnis 3:2 zaehlt nicht');

-- Idempotenz
select is(public.score_match('30000000-0000-0000-0000-000000000001'), 0, 'score_match erneut: keine Aenderung');
select is((select sum(points)::int from public.tips), 10, 'Summe unveraendert nach erneutem Lauf');

-- Korrektur: Ergebnis 2:1 -> 3:2
update public.matches set home_final = 3, away_final = 2, home_regular = 3, away_regular = 2
 where id = '30000000-0000-0000-0000-000000000001';
select is((select points from public.tips where user_id = '00000000-0000-0000-0000-00000000000a' and match_id = '30000000-0000-0000-0000-000000000001'), 3, 'Korrektur -> neu gewertet (Differenz)');
select is((select result_version from public.matches where id = '30000000-0000-0000-0000-000000000001'), 2, 'result_version erhoeht');

-- Rangliste
select is((select points from public.leaderboard_global where user_id = '00000000-0000-0000-0000-00000000000a'), 8, 'leaderboard_global summiert');

select * from finish();
rollback;
