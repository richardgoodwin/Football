import { describe, it, expect } from 'vitest';
import {
  applyPick,
  buildPick,
  createDraft,
  eligiblePlayers,
  isComplete,
  openSlots,
  remaining,
} from '@/game/draft/draftState';
import { FORMATIONS } from '@/game/draft/constraints';
import type { Player, Role } from '@/types/draft';

function p(id: string, role: Role, club = 'Test FC', season = '2020-21'): Player {
  const familyMap = { GK: 'GK', RB: 'DEF', CB: 'DEF', LB: 'DEF' } as const;
  const position =
    role in familyMap
      ? familyMap[role as keyof typeof familyMap]
      : role === 'ST' || role === 'RW' || role === 'LW'
        ? 'FWD'
        : 'MID';
  return { id, name: id, club, season, position, role, rating: 80 };
}

describe('draftState (role slots)', () => {
  it('initialises with all 11 slots open', () => {
    const s = createDraft(FORMATIONS['4-4-2']);
    expect(s.picks).toHaveLength(0);
    expect(openSlots(s)).toHaveLength(11);
    expect(remaining(s)).toEqual({ GK: 1, DEF: 4, MID: 4, FWD: 2 });
    expect(isComplete(s)).toBe(false);
  });

  it('buildPick assigns slot role and computes the penalty', () => {
    const f = FORMATIONS['4-4-2'];
    const player = p('rm-guy', 'RM');
    // slot 5 in 4-4-2 is RM → natural fit, no penalty
    const natural = buildPick(f, player, { club: player.club, season: player.season }, 5);
    expect(natural.assignedRole).toBe('RM');
    expect(natural.rolePenalty).toBe(0);
    // slot 8 is LM → wrong side
    const offSide = buildPick(f, player, { club: player.club, season: player.season }, 8);
    expect(offSide.assignedRole).toBe('LM');
    expect(offSide.rolePenalty).toBeGreaterThan(0);
  });

  it('applyPick fills the slot and locks the player', () => {
    const f = FORMATIONS['4-3-3'];
    let s = createDraft(f);
    const gk = p('keeper', 'GK');
    s = applyPick(s, buildPick(f, gk, { club: gk.club, season: gk.season }, 0));
    expect(s.picks).toHaveLength(1);
    expect(openSlots(s)).toHaveLength(10);
    expect(openSlots(s)).not.toContain(0);
    expect(s.pickedPlayerIds.has('keeper')).toBe(true);
    expect(s.picksByClub['Test FC']).toBe(1);
  });

  it('eligiblePlayers includes everyone from the landing (role system allows any slot)', () => {
    const pool: Player[] = [
      p('a', 'GK', 'Arsenal', '2003-04'),
      p('b', 'ST', 'Arsenal', '2003-04'),
      p('c', 'ST', 'Other', '2003-04'),
    ];
    let s = createDraft(FORMATIONS['4-4-2']);
    let elig = eligiblePlayers(s, { club: 'Arsenal', season: '2003-04' }, pool);
    expect(elig.map((x) => x.id).sort()).toEqual(['a', 'b']);

    s = applyPick(s, buildPick(s.formation, pool[0], { club: 'Arsenal', season: '2003-04' }, 0));
    elig = eligiblePlayers(s, { club: 'Arsenal', season: '2003-04' }, pool);
    expect(elig.map((x) => x.id)).toEqual(['b']);
  });

  it('enforces max-3 picks per club', () => {
    const pool: Player[] = [
      p('g', 'GK', 'Test FC'),
      p('d1', 'CB', 'Test FC'),
      p('d2', 'CB', 'Test FC'),
      p('d3', 'RB', 'Test FC'),
    ];
    const f = FORMATIONS['4-4-2'];
    let s = createDraft(f);
    s = applyPick(s, buildPick(f, pool[0], { club: 'Test FC', season: '2020-21' }, 0));
    s = applyPick(s, buildPick(f, pool[1], { club: 'Test FC', season: '2020-21' }, 2));
    s = applyPick(s, buildPick(f, pool[2], { club: 'Test FC', season: '2020-21' }, 3));
    const elig = eligiblePlayers(s, { club: 'Test FC', season: '2020-21' }, pool);
    expect(elig).toEqual([]);
  });

  it('marks complete at 11 picks', () => {
    const f = FORMATIONS['4-4-2'];
    let s = createDraft(f);
    for (let i = 0; i < 11; i++) {
      const player = p(`p${i}`, 'CM', `Club ${i}`);
      s = applyPick(s, buildPick(f, player, { club: player.club, season: player.season }, i));
    }
    expect(isComplete(s)).toBe(true);
    expect(openSlots(s)).toHaveLength(0);
  });
});
