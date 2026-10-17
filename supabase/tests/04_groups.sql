begin;
select plan(12);

insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c');
create temp table g on commit drop as select null::uuid as id, null::text as code where false;
grant all on g to authenticated;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';
insert into g select id, invite_code from public.create_group('Stammtisch');

select matches((select code from g), '^[A-HJ-NP-Z2-9]{8}$', 'Code: 8 Zeichen ohne 0/O/1/I');
select is((select count(*)::int from public.group_members), 1, 'Ersteller ist Mitglied');
select is((select role from public.group_members), 'owner', 'Ersteller ist Owner');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c"}';
select is((select count(*)::int from public.groups), 0, 'Nicht-Mitglied sieht Gruppe nicht');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b"}';
select throws_ok($$ select public.join_group_by_code('ZZZZZZZZ') $$, 'P0001', 'invalid_code', 'falscher Code');
select lives_ok($$ select public.join_group_by_code(lower((select code from g))) $$, 'Beitritt per Code (case-insensitive)');
select throws_ok($$ select public.join_group_by_code((select code from g)) $$, 'P0001', 'already_member', 'doppelter Beitritt');
select is((select count(*)::int from public.group_members), 2, 'Mitglied sieht alle Mitglieder');
select is((select count(*)::int from public.leaderboard_group where league_id is null), 2, 'Gruppen-Gesamtrangliste mit allen Mitgliedern');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';
select lives_ok($$ select public.leave_group((select id from g)) $$, 'Owner verlaesst Gruppe');
reset role;
select is((select owner_id from public.groups), '00000000-0000-0000-0000-00000000000b'::uuid, 'Ownership uebertragen');

-- Kollisionsfreiheit: viele Gruppen, alle Codes eindeutig
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c"}';
select public.create_group('G' || i) from generate_series(1, 200) i;
reset role;
select is((select count(distinct invite_code)::int from public.groups), (select count(*)::int from public.groups), '200 Codes eindeutig');

select * from finish();
rollback;
