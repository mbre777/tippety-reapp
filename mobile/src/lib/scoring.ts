import type { Score } from '@/data/types';

/** Punkte – identisch zu public.calc_points (SQL).
 *  5 = exaktes Ergebnis, 3 = richtige Tordifferenz (nicht bei Remis), 2 = richtige Tendenz, sonst 0.
 *  Eishockey: `result` ist der Stand nach 60 Minuten. */
export const POINTS = { exact: 5, diff: 3, tendency: 2 } as const;

export function calcPoints(tip: Score, result: Score): number {
  if (tip.home === result.home && tip.away === result.away) return POINTS.exact;
  const td = tip.home - tip.away;
  const rd = result.home - result.away;
  if (Math.sign(td) !== Math.sign(rd)) return 0;
  if (rd !== 0 && td === rd) return POINTS.diff;
  return POINTS.tendency;
}
