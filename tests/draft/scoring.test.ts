import { describe, it, expect } from 'vitest';
import {
  pointsToPosition,
  squadAttack,
  squadDefense,
  squadStrength,
} from '@/game/draft/scoring';
import type { DraftPick, Player } from '@/types/draft';

function pick(rating: number, position: Player['position']): DraftPick {
  const player: Player = {
    id: `${position}-${rating}`,
    name: 'Test',
    club: 'Test FC',
    season: '2020-21',
    position,
    rating,
  };
  return { player, wheelLanding: { club: 'Test FC', season: '2020-21' } };
}

const squad99: DraftPick[] = [
  pick(99, 'GK'),
  pick(99, 'DEF'), pick(99, 'DEF'), pick(99, 'DEF'), pick(99, 'DEF'),
  pick(99, 'MID'), pick(99, 'MID'), pick(99, 'MID'), pick(99, 'MID'),
  pick(99, 'FWD'), pick(99, 'FWD'),
];

const squad60: DraftPick[] = [
  pick(60, 'GK'),
  pick(60, 'DEF'), pick(60, 'DEF'), pick(60, 'DEF'), pick(60, 'DEF'),
  pick(60, 'MID'), pick(60, 'MID'), pick(60, 'MID'), pick(60, 'MID'),
  pick(60, 'FWD'), pick(60, 'FWD'),
];

describe('squadStrength', () => {
  it('returns the average rating for a uniform squad', () => {
    expect(squadStrength(squad99)).toBe(99);
    expect(squadStrength(squad60)).toBe(60);
  });

  it('returns 0 for an empty squad', () => {
    expect(squadStrength([])).toBe(0);
  });
});

describe('squadAttack / squadDefense', () => {
  it('attack scales with FWD/MID ratings', () => {
    const mixed: DraftPick[] = [
      pick(70, 'GK'),
      pick(70, 'DEF'),
      pick(70, 'MID'),
      pick(99, 'FWD'),
    ];
    expect(squadAttack(mixed)).toBeGreaterThan(70);
  });

  it('defense scales with GK/DEF ratings', () => {
    const mixed: DraftPick[] = [
      pick(99, 'GK'),
      pick(99, 'DEF'),
      pick(70, 'MID'),
      pick(70, 'FWD'),
    ];
    expect(squadDefense(mixed)).toBeGreaterThan(80);
  });
});

describe('pointsToPosition', () => {
  it('maps high points to top spots', () => {
    expect(pointsToPosition(100)).toBe(1);
    expect(pointsToPosition(95)).toBe(1);
    expect(pointsToPosition(88)).toBe(2);
  });
  it('maps mid points to mid-table', () => {
    expect(pointsToPosition(55)).toBe(9);
    expect(pointsToPosition(45)).toBe(12);
  });
  it('maps low points to relegation zone', () => {
    expect(pointsToPosition(20)).toBe(19);
  });
});
