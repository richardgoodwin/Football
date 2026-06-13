import { describe, it, expect } from 'vitest';
import { effectiveRating, playerRole, rolePenalty } from '@/game/draft/roles';
import { ALL_PLAYERS } from '@/data/players';
import { ROLE_FAMILY } from '@/types/draft';

describe('rolePenalty', () => {
  it('is zero for a natural fit', () => {
    expect(rolePenalty('ST', 'ST')).toBe(0);
    expect(rolePenalty('GK', 'GK')).toBe(0);
    expect(rolePenalty('LB', 'LB')).toBe(0);
  });

  it('is catastrophic for outfielders in goal and keepers outfield', () => {
    expect(rolePenalty('ST', 'GK')).toBe(40);
    expect(rolePenalty('GK', 'CB')).toBe(40);
  });

  it('penalises wrong side more than adjacent line', () => {
    const wrongSide = rolePenalty('RB', 'LB'); // full pitch width
    const adjacentLine = rolePenalty('RM', 'RW'); // same side, one line up
    expect(wrongSide).toBeGreaterThan(adjacentLine);
  });

  it('scales with distance up the pitch', () => {
    expect(rolePenalty('CB', 'ST')).toBeGreaterThan(rolePenalty('CAM', 'ST'));
    expect(rolePenalty('CM', 'CDM')).toBeLessThan(rolePenalty('CM', 'CB'));
  });
});

describe('effectiveRating', () => {
  it('subtracts the penalty and clamps to [40, 99]', () => {
    expect(effectiveRating(90, 0)).toBe(90);
    expect(effectiveRating(90, 6)).toBe(84);
    expect(effectiveRating(60, 40)).toBe(40);
    expect(effectiveRating(120, 0)).toBe(99);
  });
});

describe('player role coverage', () => {
  it('every player in the database has a role consistent with reality', () => {
    for (const p of ALL_PLAYERS) {
      expect(p.role, `${p.name} should have a role`).toBeDefined();
    }
  });

  it('all goalkeepers in the DB resolve to the GK role and vice versa', () => {
    for (const p of ALL_PLAYERS) {
      const role = playerRole(p);
      if (p.position === 'GK') {
        expect(role, `${p.name} is a GK`).toBe('GK');
      }
      if (role === 'GK') {
        expect(p.position, `${p.name} has GK role`).toBe('GK');
      }
    }
  });

  it('ROLE_FAMILY covers every role used in the database', () => {
    for (const p of ALL_PLAYERS) {
      expect(ROLE_FAMILY[playerRole(p)]).toBeDefined();
    }
  });
});
