import { describe, it, expect } from 'vitest';
import { buildWheelSequence, spinWheel } from '@/game/draft/wheel';
import { ALL_PLAYERS, uniqueClubSeasons } from '@/data/players';
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
