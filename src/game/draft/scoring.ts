import type { DraftPick, Player, Position } from '@/types/draft';

/** Position weights for overall squad strength. Balanced across the pitch. */
const POSITION_WEIGHTS: Record<Position, number> = {
  GK: 1.0,
  DEF: 1.0,
  MID: 1.0,
  FWD: 1.0,
};

/**
 * Compute a 0-100ish overall squad strength as the weighted average of player
 * ratings. Returns 0 if no players supplied.
 */
export function squadStrength(picks: DraftPick[]): number {
  if (picks.length === 0) return 0;
  let total = 0;
  let weight = 0;
  for (const { player } of picks) {
    const w = POSITION_WEIGHTS[player.position];
    total += player.rating * w;
    weight += w;
  }
  return total / weight;
}

/** Attack strength = average of FWD ratings (with MID half-weight). */
export function squadAttack(picks: DraftPick[]): number {
  return slice(picks, ['FWD', 'MID'], { FWD: 1, MID: 0.5 });
}

/** Defence strength = average of DEF + GK (with MID half-weight). */
export function squadDefense(picks: DraftPick[]): number {
  return slice(picks, ['GK', 'DEF', 'MID'], { GK: 1.2, DEF: 1, MID: 0.4 });
}

function slice(
  picks: DraftPick[],
  positions: Position[],
  weights: Partial<Record<Position, number>>,
): number {
  const set = new Set(positions);
  const relevant = picks.filter((p) => set.has(p.player.position));
  if (relevant.length === 0) return 0;
  let total = 0;
  let weight = 0;
  for (const { player } of relevant) {
    const w = weights[player.position] ?? 1;
    total += player.rating * w;
    weight += w;
  }
  return total / Math.max(0.0001, weight);
}

/** Crude mapping from final points to estimated league position. */
export function pointsToPosition(points: number): number {
  if (points >= 95) return 1;
  if (points >= 88) return 2;
  if (points >= 80) return 3;
  if (points >= 72) return 4;
  if (points >= 64) return 6;
  if (points >= 55) return 9;
  if (points >= 45) return 12;
  if (points >= 38) return 15;
  if (points >= 30) return 17;
  return 19;
}

/** Convenience helper used by tests + UI. */
export function averageRating(players: Player[]): number {
  if (players.length === 0) return 0;
  return players.reduce((s, p) => s + p.rating, 0) / players.length;
}
