import '@/lib/cryptoPolyfill'; // vor supabase-js: PKCE mit S256 statt plain
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * Supabase-Client. Keys kommen ausschließlich aus Env (EXPO_PUBLIC_* ist im App-Bundle sichtbar –
 * daher NUR URL + anon/publishable key; Sportdaten-API-Keys & service_role nie in die App!).
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const supabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!supabaseConfigured) throw new Error('Supabase nicht konfiguriert (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY fehlen)');
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    });
    // Token-Refresh nur im Vordergrund (Empfehlung Supabase für React Native)
    if (Platform.OS !== 'web') {
      const c = client;
      AppState.addEventListener('change', (st) => (st === 'active' ? c.auth.startAutoRefresh() : c.auth.stopAutoRefresh()));
    }
  }
  return client;
}
