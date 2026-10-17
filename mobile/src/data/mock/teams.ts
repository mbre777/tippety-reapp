import type { League, Team } from '../types';

const L = (id: string, sport: League['sport'], name: string, country: string, flag: string, code: string, color: string, available: boolean): League => ({ id, sport, name, country, flag, code, color, available });

/** Reihenfolge = Anzeige-Reihenfolge in der Liga-Auswahl. */
const RT: Record<string, number> = { bl: 34, abl: 32, chsl: 38, nl: 52 }; // = leagues.rounds_total (NHL: null)
export const leagues: League[] = [
  L('bl', 'football', 'Bundesliga', 'Deutschland', '🇩🇪', 'BL', '#D20515', true),
  L('abl', 'football', 'AT Bundesliga', 'Österreich', '🇦🇹', 'AT', '#E8202A', true),
  L('chsl', 'football', 'CH Super League', 'Schweiz', '🇨🇭', 'SL', '#C8102E', true),
  L('pl', 'football', 'Premier League', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'PL', '#3D195B', false),
  L('ligue1', 'football', 'Ligue 1', 'Frankreich', '🇫🇷', 'L1', '#8C96A6', false),
  L('seriea', 'football', 'Serie A', 'Italien', '🇮🇹', 'SA', '#4FA3DD', false),
  L('laliga', 'football', 'La Liga', 'Spanien', '🇪🇸', 'LL', '#F0525B', false),
  L('nl', 'hockey', 'National League', 'Schweiz', '🇨🇭', 'NL', '#13284A', true),
  L('nhl', 'hockey', 'NHL', 'USA / Kanada', '🇺🇸', 'NHL', '#111111', true),
].map((l) => (RT[l.id] ? { ...l, roundsTotal: RT[l.id] } : l));

const t = (id: string, name: string, short: string, bg: string, fg = '#FFFFFF', shortName?: string, secondary?: string): Team => ({ id, name, short, colors: [bg, fg], shortName, secondary });
/** Team ohne bekannte Vereinsfarben (Fallback-Badge) */
const nc = (id: string, name: string, short: string, shortName?: string): Team => ({ id, name, short, colors: ['#E3E8EF', '#1B2433'], shortName, noColors: true });

export const teams = {
  // Bundesliga
  fcb: t('fcb', 'FC Bayern München', 'FCB', '#DC052D', '#FFFFFF', 'FC Bayern'),
  bvb: t('bvb', 'Borussia Dortmund', 'BVB', '#FDE100', '#111111', 'Dortmund'),
  b04: t('b04', 'Bayer 04 Leverkusen', 'B04', '#E32221', '#FFFFFF', 'Leverkusen'),
  vfb: t('vfb', 'VfB Stuttgart', 'VFB', '#FFFFFF', '#E32219'),
  rbl: t('rbl', 'RB Leipzig', 'RBL', '#DD0741'),
  sge: t('sge', 'Eintracht Frankfurt', 'SGE', '#1A1A1A'),
  scf: t('scf', 'SC Freiburg', 'SCF', '#C8102E'),
  m05: t('m05', 'Mainz 05', 'M05', '#C3141E'),
  wob: t('wob', 'VfL Wolfsburg', 'WOB', '#65B32E', '#FFFFFF', 'Wolfsburg'),
  // Österreich – Farben aus colors/at-bundesliga.json
  rap: t('rap', "SK Rapid", 'SCR', '#00794C', '#FFFFFF', undefined, '#FFFFFF'),
  rbs: t('rbs', "FC Red Bull Salzburg", 'RBS', '#DB0A40', '#FFFFFF', "RB Salzburg", '#0C2044'),
  at_ask: t('at_ask', "LASK", 'ASK', '#151616', '#FFFFFF', undefined, '#FFFFFF'),
  stu: t('stu', "SK Sturm Graz", 'STU', '#000000', '#FFFFFF', 'Sturm Graz', '#FFFFFF'),
  at_htb: t('at_htb', "TSV Hartberg", 'HTB', '#00497D', '#FFFFFF', undefined, '#FFFFFF'),
  at_svr: t('at_svr', "SV Ried", 'SVR', '#007C4F', '#FFFFFF', undefined, '#000000'),
  at_gak: t('at_gak', "Grazer AK 1902", 'GAK', '#C3171F', '#FFFFFF', undefined, '#FFFFFF'),
  at_wsg: t('at_wsg', "WSG Tirol", 'WSG', '#2C943E', '#FFFFFF', undefined, '#050606'),
  at_alu: t('at_alu', "SC Austria Lustenau", 'ALU', '#00803D', '#FFFFFF', undefined, '#FDC100'),
  fak: t('fak', "FK Austria Wien", 'FAK', '#604696', '#FFFFFF', "Austria Wien", '#34175C'),
  at_alt: t('at_alt', "SCR Altach", 'ALT', '#000000', '#FFD700', undefined, '#FFD700'),
  at_wac: t('at_wac', "Wolfsberger AC", 'WAC', '#211E1E', '#FFFFFF', undefined, '#EB1923'),
  smf: nc('smf', 'SV Sportunion Mauerwerk Allerheiligen-Feldkirchen', 'SMF', 'Allerheiligen-F.'), // Fallback ohne Farben, langer Name
  // Schweiz Fußball
  yb: t('yb', 'BSC Young Boys', 'YB', '#FFD200', '#111111', 'Young Boys'),
  fcbs: t('fcbs', 'FC Basel 1893', 'FCB', '#D2001E', '#FFFFFF', 'FC Basel'),
  fcz: t('fcz', 'FC Zürich', 'FCZ', '#0055A4', '#FFFFFF'),
  gc: t('gc', 'Grasshopper Club', 'GC', '#1C4D9E', '#FFFFFF', 'Grasshoppers'),
  // Schweizer National League
  zsc: t('zsc', 'ZSC Lions', 'ZSC', '#1F3D7A'),
  hcd: t('hcd', 'HC Davos', 'HCD', '#F5C400', '#0B2A5B'),
  scb: t('scb', 'SC Bern', 'SCB', '#D2001E'),
  evz: t('evz', 'EV Zug', 'EVZ', '#0C4DA2'),
  hcl: t('hcl', 'HC Lugano', 'HCL', '#111111'),
  gsh: t('gsh', 'Genève-Servette HC', 'GSHC', '#8C1B2F', '#FFFFFF', 'Genève-Servette'),
  lhc: t('lhc', 'Lausanne HC', 'LHC', '#D2001E'),
  fgo: t('fgo', 'HC Fribourg-Gottéron', 'FRI', '#111111', '#FFFFFF', 'Fribourg-Gottéron'),
  ehk: t('ehk', 'EHC Kloten', 'KLO', '#0B2A5B', '#FFFFFF'),
  bie: t('bie', 'EHC Biel-Bienne', 'EHCB', '#E30613', '#FFFFFF', 'EHC Biel'),
  // NHL
  tor: t('tor', 'Toronto Maple Leafs', 'TOR', '#00205B', '#FFFFFF', 'Toronto'),
  mtl: t('mtl', 'Montréal Canadiens', 'MTL', '#AF1E2D', '#FFFFFF', 'Montréal'),
  nyr: t('nyr', 'New York Rangers', 'NYR', '#0038A8', '#FFFFFF', 'NY Rangers'),
  bos: t('bos', 'Boston Bruins', 'BOS', '#FFB81C', '#111111', 'Boston'),
  edm: t('edm', 'Edmonton Oilers', 'EDM', '#041E42', '#FF4C00', 'Edmonton'),
  cgy: t('cgy', 'Calgary Flames', 'CGY', '#C8102E', '#F1BE48', 'Calgary'),
} satisfies Record<string, Team>;
