import type { Player } from '@/types/draft';
import { uniqueClubSeasons, WHEEL_MIN_PLAYERS } from '@/data/players';

export interface WheelLanding {
  club: string;
  season: string;
}

/**
 * Spin the wheel and return a single (club, season) landing. Only club-seasons
 * with `minPlayers` or more entries in the pool can be landed on, so every
 * spin offers a meaningful draft choice.
 *
 * Uses the supplied RNG so callers can seed reproducibly (multiplayer mode).
 */
export function spinWheel(
  rng: () => number,
  pool: Player[],
  minPlayers: number = WHEEL_MIN_PLAYERS,
): WheelLanding {
  const slots = uniqueClubSeasons(pool, minPlayers);
  if (slots.length === 0) {
    throw new Error('Wheel has no slots — player pool is empty or too thin.');
  }
  const idx = Math.floor(rng() * slots.length);
  return slots[Math.min(idx, slots.length - 1)];
}

/**
 * Build a deterministic sequence of N wheel landings from a seeded RNG.
 * Used by multiplayer to ensure both players see the same wheel.
 */
export function buildWheelSequence(
  rng: () => number,
  pool: Player[],
  count: number,
  minPlayers: number = WHEEL_MIN_PLAYERS,
): WheelLanding[] {
  const out: WheelLanding[] = [];
  for (let i = 0; i < count; i++) {
    out.push(spinWheel(rng, pool, minPlayers));
  }
  return out;
}
