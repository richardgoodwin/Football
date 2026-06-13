import type { DraftPick, Player, Position } from '@/types/draft';
import { ROLE_FAMILY } from '@/types/draft';
import { pickEffectiveRating } from './roles';

/** The position family a pick plays in: its assigned slot, else the player's natural family. */
function pickFamily(pick: DraftPick): Position {
  return pick.assignedRole ? ROLE_FAMILY[pick.assignedRole] : pick.player.position;
}

/**
 * Compute overall squad strength as the average of EFFECTIVE ratings —
 * role-fit penalties drag a squad down. Returns 0 if no players supplied.
 */
export function squadStrength(picks: DraftPick[]): number {
  if (picks.length === 0) return 0;
  let total = 0;
  for (const pick of picks) {
    total += pickEffectiveRating(pick);
  }
  return total / picks.length;
}

/** Attack strength = effective ratings of FWDs (with MIDs half-weight). */
export function squadAttack(picks: DraftPick[]): number {
  return slice(picks, { FWD: 1, MID: 0.5 });
}

/** Defence strength = effective ratings of GK + DEFs (with MIDs partial weight). */
export function squadDefense(picks: DraftPick[]): number {
  return slice(picks, { GK: 1.2, DEF: 1, MID: 0.4 });
}

function slice(picks: DraftPick[], weights: Partial<Record<Position, number>>): number {
  let total = 0;
  let weight = 0;
  for (const pick of picks) {
    const w = weights[pickFamily(pick)];
    if (w === undefined) continue;
    total += pickEffectiveRating(pick) * w;
    weight += w;
  }
  if (weight === 0) return 0;
  return total / weight;
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
