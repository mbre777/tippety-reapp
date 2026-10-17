-- Tippety: Vereinsfarben (primary/secondary/text) + Schutz manuell gepflegter Werte vor dem Import

alter table public.teams
  add column primary_color   text check (primary_color   ~ '^#[0-9A-Fa-f]{6}$'),
  add column secondary_color text check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column text_color      text check (text_color      ~ '^#[0-9A-Fa-f]{6}$'),
  add column colors_locked     boolean not null default false,
  add column short_name_locked boolean not null default false;

comment on column public.teams.color is
  'DEPRECATED: Alias von primary_color, per Trigger teams_sync_color synchron gehalten. Neue Clients nutzen primary_color.';
comment on column public.teams.colors_locked is 'true = Farben manuell gepflegt, Import ueberschreibt color/primary_color nicht';
comment on column public.teams.short_name_locked is 'true = short_name manuell gepflegt, Import ueberschreibt ihn nicht';

-- color <-> primary_color synchron (primary_color fuehrt; Legacy-Schreibzugriffe auf color werden uebernommen)
create or replace function public.teams_sync_color()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.primary_color := coalesce(new.primary_color, new.color);
    new.color := new.primary_color;
  elsif new.primary_color is distinct from old.primary_color then
    new.color := new.primary_color;
  elsif new.color is distinct from old.color then
    new.primary_color := new.color;
  end if;
  return new;
end $$;
revoke execute on function public.teams_sync_color() from public, anon, authenticated;

create trigger teams_sync_color
  before insert or update on public.teams
  for each row execute function public.teams_sync_color();

update public.teams set primary_color = color where color is not null and primary_color is null;

-- Seed: ADMIRAL Bundesliga AT (Quelle: tippety/colors/at-bundesliga.json), Zuordnung ueber external_ids (sportmonks).
-- SCR Altach: Gelb (#FFD700) als Akzent/Text bewusst nach Entscheidung Markus, nicht offiziell verifiziert.
update public.teams t
   set short_name = v.short, primary_color = v.primary_color, secondary_color = v.secondary_color,
       text_color = v.text_color, colors_locked = true, short_name_locked = true
  from (values
  ('3678', 'SK Rapid', 'SCR', '#00794C', '#FFFFFF', '#FFFFFF'),
  ('49', 'FC Red Bull Salzburg', 'RBS', '#DB0A40', '#0C2044', '#FFFFFF'),
  ('3369', 'LASK', 'ASK', '#151616', '#FFFFFF', '#FFFFFF'),
  ('3357', 'SK Sturm Graz', 'STU', '#000000', '#FFFFFF', '#FFFFFF'),
  ('5769', 'TSV Hartberg', 'HTB', '#00497D', '#FFFFFF', '#FFFFFF'),
  ('3569', 'SV Ried', 'SVR', '#007C4F', '#000000', '#FFFFFF'),
  ('5724', 'Grazer AK 1902', 'GAK', '#C3171F', '#FFFFFF', '#FFFFFF'),
  ('4080', 'WSG Tirol', 'WSG', '#2C943E', '#050606', '#FFFFFF'),
  ('3601', 'SC Austria Lustenau', 'ALU', '#00803D', '#FDC100', '#FFFFFF'),
  ('3630', 'FK Austria Wien', 'FAK', '#604696', '#34175C', '#FFFFFF'),
  ('3949', 'SCR Altach', 'ALT', '#000000', '#FFD700', '#FFD700'),
  ('3787', 'Wolfsberger AC', 'WAC', '#211E1E', '#EB1923', '#FFFFFF')
  ) v(external_id, json_name, short, primary_color, secondary_color, text_color)
  join public.external_ids e on e.provider = 'sportmonks' and e.entity_type = 'team' and e.external_id = v.external_id
 where t.id = e.entity_id;
