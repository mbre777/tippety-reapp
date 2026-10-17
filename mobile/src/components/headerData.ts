import { myStats } from '@/data/mock/fixtures';
import type { Sport, UserStats } from '@/data/types';

export { MOCK_TODAY } from '@/data/mock/fixtures';
/** Header braucht Profil/Streak synchron; später aus Session/Auth-Store. */
export const myStatsSync = (sport: Sport): UserStats => myStats[sport];
