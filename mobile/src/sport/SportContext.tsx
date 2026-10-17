import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Sport } from '@/data/types';

type SportCtx = { sport: Sport; setSport: (s: Sport) => void; toggleSport: () => void };
const Ctx = createContext<SportCtx | null>(null);

export function SportProvider({ children, initial = 'football' }: { children: ReactNode; initial?: Sport }) {
  const [sport, setSport] = useState<Sport>(initial);
  const toggleSport = useCallback(() => setSport((s) => (s === 'football' ? 'hockey' : 'football')), []);
  const value = useMemo(() => ({ sport, setSport, toggleSport }), [sport, toggleSport]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSport(): SportCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSport must be used inside SportProvider');
  return v;
}
