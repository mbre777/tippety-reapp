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
export type LeagueRow = { id: string; sport: League['sport']; name: string; country: string | null; active: boolean; short_name?: string | null; color?: string | null; flag_url?: string | null; country_code?: string | null; rounds_total?: number | null };

/** ISO-3166-Alpha-2 → Flaggen-Emoji (z. B. "AT" → 🇦🇹) */
export const flagEmoji = (cc?: string | null) =>
  cc && /^[A-Za-z]{2}$/.test(cc) ? String.fromCodePoint(...cc.toUpperCase().split('').map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : '';
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Schema-Werte (ab Migration 0005) haben Vorrang, sonst Client-Mapping per Name, sonst neutral. */
export function setLeagueCatalogFromRows(rows: LeagueRow[]) {
  const ls = rows.map<League>((r) => {
    const m = META[r.name.toLowerCase()];
    return {
      id: r.id, sport: r.sport, name: r.name, country: r.country ?? '', available: r.active,
      code: r.short_name?.trim() || m?.code || r.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase(),
      color: r.color && HEX.test(r.color) ? r.color : m?.color ?? '#5D6E86',
      flag: flagEmoji(r.country_code) || m?.flag || '',
      flagUrl: r.flag_url ?? undefined,
      roundsTotal: r.rounds_total ?? undefined,
    };
  });
  leagueCatalog.splice(0, leagueCatalog.length, ...ls);
}
