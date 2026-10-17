import { useCallback, useEffect, useRef, useState } from 'react';
import { mockRepository } from './mock/mockRepository';
import type { TippetyRepository } from './repository';
import { leagueCatalog as leagues } from './leagueCatalog';
import { supabaseConfigured } from './supabase/client';
import { supabaseRepository } from './supabase/supabaseRepository';
import { mockAuth, mockProfile } from '@/auth/mockAuth';
import { supabaseAuth, supabaseProfile } from '@/auth/supabaseAuth';
import type { AuthService, ProfileService } from '@/auth/types';

export * from './types';
export { useTipsVersion } from './events';
export { MOCK_TODAY } from './mock/fixtures';

/**
 * Einziger Austauschpunkt Mock ↔ Supabase.
 * Supabase aktiv, wenn EXPO_PUBLIC_BACKEND=supabase UND URL + anon key gesetzt sind.
 */
export const backendKind: 'mock' | 'supabase' = process.env.EXPO_PUBLIC_BACKEND === 'supabase' && supabaseConfigured ? 'supabase' : 'mock';
export const repo: TippetyRepository = backendKind === 'supabase' ? supabaseRepository : mockRepository;
export const auth: AuthService = backendKind === 'supabase' ? supabaseAuth : mockAuth;
export const profileApi: ProfileService = backendKind === 'supabase' ? supabaseProfile : mockProfile;

/** Liga-Stammdaten (Mock statisch, Supabase: beim Start aus `leagues` geladen). */
export const allLeagues = leagues;
export const leagueById = (id: string) => leagues.find((l) => l.id === id);
export const leagueName = (id: string) => leagueById(id)?.name ?? id;

/** Kleiner Lade-Hook; später ggf. durch TanStack Query ersetzen. */
export function useQuery<T>(fn: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<{ key: string; data?: T; error?: Error }>({ key: '' });
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const key = JSON.stringify(deps);
  useEffect(() => {
    let alive = true;
    fnRef.current().then(
      (data) => alive && setState({ key, data }),
      (error: Error) => alive && setState({ key, error }),
    );
    return () => {
      alive = false;
    };
  }, [key]);
  const fresh = state.key === key;
  const setData = useCallback((data: T) => setState({ key, data }), [key]);
  return { data: fresh ? state.data : undefined, error: fresh ? state.error : undefined, loading: !fresh, setData };
}
