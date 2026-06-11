import type { Formation, FormationId, Position } from '@/types/draft';

export const FORMATIONS: Record<FormationId, Formation> = {
  '4-4-2': {
    id: '4-4-2',
    label: '4-4-2',
    slots: { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  },
  '4-3-3': {
    id: '4-3-3',
    label: '4-3-3',
    slots: { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  },
  '3-5-2': {
    id: '3-5-2',
    label: '3-5-2',
    slots: { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  },
  '4-2-3-1': {
    id: '4-2-3-1',
    label: '4-2-3-1',
    slots: { GK: 1, DEF: 4, MID: 5, FWD: 1 },
  },
};

export const FORMATION_LIST: Formation[] = Object.values(FORMATIONS);

/** Maximum picks allowed from any single club, to encourage variety. */
export const MAX_PICKS_PER_CLUB = 3;

/** Slots remaining per position given the formation and current picks. */
export function remainingSlots(
  formation: Formation,
  currentPositionCounts: Record<Position, number>,
): Record<Position, number> {
  return {
    GK: Math.max(0, formation.slots.GK - (currentPositionCounts.GK ?? 0)),
    DEF: Math.max(0, formation.slots.DEF - (currentPositionCounts.DEF ?? 0)),
    MID: Math.max(0, formation.slots.MID - (currentPositionCounts.MID ?? 0)),
    FWD: Math.max(0, formation.slots.FWD - (currentPositionCounts.FWD ?? 0)),
  };
}

/** Positions that still need at least one more pick. */
export function openPositions(remaining: Record<Position, number>): Position[] {
  return (Object.keys(remaining) as Position[]).filter((p) => remaining[p] > 0);
}
