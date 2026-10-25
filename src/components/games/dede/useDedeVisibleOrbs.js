import { useMemo } from 'react';
import { orbValueOf } from '@/components/games/dede/dedeConfig';

// Visual strike cues include non-paying multipliers, without changing payouts.
export default function useDedeVisibleOrbs(grid, rolling) {
  return useMemo(() => {
    if (rolling || !grid) return [];
    return grid.flatMap((column, reel) => column.flatMap((symbol, row) => {
      const value = orbValueOf(symbol);
      return value ? [{ reel, row, value }] : [];
    }));
  }, [grid, rolling]);
}