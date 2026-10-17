import { useCallback, useEffect, useRef, useState } from 'react';
import { mockRepository } from './mock/mockRepository';
import type { TippetyRepository } from './repository';
import { leagues } from './mock/teams';

export * from './types';
export { MOCK_TODAY } from './mock/fixtures';

/** Einziger Austauschpunkt: später z. B. `apiRepository` aus ./api */
export const repo: TippetyRepository = mockRepository;

export const leagueName = (id: string) => leagues.find((l) => l.id === id)?.name ?? id;

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
