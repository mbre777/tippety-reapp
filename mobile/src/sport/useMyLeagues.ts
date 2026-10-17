import { useMemo } from 'react';
import { useSession } from '@/auth/session';
import { allLeagues, type League, type Sport } from '@/data';

/** Nur die vom User gewählten Ligen. Nicht gewählte Ligen erscheinen nirgends. */
export function useMyLeagues(sport?: Sport) {
  const { profile } = useSession();
  return useMemo(() => {
    const ids = profile?.leagueIds ?? [];
    const mine = allLeagues.filter((l) => ids.includes(l.id));
    const ofSport = sport ? mine.filter((l) => l.sport === sport) : mine;
    const fav = (s: Sport): League | undefined => {
      // Lieblingsliga, falls von dieser Sportart – sonst erste gewählte Liga der Sportart
      const f = profile?.favoriteLeagueId;
      return mine.find((l) => l.id === f && l.sport === s) ?? mine.find((l) => l.sport === s);
    };
    return {
      all: mine,
      leagues: ofSport,
      ids: ofSport.map((l) => l.id),
      favorite: sport ? fav(sport) : undefined,
      hasFootball: mine.some((l) => l.sport === 'football'),
      hasHockey: mine.some((l) => l.sport === 'hockey'),
    };
  }, [profile, sport]);
}
