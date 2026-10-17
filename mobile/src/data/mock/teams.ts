import type { League, Team } from '../types';

export const leagues: League[] = [
  { id: 'pl', sport: 'football', name: 'Premier League', country: 'England' },
  { id: 'laliga', sport: 'football', name: 'La Liga', country: 'Spanien' },
  { id: 'bl', sport: 'football', name: 'Bundesliga', country: 'Deutschland' },
  { id: 'seriea', sport: 'football', name: 'Serie A', country: 'Italien' },
  { id: 'ligue1', sport: 'football', name: 'Ligue 1', country: 'Frankreich' },
  { id: 'abl', sport: 'football', name: 'Admiral Bundesliga', country: 'Österreich' },
  { id: 'nl', sport: 'hockey', name: 'National League', country: 'Schweiz' },
];

const t = (id: string, name: string, short: string, bg: string, fg = '#FFFFFF'): Team => ({
  id,
  name,
  short,
  colors: [bg, fg],
});

export const teams = {
  // Bundesliga
  fcb: t('fcb', 'FC Bayern München', 'FCB', '#DC052D'),
  bvb: t('bvb', 'Borussia Dortmund', 'BVB', '#FDE100', '#111111'),
  rbl: t('rbl', 'RB Leipzig', 'RBL', '#DD0741'),
  scf: t('scf', 'SC Freiburg', 'SCF', '#C8102E'),
  m05: t('m05', 'Mainz 05', 'M05', '#C3141E'),
  wob: t('wob', 'VfL Wolfsburg', 'WOB', '#65B32E'),
  // Premier League
  ars: t('ars', 'Arsenal', 'ARS', '#EF0107'),
  mci: t('mci', 'Manchester City', 'MCI', '#6CABDD', '#0B1C3A'),
  liv: t('liv', 'Liverpool', 'LIV', '#C8102E'),
  che: t('che', 'Chelsea', 'CHE', '#034694'),
  // La Liga
  rma: t('rma', 'Real Madrid', 'RMA', '#FEBE10', '#1A1A1A'),
  bar: t('bar', 'FC Barcelona', 'BAR', '#A50044'),
  // Serie A
  int: t('int', 'Inter', 'INT', '#0068A8'),
  juv: t('juv', 'Juventus', 'JUV', '#1A1A1A'),
  // Ligue 1
  psg: t('psg', 'Paris Saint-Germain', 'PSG', '#004170'),
  om: t('om', 'Olympique Marseille', 'OM', '#2FAEE0'),
  // Österreich
  rap: t('rap', 'SK Rapid Wien', 'SCR', '#00824A'),
  fak: t('fak', 'FK Austria Wien', 'FAK', '#5A2D82'),
  rbs: t('rbs', 'FC Red Bull Salzburg', 'RBS', '#D6002A'),
  stu: t('stu', 'SK Sturm Graz', 'STU', '#1A1A1A'),
  // Schweizer National League
  zsc: t('zsc', 'ZSC Lions', 'ZSC', '#1F3D7A'),
  hcd: t('hcd', 'HC Davos', 'HCD', '#F5C400', '#0B2A5B'),
  scb: t('scb', 'SC Bern', 'SCB', '#D2001E'),
  evz: t('evz', 'EV Zug', 'EVZ', '#0C4DA2'),
  hcl: t('hcl', 'HC Lugano', 'HCL', '#111111'),
  gsh: t('gsh', 'Genève-Servette HC', 'GSHC', '#8C1B2F'),
  lhc: t('lhc', 'Lausanne HC', 'LHC', '#1A1A1A'),
  fgo: t('fgo', 'HC Fribourg-Gottéron', 'FRI', '#111111'),
  scl: t('scl', 'SCL Tigers', 'SCL', '#F6C200', '#222222'),
  ehk: t('ehk', 'EHC Kloten', 'EHCK', '#E2001A'),
  amb: t('amb', 'HC Ambrì-Piotta', 'HCAP', '#1F4E9C'),
  bie: t('bie', 'EHC Biel-Bienne', 'EHCB', '#E30613'),
  scr: t('scr', 'SC Rapperswil-Jona Lakers', 'SCRJ', '#0A2240'),
  ajo: t('ajo', 'HC Ajoie', 'HCA', '#F39200', '#1A1A1A'),
} satisfies Record<string, Team>;
