import { describe, it, expect } from 'vitest';
import { predictSeason, simulateSeason } from '@/game/draft/simulation';
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

describe('predictSeason', () => {
  it('is deterministic and returns a valid position', () => {
    const a = predictSeason(uniformSquad(88), 'normal');
    const b = predictSeason(uniformSquad(88), 'normal');
    expect(a).toEqual(b);
    expect(a.position).toBeGreaterThanOrEqual(1);
    expect(a.position).toBeLessThanOrEqual(20);
  });

  it('predicts a better finish for stronger squads', () => {
    const elite = predictSeason(uniformSquad(97), 'normal');
    const weak = predictSeason(uniformSquad(68), 'normal');
    expect(elite.position).toBeLessThan(weak.position);
    expect(elite.points).toBeGreaterThan(weak.points);
  });

  it('harder difficulty predicts a worse finish for the same squad', () => {
    const easy = predictSeason(uniformSquad(82), 'easy');
    const legendary = predictSeason(uniformSquad(82), 'legendary');
    expect(easy.points).toBeGreaterThan(legendary.points);
  });

  it('roughly tracks the median simulated finish', () => {
    const squad = uniformSquad(90);
    const prediction = predictSeason(squad, 'normal');
    let totalPoints = 0;
    const RUNS = 40;
    for (let i = 0; i < RUNS; i++) {
      totalPoints += simulateSeason(squad, FORMATIONS['4-3-3'], mulberry32(7000 + i), 'normal').points;
    }
    const avgPoints = totalPoints / RUNS;
    // Prediction should be within ~12 points of the simulated average.
    expect(Math.abs(prediction.points - avgPoints)).toBeLessThan(12);
  });
});
