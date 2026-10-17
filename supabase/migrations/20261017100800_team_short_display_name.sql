-- Tippety: teams.short_display_name (Kurzname fuer Listen) + Lock; Import setzt das Feld nie.
alter table public.teams
  add column short_display_name text check (char_length(short_display_name) between 2 and 18),
  add column short_display_name_locked boolean not null default false;
comment on column public.teams.short_display_name is 'Kurzname für Listen, z. B. ''Rapid''';
comment on column public.teams.short_display_name_locked is 'true = manuell gepflegt; Import setzt short_display_name ohnehin nie (Absicherung)';

update public.teams t set short_display_name = v.n, short_display_name_locked = true
  from (values
  ('3678', 'Rapid'),
  ('49', 'Salzburg'),
  ('3369', 'LASK'),
  ('3357', 'Sturm Graz'),
  ('5769', 'Hartberg'),
  ('3569', 'Ried'),
  ('5724', 'GAK'),
  ('4080', 'WSG Tirol'),
  ('3601', 'Lustenau'),
  ('3630', 'Austria Wien'),
  ('3949', 'Altach'),
  ('3787', 'WAC'),
  ('503', 'Bayern'),
  ('68', 'Dortmund'),
  ('3321', 'Leverkusen'),
  ('683', 'Gladbach'),
  ('366', 'Frankfurt'),
  ('3588', 'Elversberg'),
  ('90', 'Augsburg'),
  ('3320', 'Köln'),
  ('1079', 'Union Berlin'),
  ('794', 'Mainz'),
  ('2708', 'HSV'),
  ('2642', 'Paderborn'),
  ('277', 'Leipzig'),
  ('3543', 'Freiburg'),
  ('67', 'Schalke'),
  ('2726', 'Hoffenheim'),
  ('3319', 'Stuttgart'),
  ('82', 'Bremen'),
  ('468', 'Basel'),
  ('2866', 'GC'),
  ('2357', 'Lausanne-Sport'),
  ('13775', 'Lugano'),
  ('3091', 'Luzern'),
  ('1970', 'Servette'),
  ('462', 'Sion'),
  ('362', 'St. Gallen'),
  ('10655', 'Thun'),
  ('13771', 'Vaduz'),
  ('647', 'YB'),
  ('389', 'FCZ')
  ) v(external_id, n)
  join public.external_ids e on e.provider = 'sportmonks' and e.entity_type = 'team' and e.external_id = v.external_id
 where t.id = e.entity_id;

update public.teams t set short_display_name = v.n, short_display_name_locked = true
  from (values
  ('102128', 'Biel'),
  ('101149', 'Kloten'),
  ('101144', 'Zug'),
  ('103138', 'Gottéron'),
  ('103140', 'Servette'),
  ('103144', 'Ajoie'),
  ('101152', 'Ambrì'),
  ('101151', 'Davos'),
  ('101150', 'Lugano'),
  ('103141', 'Lausanne'),
  ('102126', 'SCB'),
  ('101060', 'Lakers'),
  ('102127', 'SCL Tigers'),
  ('101139', 'ZSC Lions')
  ) v(external_id, n)
  join public.external_ids e on e.provider = 'sihf' and e.entity_type = 'team' and e.external_id = v.external_id
 where t.id = e.entity_id;

update public.teams t set short_display_name = v.n, short_display_name_locked = true
  from (values
  ('24', 'Ducks'),
  ('6', 'Bruins'),
  ('7', 'Sabres'),
  ('20', 'Flames'),
  ('12', 'Hurricanes'),
  ('16', 'Blackhawks'),
  ('21', 'Avalanche'),
  ('29', 'Blue Jackets'),
  ('25', 'Stars'),
  ('17', 'Red Wings'),
  ('22', 'Oilers'),
  ('13', 'Panthers'),
  ('26', 'Kings'),
  ('30', 'Wild'),
  ('8', 'Canadiens'),
  ('18', 'Predators'),
  ('1', 'Devils'),
  ('2', 'Islanders'),
  ('3', 'Rangers'),
  ('9', 'Senators'),
  ('4', 'Flyers'),
  ('5', 'Penguins'),
  ('28', 'Sharks'),
  ('55', 'Kraken'),
  ('19', 'Blues'),
  ('14', 'Lightning'),
  ('10', 'Maple Leafs'),
  ('68', 'Mammoth'),
  ('23', 'Canucks'),
  ('54', 'Golden Knights'),
  ('15', 'Capitals'),
  ('52', 'Jets')
  ) v(external_id, n)
  join public.external_ids e on e.provider = 'nhl' and e.entity_type = 'team' and e.external_id = v.external_id
 where t.id = e.entity_id;
