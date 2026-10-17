import { Platform } from 'react-native';
import { mockDemoProfile } from '@/auth/mockAuth';
import { setSession } from '@/auth/session';
import { backendKind } from '@/data';
import { mockTipWholeRound } from '@/data/mock/mockRepository';
import type { Sport } from '@/data/types';

/**
 * Nur Mock-Backend + Web: URL-Parameter für reproduzierbare Screenshots.
 *   ?demo=1          fertig eingerichteter User (markus_b, BL/AT/CH + NL, Favorit BL)
 *   ?sport=hockey    Start-Sportart
 *   ?alltipped=1     Spieltag der Lieblingsligen komplett getippt
 *   ?leagues=bl,abl  eigene Liga-Auswahl
 */
export function readDemoParams(): { sport?: Sport; applied: boolean } {
  if (backendKind !== 'mock' || Platform.OS !== 'web' || typeof window === 'undefined') return { applied: false };
  const q = new URLSearchParams(window.location.search);
  const sport = q.get('sport') === 'hockey' ? 'hockey' : q.get('sport') === 'football' ? 'football' : undefined;
  if (q.get('demo') !== '1') return { sport, applied: false };
  const leagues = q.get('leagues')?.split(',').filter(Boolean);
  const p = mockDemoProfile(leagues ? { leagueIds: leagues } : {});
  if (q.get('alltipped') === '1') ['bl', 'nl'].forEach((l) => p.leagueIds.includes(l) && mockTipWholeRound(l));
  setSession(p);
  return { sport, applied: true };
}
