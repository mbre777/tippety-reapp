export type AuthProvider = 'apple' | 'google';

export type Profile = {
  userId: string;
  provider: AuthProvider;
  nickname?: string;
  leagueIds: string[];
  /** Genau eine Lieblingsliga (Stern) – user_leagues.is_favorite, max. 1 */
  favoriteLeagueId?: string;
  joinedAt: string;
  reminders: boolean;
};

export type NicknameCheck = 'available' | 'taken' | 'reserved' | 'invalid';

/** Anmeldung – nur Apple und Google. */
export interface AuthService {
  getProfile(): Promise<Profile | null>;
  signIn(provider: AuthProvider): Promise<Profile>;
  signOut(): Promise<void>;
}

/** Profil-Daten des eingeloggten Users. */
export interface ProfileService {
  /** Serverseitige Prüfung (Format, Sperrliste, Eindeutigkeit case-insensitive) */
  checkNickname(nickname: string): Promise<NicknameCheck>;
  setNickname(nickname: string): Promise<Profile>;
  /** Mind. 1 Liga prüft der Client. */
  setLeagues(leagueIds: string[], favoriteLeagueId: string | undefined): Promise<Profile>;
  setReminders(on: boolean): Promise<Profile>;
}
