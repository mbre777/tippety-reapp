/** Nickname-Regeln – identisch zur SQL-Funktion public.check_nickname (supabase/migrations). */
export const NICK_MIN = 3;
export const NICK_MAX = 16;
export const NICK_PATTERN = /^[a-z0-9_]+$/;

/** Reservierte Namen + Schimpfwörter (Teilwort-Treffer). Serverseitig in Tabelle reserved_nicknames gepflegt. */
export const RESERVED = ['admin', 'tippety', 'support', 'moderator', 'mod', 'root', 'system', 'official', 'staff'];
export const BLOCKED_PARTS = ['arsch', 'fick', 'fotze', 'hure', 'wichser', 'nazi', 'hitler', 'scheiss', 'scheiß', 'schlampe', 'spast', 'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'whore', 'penis', 'porn'];

export type NickFormat = 'empty' | 'length' | 'chars' | 'reserved' | 'ok';
export type NickStatus = NickFormat | 'checking' | 'taken' | 'available';

export const normalizeNick = (s: string) => s.trim().toLowerCase();

/** Lokale (synchrone) Prüfung; Eindeutigkeit prüft der Server. */
export function checkNickFormat(raw: string): NickFormat {
  if (raw.length === 0) return 'empty';
  if (!NICK_PATTERN.test(raw)) return 'chars';
  if (raw.length < NICK_MIN || raw.length > NICK_MAX) return 'length';
  const n = normalizeNick(raw);
  if (RESERVED.includes(n) || BLOCKED_PARTS.some((b) => n.includes(b))) return 'reserved';
  return 'ok';
}

export function nickSuggestions(base: string, isFree: (n: string) => boolean): string[] {
  const b = normalizeNick(base).replace(/[^a-z0-9_]/g, '').slice(0, 10) || 'tipper';
  const cands = [`${b}_b`, `${b}_26`, `${b}_tippt`, `${b}_1`, `${b}_fan`, `${b}${new Date().getFullYear() % 100}x`];
  return cands.filter((c) => c.length <= NICK_MAX && checkNickFormat(c) === 'ok' && isFree(c)).slice(0, 3);
}
