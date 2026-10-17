import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { setLeagueCatalogFromRows } from '@/data/leagueCatalog';
import { supabase } from '@/data/supabase/client';
import { normalizeNick } from '@/lib/nickname';
import type { AuthProvider, AuthService, NicknameCheck, Profile, ProfileService } from './types';

/**
 * GERÜST – aktiv erst mit EXPO_PUBLIC_BACKEND=supabase + URL/anon key.
 * Ausgerichtet am Schema aus PR #2 (feat/supabase-schema, supabase/README.md) und docs/client-api-vertrag.md.
 *
 * Login: Supabase OAuth (PKCE) im System-Browser → Redirect tippety://auth-callback
 * (in Expo Go: exp://…/--/auth-callback – beide in Supabase → Auth → URL Configuration erlauben).
 * Natives „Sign in with Apple“ / Google-Sign-In (expo-apple-authentication bzw.
 * @react-native-google-signin + supabase.auth.signInWithIdToken) braucht einen Dev-Build.
 */
WebBrowser.maybeCompleteAuthSession();

const REMINDER_KEY = 'tippety.reminders'; // profiles hat (noch) keine Spalte dafür → lokal
const ERR: Record<string, string> = {
  nickname_taken: 'Dieser Nickname ist schon vergeben',
  nickname_invalid: 'Nur a–z, 0–9 und _ (3–16 Zeichen)',
  nickname_reserved: 'Dieser Name ist nicht erlaubt',
  not_authenticated: 'Bitte erneut anmelden',
};
export const mapError = (e: unknown): Error => {
  const msg = (e as { message?: string })?.message ?? String(e);
  return new Error(ERR[msg] ?? msg);
};

let catalogLoaded = false;
async function ensureCatalog() {
  if (catalogLoaded) return;
  const { data, error } = await supabase().from('leagues').select('id,sport,name,country,active').order('name');
  if (error) throw error;
  setLeagueCatalogFromRows(data ?? []);
  catalogLoaded = true;
}

async function loadProfile(): Promise<Profile | null> {
  const sb = supabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  await ensureCatalog();
  const [{ data: p }, { data: ul }, rem] = await Promise.all([
    sb.from('profiles').select('id,nickname,created_at').eq('id', user.id).maybeSingle<{ id: string; nickname: string | null; created_at: string }>(),
    sb.from('user_leagues').select('league_id,is_favorite').eq('user_id', user.id),
    AsyncStorage.getItem(REMINDER_KEY),
  ]);
  const rows = (ul ?? []) as { league_id: string; is_favorite: boolean }[];
  return {
    userId: user.id,
    provider: (user.app_metadata?.provider === 'google' ? 'google' : 'apple') as AuthProvider,
    nickname: p?.nickname ?? undefined,
    leagueIds: rows.map((r) => r.league_id),
    favoriteLeagueId: rows.find((r) => r.is_favorite)?.league_id,
    joinedAt: p?.created_at ?? user.created_at,
    reminders: rem !== '0',
  };
}

const must = async () => {
  const p = await loadProfile();
  if (!p) throw new Error('Nicht angemeldet');
  return p;
};

export const supabaseAuth: AuthService = {
  getProfile: loadProfile,
  async signIn(provider) {
    const sb = supabase();
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' } });
    if (error) throw error;
    if (Platform.OS !== 'web' && data.url) {
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') throw new Error('Anmeldung abgebrochen');
      const code = new URL(res.url).searchParams.get('code');
      if (!code) throw new Error('Kein Auth-Code erhalten');
      const { error: e2 } = await sb.auth.exchangeCodeForSession(code);
      if (e2) throw e2;
    }
    // Profilzeile legt der Trigger handle_new_user() an (nickname = NULL → Onboarding).
    return must();
  },
  async signOut() {
    await supabase().auth.signOut();
  },
};

export const supabaseProfile: ProfileService = {
  async checkNickname(n) {
    const { data, error } = await supabase().rpc('check_nickname', { p_nickname: n });
    if (error) throw mapError(error);
    return data as NicknameCheck; // 'available' | 'taken' | 'invalid' | 'reserved'
  },
  async setNickname(n) {
    const { error } = await supabase().rpc('set_nickname', { p_nickname: normalizeNick(n) });
    if (error) throw mapError(error);
    return must();
  },
  /** user_leagues ist direkt schreibbar (RLS: nur eigene, max. 1 Favorit). Mind. 1 Liga prüft der Client. */
  async setLeagues(leagueIds, favoriteLeagueId) {
    if (leagueIds.length === 0) throw new Error('Mindestens eine Liga wählen');
    const sb = supabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Nicht angemeldet');
    const uid = user.id;
    // 1) abgewählte Ligen löschen, 2) alle ohne Favorit upserten, 3) Favorit setzen (Reihenfolge wegen „max. 1 Favorit“)
    const del = await sb.from('user_leagues').delete().eq('user_id', uid).not('league_id', 'in', `(${leagueIds.join(',')})`);
    if (del.error) throw mapError(del.error);
    const up = await sb.from('user_leagues').upsert(leagueIds.map((league_id) => ({ user_id: uid, league_id, is_favorite: false })), { onConflict: 'user_id,league_id' });
    if (up.error) throw mapError(up.error);
    if (favoriteLeagueId) {
      const fav = await sb.from('user_leagues').update({ is_favorite: true }).eq('user_id', uid).eq('league_id', favoriteLeagueId);
      if (fav.error) throw mapError(fav.error);
    }
    return must();
  },
  async setReminders(on) {
    await AsyncStorage.setItem(REMINDER_KEY, on ? '1' : '0');
    return { ...(await must()), reminders: on };
  },
};
