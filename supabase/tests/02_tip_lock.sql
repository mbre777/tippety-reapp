begin;
select plan(8);

insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
insert into public.leagues (id, sport, name) values ('10000000-0000-0000-0000-000000000001', 'football', 'BL');
insert into public.teams (id, sport, name) values
  ('20000000-0000-0000-0000-000000000001', 'football', 'A'), ('20000000-0000-0000-0000-000000000002', 'football', 'B');
insert into public.matches (id, sport, league_id, home_team_id, away_team_id, kickoff_at, status) values
  ('30000000-0000-0000-0000-000000000001', 'football', '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', now() + interval '1 hour', 'scheduled'),
  ('30000000-0000-0000-0000-000000000002', 'football', '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', now() - interval '1 minute', 'scheduled'),
  ('30000000-0000-0000-0000-000000000003', 'football', '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', now() + interval '2 days', 'postponed');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';

select lives_ok($$ select public.upsert_tip('30000000-0000-0000-0000-000000000001', 1, 0) $$, 'Tipp vor Anstoss ok');
select lives_ok($$ select public.upsert_tip('30000000-0000-0000-0000-000000000001', 2, 0) $$, 'Tipp aendern vor Anstoss ok');
select is((select home from public.tips where match_id = '30000000-0000-0000-0000-000000000001'), 2, 'Tipp aktualisiert');
select throws_ok($$ select public.upsert_tip('30000000-0000-0000-0000-000000000002', 1, 0) $$, 'P0001', 'tip_locked', 'Tipp nach Anstoss gesperrt');
select throws_ok($$ select public.upsert_tip('30000000-0000-0000-0000-000000000003', 1, 0) $$, 'P0001', 'tip_locked', 'Status != scheduled gesperrt');
select throws_ok($$ insert into public.tips (user_id, match_id, home, away) values ('00000000-0000-0000-0000-00000000000a','30000000-0000-0000-0000-000000000003',1,1) $$,
  '42501', null, 'Direkter Insert durch Client verboten');

-- Sichtbarkeit fremder Tipps: B tippt Spiel 1 (vor Anstoss) -> A sieht ihn nicht
reset role;
insert into public.tips (user_id, match_id, home, away) values ('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', 0, 0);
set local role authenticated;
select is((select count(*)::int from public.tips where user_id = '00000000-0000-0000-0000-00000000000b'), 0, 'Fremder Tipp vor Anstoss unsichtbar');
reset role;
update public.matches set kickoff_at = now() - interval '1 minute' where id = '30000000-0000-0000-0000-000000000001';
set local role authenticated;
select is((select count(*)::int from public.tips where user_id = '00000000-0000-0000-0000-00000000000b'), 1, 'Fremder Tipp ab Anstoss sichtbar');

select * from finish();
rollback;
