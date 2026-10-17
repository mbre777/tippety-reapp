-- Tippety: Vereinsfarben + Kuerzel DE Bundesliga, CH Super League, CH National League, NHL
-- Quelle: tippety/colors/*.json; Zuordnung ueber external_ids (provider + external_id), Namensabgleich geprueft.
-- Felder contrast/note bleiben bewusst ohne Spalte (Recherche-Metadaten).

-- de-bundesliga (18), provider sportmonks
update public.teams t
   set short_name = v.short, primary_color = v.primary_color, secondary_color = v.secondary_color,
       text_color = v.text_color, colors_locked = true, short_name_locked = true
  from (values
  ('503', 'FC Bayern München', 'FCB', '#ED0037', '#2A6CFF', '#FFFFFF'),
  ('68', 'Borussia Dortmund', 'BVB', '#FFD900', '#000000', '#000000'),
  ('3543', 'Sport-Club Freiburg', 'SCF', '#E40521', '#1D1D1B', '#FFFFFF'),
  ('3321', 'Bayer 04 Leverkusen', 'B04', '#000000', '#FFFF00', '#FF0000'),
  ('794', '1. FSV Mainz 05', 'M05', '#E30613', '#FFFFFF', '#FFFFFF'),
  ('3588', 'SV Elversberg', 'ELV', '#141414', '#D2BE8C', '#D2BE8C'),
  ('277', 'RB Leipzig', 'RBL', '#001F47', '#DD0741', '#FFFFFF'),
  ('82', 'SV Werder Bremen', 'SVW', '#00593C', '#FFFFFF', '#FFFFFF'),
  ('2708', 'Hamburger SV', 'HSV', '#005AAA', '#000000', '#FFFFFF'),
  ('90', 'FC Augsburg', 'FCA', '#006139', '#CC1719', '#FFFFFF'),
  ('366', 'Eintracht Frankfurt', 'SGE', '#000000', '#E30613', '#FFFFFF'),
  ('3320', '1. FC Köln', 'KOE', '#FF0000', '#FFFFFF', '#000000'),
  ('3319', 'VfB Stuttgart', 'VFB', '#C80A32', '#FFDD00', '#FFDD00'),
  ('67', 'FC Schalke 04', 'S04', '#004B9C', '#FFFFFF', '#FFFFFF'),
  ('2642', 'SC Paderborn 07', 'SCP', '#0066AF', '#000000', '#000000'),
  ('1079', '1. FC Union Berlin', 'FCU', '#E30613', '#FFDC00', '#FFDC00'),
  ('2726', 'TSG Hoffenheim', 'TSG', '#1F5DA6', '#FFFFFF', '#FFFFFF'),
  ('683', 'Borussia Mönchengladbach', 'BMG', '#FFFFFF', '#000000', '#000000')
  ) v(external_id, json_name, short, primary_color, secondary_color, text_color)
  join public.external_ids e on e.provider = 'sportmonks' and e.entity_type = 'team' and e.external_id = v.external_id
 where t.id = e.entity_id;

-- ch-super-league (12), provider sportmonks
update public.teams t
   set short_name = v.short, primary_color = v.primary_color, secondary_color = v.secondary_color,
       text_color = v.text_color, colors_locked = true, short_name_locked = true
  from (values
  ('13775', 'FC Lugano', 'LUG', '#000000', '#FFFFFF', '#FFFFFF'),
  ('647', 'BSC Young Boys', 'YBO', '#F1DA1E', '#000000', '#000000'),
  ('462', 'FC Sion', 'SIO', '#ED2424', '#170D0A', '#FFFFFF'),
  ('362', 'FC St. Gallen 1879', 'STG', '#007D3F', '#FFFFFF', '#FFFFFF'),
  ('389', 'FC Zürich', 'ZUR', '#172A53', '#AE9257', '#FFFFFF'),
  ('1970', 'Servette FC', 'SER', '#66202F', '#F6C941', '#FFFFFF'),
  ('468', 'FC Basel 1893', 'BAS', '#E30613', '#004899', '#FFFFFF'),
  ('3091', 'FC Luzern', 'LUZ', '#024380', '#FEDD00', '#FFFFFF'),
  ('10655', 'FC Thun', 'THU', '#E30613', '#FFFFFF', '#000000'),
  ('13771', 'FC Vaduz', 'VAD', '#DC002E', '#FFFFFF', '#FFFFFF'),
  ('2866', 'Grasshopper Club Zürich', 'GCZ', '#015791', '#AE9A64', '#FFFFFF'),
  ('2357', 'FC Lausanne-Sport', 'LAU', '#0165BA', '#E3B562', '#FFFFFF')
  ) v(external_id, json_name, short, primary_color, secondary_color, text_color)
  join public.external_ids e on e.provider = 'sportmonks' and e.entity_type = 'team' and e.external_id = v.external_id
 where t.id = e.entity_id;

-- ch-national-league (14), provider sihf
update public.teams t
   set short_name = v.short, primary_color = v.primary_color, secondary_color = v.secondary_color,
       text_color = v.text_color, colors_locked = true, short_name_locked = true
  from (values
  ('102128', 'EHC Biel-Bienne', 'EHCB', '#D00A11', '#FFCB03', '#FFFFFF'),
  ('101149', 'EHC Kloten', 'EHCK', '#E3493D', '#344C99', '#000000'),
  ('103140', 'Genève-Servette HC', 'GSHC', '#7B303E', '#FFCE00', '#FFFFFF'),
  ('103144', 'HC Ajoie', 'HCA', '#FFCC00', '#020A0A', '#020A0A'),
  ('101152', 'HC Ambrì-Piotta', 'HCAP', '#002861', '#FFFFFF', '#FFFFFF'),
  ('101151', 'HC Davos', 'HCD', '#005A9A', '#FFDD00', '#FFDD00'),
  ('101150', 'HC Lugano', 'HCL', '#000000', '#FFFFFF', '#FFFFFF'),
  ('103141', 'Lausanne HC', 'LHC', '#ED1C24', '#231F20', '#FFFFFF'),
  ('102126', 'SC Bern', 'SCB', '#E20014', '#FFDC00', '#FFDC00'),
  ('102127', 'SCL Tigers', 'SCL', '#FFD600', '#ED1C24', '#231F20'),
  ('101060', 'SC Rapperswil-Jona Lakers', 'SCRJ', '#15326A', '#A71418', '#FFFFFF'),
  ('101139', 'ZSC Lions', 'ZSC', '#002647', '#E40613', '#FFFFFF'),
  ('101144', 'EV Zug', 'EVZ', '#005A99', '#C1A758', '#FFFFFF'),
  ('103138', 'HC Fribourg-Gottéron', 'HCFG', '#1D1D1B', '#E20613', '#FFFFFF')
  ) v(external_id, json_name, short, primary_color, secondary_color, text_color)
  join public.external_ids e on e.provider = 'sihf' and e.entity_type = 'team' and e.external_id = v.external_id
 where t.id = e.entity_id;

-- nhl (32), provider nhl
update public.teams t
   set short_name = v.short, primary_color = v.primary_color, secondary_color = v.secondary_color,
       text_color = v.text_color, colors_locked = true, short_name_locked = true
  from (values
  ('54', 'Vegas Golden Knights', 'VGK', '#333F48', '#B9975B', '#B9975B'),
  ('12', 'Carolina Hurricanes', 'CAR', '#CD001A', '#010101', '#FFFFFF'),
  ('68', 'Utah Mammoth', 'UTA', '#6CACE4', '#010101', '#010101'),
  ('6', 'Boston Bruins', 'BOS', '#FFB81C', '#010101', '#010101'),
  ('9', 'Ottawa Senators', 'OTT', '#010101', '#C8102E', '#B9975B'),
  ('3', 'New York Rangers', 'NYR', '#0033A0', '#C8102E', '#FFFFFF'),
  ('22', 'Edmonton Oilers', 'EDM', '#00205B', '#CF4520', '#CF4520'),
  ('21', 'Colorado Avalanche', 'COL', '#862633', '#236192', '#FFFFFF'),
  ('30', 'Minnesota Wild', 'MIN', '#154734', '#A6192E', '#DDCBA4'),
  ('55', 'Seattle Kraken', 'SEA', '#041C2C', '#9CDBD9', '#9CDBD9'),
  ('14', 'Tampa Bay Lightning', 'TBL', '#00205B', '#FFFFFF', '#FFFFFF'),
  ('52', 'Winnipeg Jets', 'WPG', '#041E42', '#A2AAAD', '#A2AAAD'),
  ('13', 'Florida Panthers', 'FLA', '#041E42', '#C8102E', '#B9975B'),
  ('7', 'Buffalo Sabres', 'BUF', '#003087', '#FFB81C', '#FFB81C'),
  ('15', 'Washington Capitals', 'WSH', '#041E42', '#C8102E', '#FFFFFF'),
  ('24', 'Anaheim Ducks', 'ANA', '#010101', '#CF4520', '#CF4520'),
  ('1', 'New Jersey Devils', 'NJD', '#CD001A', '#010101', '#000000'),
  ('28', 'San Jose Sharks', 'SJS', '#00778B', '#E57200', '#FFFFFF'),
  ('10', 'Toronto Maple Leafs', 'TOR', '#00205B', '#FFFFFF', '#FFFFFF'),
  ('2', 'New York Islanders', 'NYI', '#003087', '#FC4C02', '#FC4C02'),
  ('19', 'St. Louis Blues', 'STL', '#006AC6', '#FFB81C', '#FFFFFF'),
  ('25', 'Dallas Stars', 'DAL', '#00843D', '#A2AAAD', '#FFFFFF'),
  ('18', 'Nashville Predators', 'NSH', '#FFB81C', '#041E42', '#041E42'),
  ('8', 'Montréal Canadiens', 'MTL', '#A6192E', '#001E62', '#FFFFFF'),
  ('5', 'Pittsburgh Penguins', 'PIT', '#010101', '#FFB81C', '#FFB81C'),
  ('17', 'Detroit Red Wings', 'DET', '#C8102E', '#FFFFFF', '#FFFFFF'),
  ('16', 'Chicago Blackhawks', 'CHI', '#010101', '#C8102E', '#C8102E'),
  ('23', 'Vancouver Canucks', 'VAN', '#00205B', '#97999B', '#97999B'),
  ('29', 'Columbus Blue Jackets', 'CBJ', '#A2AAAD', '#C8102E', '#041E42'),
  ('4', 'Philadelphia Flyers', 'PHI', '#DC4405', '#010101', '#010101'),
  ('26', 'Los Angeles Kings', 'LAK', '#010101', '#A2AAAD', '#A2AAAD'),
  ('20', 'Calgary Flames', 'CGY', '#C8102E', '#F1BE48', '#F1BE48')
  ) v(external_id, json_name, short, primary_color, secondary_color, text_color)
  join public.external_ids e on e.provider = 'nhl' and e.entity_type = 'team' and e.external_id = v.external_id
 where t.id = e.entity_id;
