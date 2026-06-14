import type { Player } from '@/types/draft';
import { uniqueClubSeasons, WHEEL_MIN_PLAYERS } from '@/data/players';

export interface WheelLanding {
  club: string;
  season: string;
}

/**
 * Strength of a club-season = average rating of its best XI (top 11 players).
 * Cached because it's read on every spin and the player pool is static.
 */
const _strengthCache = new Map<string, number>();
export function clubSeasonStrength(landing: WheelLanding, pool: Player[]): number {
  const key = `${landing.club} :: ${landing.season}`;
  const cached = _strengthCache.get(key);
  if (cached !== undefined) return cached;
  const ratings = pool
    .filter((p) => p.club === landing.club && p.season === landing.season)
    .map((p) => p.rating)
    .sort((a, b) => b - a)
    .slice(0, 11);
  const strength = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
  _strengthCache.set(key, strength);
  return strength;
}

/**
 * Wheel weight for a club-season: mid-table squads are the baseline, stronger
 * squads land less often so a great team-and-year feels like a prize. Tuned to
 * be noticeably harder than uniform without being punishing — a ~90-rated side
 * lands roughly a third as often as an ~80-rated one.
 */
export function wheelWeight(strength: number): number {
  if (strength <= 78) return 1;
  return 1 / (1 + (strength - 78) * 0.18);
}

/**
 * Pick a landing from the given slots. Two adjustments make it feel varied:
 *  - elite squads are down-weighted (a great team/year is a rarer find);
 *  - each season's weight is divided by how many seasons its club has, so a
 *    club with four seasons in the pool doesn't appear four times as often —
 *    every distinct club gets a roughly equal share.
 */
export function weightedPick(
  rng: () => number,
  slots: WheelLanding[],
  pool: Player[],
): WheelLanding {
  if (slots.length === 0) throw new Error('Wheel has no slots.');
  const clubCounts = new Map<string, number>();
  for (const s of slots) clubCounts.set(s.club, (clubCounts.get(s.club) ?? 0) + 1);

  const weights = slots.map(
    (s) => wheelWeight(clubSeasonStrength(s, pool)) / (clubCounts.get(s.club) ?? 1),
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < slots.length; i++) {
    r -= weights[i];
    if (r <= 0) return slots[i];
  }
  return slots[slots.length - 1];
}

/**
 * Spin the wheel and return a single (club, season) landing. Only club-seasons
 * with `minPlayers` or more entries can be landed on, and stronger squads are
 * down-weighted so elite teams are a rarer, sweeter find.
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
  return weightedPick(rng, slots, pool);
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
