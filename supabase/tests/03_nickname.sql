begin;
select plan(13);

insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.profiles where id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')), 2, 'Profil bei Signup angelegt');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';

select is(public.check_nickname('Markus_77'), 'available', 'gueltig (wird lower-cased)');
select is(public.check_nickname('ab'), 'invalid', 'zu kurz');
select is(public.check_nickname('abcdefghijklmnopq'), 'invalid', '17 Zeichen zu lang');
select is(public.check_nickname('mar.kus'), 'invalid', 'Punkt nicht erlaubt');
select is(public.check_nickname('Admin'), 'reserved', 'reserviert exakt (case-insensitive)');
select is(public.check_nickname('xx_fuck_xx'), 'reserved', 'Schimpfwort als Teilstring');
select is((public.set_nickname('Markus_77')).nickname::text, 'markus_77', 'set_nickname speichert lower-case');
select is(public.check_nickname('markus_77'), 'available', 'eigener Nickname gilt als verfuegbar');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b"}';
select is(public.check_nickname('MARKUS_77'), 'taken', 'vergeben (case-insensitive)');
select throws_ok($$ select public.set_nickname('markus_77') $$, 'P0001', 'nickname_taken', 'set_nickname taken');
select throws_ok($$ select public.set_nickname('a b') $$, 'P0001', 'nickname_invalid', 'set_nickname invalid');
select throws_ok($$ select public.set_nickname('tippety') $$, 'P0001', 'nickname_reserved', 'set_nickname reserved');

select * from finish();
rollback;
