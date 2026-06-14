import { describe, it, expect } from 'vitest';
import { buildSeasonTable } from '@/game/draft/seasonTable';
import type { SeasonResult } from '@/types/draft';

function makeResult(overrides: Partial<SeasonResult>): SeasonResult {
  return {
    squad: [],
    formationId: '4-3-3',
    played: 38,
    wins: 20,
    draws: 10,
    losses: 8,
    goalsFor: 70,
    goalsAgainst: 40,
    points: 70,
    position: 4,
    matches: [],
    perfect: false,
    squadStrength: 82,
    ...overrides,
  };
}

describe('buildSeasonTable', () => {
  it('produces a full 20-team table', () => {
    const table = buildSeasonTable(makeResult({}));
    expect(table).toHaveLength(20);
    expect(table.map((r) => r.position)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  it('places the user at the reported finishing position with their real record', () => {
    const result = makeResult({ position: 4, points: 70, wins: 21, draws: 7, losses: 10 });
    const table = buildSeasonTable(result);
    const user = table.find((r) => r.isUser)!;
    expect(user.position).toBe(4);
    expect(user.points).toBe(70);
    expect(user.won).toBe(21);
    expect(user.drawn).toBe(7);
    expect(user.lost).toBe(10);
  });

  it('has exactly one user row and is sorted by points then goal difference', () => {
    const table = buildSeasonTable(makeResult({ position: 9, points: 55 }));
    expect(table.filter((r) => r.isUser)).toHaveLength(1);
    for (let i = 1; i < table.length; i++) {
      const prev = table[i - 1];
      const cur = table[i];
      expect(prev.points > cur.points || (prev.points === cur.points && prev.gd >= cur.gd)).toBe(
        true,
      );
    }
  });

  it('every generated row keeps points = won*3 + drawn over 38 games', () => {
    const table = buildSeasonTable(
      makeResult({ position: 12, points: 47, wins: 13, draws: 8, losses: 17 }),
    );
    for (const row of table) {
      expect(row.won + row.drawn + row.lost).toBe(38);
      expect(row.won * 3 + row.drawn).toBe(row.points);
    }
  });

  it('handles champions (position 1) and relegation (position 19)', () => {
    const champ = buildSeasonTable(makeResult({ position: 1, points: 96 }));
    expect(champ.find((r) => r.isUser)!.position).toBe(1);
    const releg = buildSeasonTable(makeResult({ position: 19, points: 28 }));
    expect(releg.find((r) => r.isUser)!.position).toBe(19);
  });
});
