import { useSyncExternalStore } from 'react';

/** Zähler, der bei jeder Tipp-Änderung steigt – damit Ansichten live neu laden. */
let version = 0;
const listeners = new Set<() => void>();
export function notifyTipsChanged() {
  version += 1;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useTipsVersion = () => useSyncExternalStore(subscribe, () => version, () => version);
