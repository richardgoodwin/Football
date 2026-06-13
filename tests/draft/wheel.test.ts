import { describe, it, expect } from 'vitest';
import {
  buildWheelSequence,
  clubSeasonStrength,
  spinWheel,
  weightedPick,
  wheelWeight,
} from '@/game/draft/wheel';
import { ALL_PLAYERS, uniqueClubSeasons, WHEEL_MIN_PLAYERS } from '@/data/players';
import { mulberry32 } from '@/utils/rng';

describe('spinWheel', () => {
  it('returns a landing that exists in the pool', () => {
    const rng = mulberry32(42);
    const landing = spinWheel(rng, ALL_PLAYERS);
    const slots = uniqueClubSeasons();
    expect(slots.find((s) => s.club === landing.club && s.season === landing.season)).toBeDefined();
  });

  it('is deterministic with the same seed', () => {
    const a = spinWheel(mulberry32(7), ALL_PLAYERS);
    const b = spinWheel(mulberry32(7), ALL_PLAYERS);
    expect(a).toEqual(b);
  });
});

describe('buildWheelSequence', () => {
  it('produces the requested number of landings', () => {
    const seq = buildWheelSequence(mulberry32(1), ALL_PLAYERS, 11);
    expect(seq).toHaveLength(11);
  });

  it('is deterministic across runs with the same seed', () => {
    const a = buildWheelSequence(mulberry32(123), ALL_PLAYERS, 5);
    const b = buildWheelSequence(mulberry32(123), ALL_PLAYERS, 5);
    expect(a).toEqual(b);
  });
});

describe('wheel weighting', () => {
  it('wheelWeight is flat for mid squads and falls for elite squads', () => {
    expect(wheelWeight(78)).toBe(1);
    expect(wheelWeight(75)).toBe(1);
    const strong = wheelWeight(90);
    expect(strong).toBeLessThan(wheelWeight(82));
    expect(wheelWeight(82)).toBeLessThan(1);
    // Moderate, not punishing: elite still lands a meaningful fraction of the time.
    expect(strong).toBeGreaterThan(0.25);
  });

  it('over many spins, elite club-seasons land less often than mid ones', () => {
    const slots = uniqueClubSeasons(ALL_PLAYERS, WHEEL_MIN_PLAYERS);
    const strengths = slots.map((s) => ({ s, str: clubSeasonStrength(s, ALL_PLAYERS) }));
    const sorted = [...strengths].sort((a, b) => b.str - a.str);
    const elite = sorted[0].s;
    const mid = sorted[sorted.length - 1].s;

    const rng = mulberry32(99);
    let eliteHits = 0;
    let midHits = 0;
    const RUNS = 4000;
    for (let i = 0; i < RUNS; i++) {
      const pick = weightedPick(rng, slots, ALL_PLAYERS);
      if (pick.club === elite.club && pick.season === elite.season) eliteHits++;
      if (pick.club === mid.club && pick.season === mid.season) midHits++;
    }
    expect(midHits).toBeGreaterThan(eliteHits);
  });
});
