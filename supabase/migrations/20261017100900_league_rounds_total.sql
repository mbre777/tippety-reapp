-- Tippety: leagues.rounds_total (Gesamtzahl Runden/Spieltage der laufenden Saison, inkl. Finalphase)
-- Der Import (core/sql.ts) setzt rounds_total nie; Pflege nur per Migration/manuell.
alter table public.leagues
  add column rounds_total int check (rounds_total > 0);
comment on column public.leagues.rounds_total is
  'Gesamtzahl Spieltage/Runden der laufenden Saison inkl. Finalphase (AT 22+10, CH SL 33+5); NULL = keine festen Runden (z. B. NHL). Import setzt den Wert nie.';

update public.leagues l set rounds_total = v.n
  from (values ('sportmonks','82',34), ('sportmonks','181',32), ('sportmonks','591',38), ('sihf','1',52)) v(provider, external_id, n)
  join public.external_ids e on e.provider = v.provider and e.entity_type = 'league' and e.external_id = v.external_id
 where l.id = e.entity_id;
