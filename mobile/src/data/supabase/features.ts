/**
 * Feature-Detection gegen das live Schema: Neue Spalten/RPCs (Migration 0005, feat/schema-client-gaps)
 * werden zuerst versucht; fehlen sie, fällt der Client dauerhaft (pro App-Start) auf die bisherige
 * Ersatzlösung zurück. So läuft die App vor und nach 0005.
 */
type PgErr = { code?: string; message?: string } | null | undefined;
const MISSING_CODES = new Set(['42703', '42883', '42P01', 'PGRST200', 'PGRST202', 'PGRST204', 'PGRST205']);

export function isMissingFeature(e: PgErr): boolean {
  if (!e) return false;
  if (e.code && MISSING_CODES.has(e.code)) return true;
  const m = e.message ?? '';
  return /does not exist|Could not find|schema cache/i.test(m);
}

const state = new Map<string, boolean>(); // true = vorhanden, false = fehlt

/** Führt `primary` aus, solange das Feature nicht als fehlend bekannt ist; sonst `fallback`. */
export async function tryFeature<T>(key: string, primary: () => PromiseLike<{ data: unknown; error: PgErr }>, fallback: () => Promise<T>): Promise<T> {
  if (state.get(key) !== false) {
    const res = await primary();
    if (!res.error) {
      state.set(key, true);
      return res.data as T;
    }
    if (!isMissingFeature(res.error)) throw res.error;
    state.set(key, false);
    if (__DEV__) console.info(`[supabase] Feature „${key}“ fehlt im Schema → Fallback`);
  }
  return fallback();
}

export const featureState = () => Object.fromEntries(state);
