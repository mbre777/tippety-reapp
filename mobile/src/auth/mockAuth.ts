import { checkNickFormat, normalizeNick } from '@/lib/nickname';
import { takenNicknames } from '@/data/mock/fixtures';
import type { AuthService, Profile, ProfileService } from './types';

/** Mock: Session nur im Speicher (App-Neustart = abgemeldet). */
let current: Profile | null = null;
const wait = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const need = () => {
  if (!current) throw new Error('Nicht angemeldet');
  return current;
};

export const mockAuth: AuthService = {
  getProfile: () => wait(current, 0),
  signIn: (provider) => {
    current = { userId: 'me', provider, leagueIds: [], joinedAt: '2026-08-01', reminders: true };
    return wait(current, 400);
  },
  signOut: () => {
    current = null;
    return wait(undefined, 0);
  },
};

export const mockProfile: ProfileService = {
  checkNickname: (n) => {
    const f = checkNickFormat(n);
    if (f === 'reserved') return wait('reserved' as const);
    if (f !== 'ok') return wait('invalid' as const);
    const taken = takenNicknames.includes(normalizeNick(n)) && normalizeNick(n) !== current?.nickname;
    return wait(taken ? ('taken' as const) : ('available' as const));
  },
  setNickname: (n) => {
    current = { ...need(), nickname: normalizeNick(n) };
    return wait(current, 150);
  },
  setLeagues: (leagueIds, favoriteLeagueId) => {
    current = { ...need(), leagueIds, favoriteLeagueId };
    return wait(current, 150);
  },
  setReminders: (on) => {
    current = { ...need(), reminders: on };
    return wait(current, 0);
  },
};

/** Nur Mock/Demo: direkt einen fertig eingerichteten User setzen (Web-Screenshots: ?demo=1). */
export function mockDemoProfile(p: Partial<Profile> = {}): Profile {
  current = { userId: 'me', provider: 'apple', nickname: 'markus_b', leagueIds: ['bl', 'abl', 'chsl', 'nl'], favoriteLeagueId: 'bl', joinedAt: '2026-08-01', reminders: true, ...p };
  return current;
}
