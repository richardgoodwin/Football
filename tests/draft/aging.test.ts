import { describe, it, expect } from 'vitest';
import {
  agedPicks,
  agedRating,
  seasonStartYear,
  snapshotAge,
  yearlyDelta,
} from '@/game/draft/aging';
import type { DraftPick, Player } from '@/types/draft';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'test',
    name: 'Test Player',
    club: 'Test FC',
    season: '2003-04',
    position: 'MID',
    rating: 85,
    ...overrides,
  };
}

describe('seasonStartYear', () => {
  it('parses the first year of a season string', () => {
    expect(seasonStartYear('2003-04')).toBe(2003);
    expect(seasonStartYear('1994-95')).toBe(1994);
  });
});

describe('snapshotAge', () => {
  it('derives age from the birth-year map', () => {
    // Thierry Henry, born 1977 → age 26 in 2003-04
    expect(snapshotAge(player({ name: 'Thierry Henry', season: '2003-04' }))).toBe(26);
    // Ryan Giggs, born 1973 → age 20 in 1993-94, 25 in 1998-99
    expect(snapshotAge(player({ name: 'Ryan Giggs', season: '1993-94' }))).toBe(20);
    expect(snapshotAge(player({ name: 'Ryan Giggs', season: '1998-99' }))).toBe(25);
  });

  it('falls back to 26 for unknown players', () => {
    expect(snapshotAge(player({ name: 'Unknown Bloke' }))).toBe(26);
  });
});

describe('yearlyDelta', () => {
  it('improves young players and declines old ones', () => {
    expect(yearlyDelta(20, 'MID')).toBeGreaterThan(0);
    expect(yearlyDelta(26, 'MID')).toBeGreaterThan(0);
    expect(yearlyDelta(29, 'MID')).toBe(0);
    expect(yearlyDelta(32, 'MID')).toBeLessThan(0);
    expect(yearlyDelta(37, 'MID')).toBeLessThan(yearlyDelta(32, 'MID'));
  });

  it('goalkeepers decline later than outfielders', () => {
    // At 32 an outfielder declines; a GK (curve shifted +3) is still flat.
    expect(yearlyDelta(32, 'FWD')).toBeLessThan(0);
    expect(yearlyDelta(32, 'GK')).toBe(0);
  });
});

describe('agedRating', () => {
  it('returns the base rating when no years have elapsed', () => {
    expect(agedRating(90, 26, 0, 'MID')).toBe(90);
  });

  it('boosts a young player over a few seasons', () => {
    expect(agedRating(80, 20, 3, 'FWD')).toBeGreaterThan(80);
  });

  it('declines a veteran over a few seasons', () => {
    expect(agedRating(95, 32, 3, 'FWD')).toBeLessThan(95);
  });

  it('clamps to the 50-99 range', () => {
    expect(agedRating(97, 22, 10, 'MID')).toBeLessThanOrEqual(99);
    expect(agedRating(60, 34, 15, 'FWD')).toBeGreaterThanOrEqual(50);
  });
});

describe('agedPicks', () => {
  const squad: DraftPick[] = [
    {
      player: player({ id: 'young', name: 'Phil Foden', season: '2022-23', rating: 88, position: 'MID' }),
      wheelLanding: { club: 'Test FC', season: '2022-23' },
    },
    {
      player: player({ id: 'old', name: 'Teddy Sheringham', season: '2000-01', rating: 89, position: 'FWD' }),
      wheelLanding: { club: 'Test FC', season: '2000-01' },
    },
  ];

  it('with zero years elapsed, ratings are unchanged and ages attach', () => {
    const aged = agedPicks(squad, 0);
    expect(aged[0].player.rating).toBe(88);
    expect(aged[0].player.age).toBe(22); // Foden born 2000, season 2022-23
    expect(aged[1].player.age).toBe(34); // Sheringham born 1966, season 2000-01
  });

  it('after three seasons, the youngster improves and the veteran declines', () => {
    const aged = agedPicks(squad, 3);
    expect(aged[0].player.rating).toBeGreaterThan(88);
    expect(aged[0].player.age).toBe(25);
    expect(aged[1].player.rating).toBeLessThan(89);
    expect(aged[1].player.age).toBe(37);
  });

  it('does not mutate the original picks', () => {
    agedPicks(squad, 5);
    expect(squad[0].player.rating).toBe(88);
    expect(squad[0].player.age).toBeUndefined();
  });
});
