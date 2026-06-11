import { describe, it, expect } from 'vitest';
import { simulateSeason } from '@/game/draft/simulation';
import { FORMATIONS } from '@/game/draft/constraints';
import { mulberry32 } from '@/utils/rng';
import type { DraftPick, Player } from '@/types/draft';

function pick(rating: number, position: Player['position'], i = 0): DraftPick {
  const player: Player = {
    id: `${position}-${rating}-${i}`,
    name: 'Test',
    club: `Club ${i}`,
    season: '2020-21',
    position,
    rating,
  };
  return { player, wheelLanding: { club: player.club, season: player.season } };
}

function uniformSquad(rating: number): DraftPick[] {
  return [
    pick(rating, 'GK', 0),
    pick(rating, 'DEF', 1), pick(rating, 'DEF', 2), pick(rating, 'DEF', 3), pick(rating, 'DEF', 4),
    pick(rating, 'MID', 5), pick(rating, 'MID', 6), pick(rating, 'MID', 7), pick(rating, 'MID', 8),
    pick(rating, 'FWD', 9), pick(rating, 'FWD', 10),
  ];
}

describe('simulateSeason', () => {
  it('produces a 38-match season with a sensible points total', () => {
    const result = simulateSeason(uniformSquad(85), FORMATIONS['4-4-2'], mulberry32(1));
    expect(result.played).toBe(38);
    expect(result.wins + result.draws + result.losses).toBe(38);
    expect(result.points).toBe(result.wins * 3 + result.draws);
    expect(result.matches).toHaveLength(38);
  });

  it('is deterministic with the same seed', () => {
    const a = simulateSeason(uniformSquad(85), FORMATIONS['4-4-2'], mulberry32(99));
    const b = simulateSeason(uniformSquad(85), FORMATIONS['4-4-2'], mulberry32(99));
    expect(a.points).toBe(b.points);
    expect(a.goalsFor).toBe(b.goalsFor);
    expect(a.goalsAgainst).toBe(b.goalsAgainst);
  });

  it('top-tier squad performs MUCH better than a mid-tier squad on average', () => {
    let elitePoints = 0;
    let weakPoints = 0;
    const RUNS = 50;
    for (let i = 0; i < RUNS; i++) {
      elitePoints += simulateSeason(uniformSquad(96), FORMATIONS['4-3-3'], mulberry32(1000 + i)).points;
      weakPoints += simulateSeason(uniformSquad(68), FORMATIONS['4-3-3'], mulberry32(2000 + i)).points;
    }
    const eliteAvg = elitePoints / RUNS;
    const weakAvg = weakPoints / RUNS;
    expect(eliteAvg).toBeGreaterThan(weakAvg + 30);
    expect(eliteAvg).toBeGreaterThan(80);
    expect(weakAvg).toBeLessThan(60);
  });

  it('a 99-rated squad has a non-zero chance of going 38-0; a 70-rated squad effectively none', () => {
    let elitePerfects = 0;
    let weakPerfects = 0;
    const RUNS = 200;
    for (let i = 0; i < RUNS; i++) {
      if (simulateSeason(uniformSquad(99), FORMATIONS['4-3-3'], mulberry32(3000 + i)).perfect) elitePerfects++;
      if (simulateSeason(uniformSquad(70), FORMATIONS['4-3-3'], mulberry32(4000 + i)).perfect) weakPerfects++;
    }
    // Calibration: 99-rated squad sees a perfect season at least sometimes; 70-rated should never.
    expect(elitePerfects).toBeGreaterThan(0);
    expect(weakPerfects).toBe(0);
  });
});
