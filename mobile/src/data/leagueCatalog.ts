import type { League } from './types';
import { leagues as mockLeagues } from './mock/teams';

/**
 * Liga-Katalog (synchron lesbar). Mock: statische Liste. Supabase: wird beim Start aus `leagues`
 * geladen (id = uuid) und mit Darstellungs-Metadaten (Kürzel, Farbe, Flagge) per Name angereichert –
 * diese Felder gibt es im Schema nicht (siehe docs/client-api-vertrag.md).
 */
export const leagueCatalog: League[] = [...mockLeagues];

const META: Record<string, Pick<League, 'code' | 'color' | 'flag'>> = Object.fromEntries(
  mockLeagues.map((l) => [l.name.toLowerCase(), { code: l.code, color: l.color, flag: l.flag }]),
);
type LeagueRow = { id: string; sport: League['sport']; name: string; country: string | null; active: boolean };
export function setLeagueCatalogFromRows(rows: LeagueRow[]) {
  const ls = rows.map<League>((r) => {
    const m = META[r.name.toLowerCase()] ?? { code: r.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase(), color: '#5D6E86', flag: '' };
    return { id: r.id, sport: r.sport, name: r.name, country: r.country ?? '', available: r.active, ...m };
  });
  leagueCatalog.splice(0, leagueCatalog.length, ...ls);
}
