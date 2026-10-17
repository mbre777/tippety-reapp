import { useSyncExternalStore } from 'react';
import type { Profile } from './types';

/** Globaler Session-Store (synchron lesbar für Header, Toolbar, Routing-Gate). */
type State = { ready: boolean; profile: Profile | null };
let state: State = { ready: false, profile: null };
const listeners = new Set<() => void>();

export function setSession(profile: Profile | null) {
  state = { ready: true, profile };
  listeners.forEach((l) => l());
}
export const getSession = () => state;
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useSession = () => useSyncExternalStore(subscribe, () => state, () => state);

/** Abgeleiteter Onboarding-Schritt */
export function onboardingStep(p: Profile | null): 'login' | 'nickname' | 'leagues' | 'done' {
  if (!p) return 'login';
  if (!p.nickname) return 'nickname';
  if (p.leagueIds.length === 0) return 'leagues';
  return 'done';
}
