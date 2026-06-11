import { describe, it, expect } from 'vitest';
import {
  applyPick,
  createDraft,
  eligiblePlayers,
  isComplete,
  openPositionsFor,
  positionCounts,
  remaining,
} from '@/game/draft/draftState';
import { FORMATIONS } from '@/game/draft/constraints';
import type { Player } from '@/types/draft';

function p(id: string, pos: Player['position'], club = 'Test FC', season = '2020-21'): Player {
  return { id, name: id, club, season, position: pos, rating: 80 };
}

describe('draftState', () => {
  it('initialises with empty picks and full slots remaining', () => {
    const s = createDraft(FORMATIONS['4-4-2']);
    expect(s.picks).toHaveLength(0);
    expect(remaining(s)).toEqual({ GK: 1, DEF: 4, MID: 4, FWD: 2 });
    expect(openPositionsFor(s).sort()).toEqual(['DEF', 'FWD', 'GK', 'MID']);
    expect(isComplete(s)).toBe(false);
  });

  it('applyPick advances counts and locks the player', () => {
    let s = createDraft(FORMATIONS['4-3-3']);
    const player = p('alice-gk', 'GK');
    s = applyPick(s, player, { club: player.club, season: player.season });
    expect(s.picks).toHaveLength(1);
    expect(positionCounts(s).GK).toBe(1);
    expect(s.pickedPlayerIds.has('alice-gk')).toBe(true);
    expect(s.picksByClub['Test FC']).toBe(1);
  });

  it('eligiblePlayers filters by landing, open positions, and already-picked', () => {
    const pool: Player[] = [
      p('a', 'GK', 'Arsenal', '2003-04'),
      p('b', 'FWD', 'Arsenal', '2003-04'),
      p('c', 'FWD', 'Other', '2003-04'),
    ];
    let s = createDraft(FORMATIONS['4-4-2']);
    let elig = eligiblePlayers(s, { club: 'Arsenal', season: '2003-04' }, pool);
    expect(elig.map((x) => x.id).sort()).toEqual(['a', 'b']);

    s = applyPick(s, pool[0], { club: 'Arsenal', season: '2003-04' });
    elig = eligiblePlayers(s, { club: 'Arsenal', season: '2003-04' }, pool);
    expect(elig.map((x) => x.id)).toEqual(['b']);
  });

  it('enforces max-3 picks per club', () => {
    const pool: Player[] = [
      p('g', 'GK', 'Test FC'),
      p('d1', 'DEF', 'Test FC'),
      p('d2', 'DEF', 'Test FC'),
      p('d3', 'DEF', 'Test FC'),
    ];
    let s = createDraft(FORMATIONS['4-4-2']);
    for (const player of pool.slice(0, 3)) {
      s = applyPick(s, player, { club: player.club, season: player.season });
    }
    const elig = eligiblePlayers(s, { club: 'Test FC', season: '2020-21' }, pool);
    expect(elig).toEqual([]);
  });

  it('marks complete at 11 picks', () => {
    let s = createDraft(FORMATIONS['4-4-2']);
    for (let i = 0; i < 11; i++) {
      const player = p(`p${i}`, 'MID', `Club ${i}`);
      s = applyPick(s, player, { club: player.club, season: player.season });
    }
    expect(isComplete(s)).toBe(true);
  });
});
