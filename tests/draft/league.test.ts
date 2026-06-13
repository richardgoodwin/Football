import { describe, it, expect } from 'vitest';
import { generateAITeam, simulateLeague, type LeagueTeam } from '@/game/draft/league';
import { ALL_PLAYERS } from '@/data/players';
import { mulberry32 } from '@/utils/rng';

function makeTeams(n: number, seed = 7): LeagueTeam[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => generateAITeam(rng, ALL_PLAYERS, `t${i}`, `Team ${i}`));
}

describe('generateAITeam', () => {
  it('builds a full XI with valid slot assignments', () => {
    const team = generateAITeam(mulberry32(1), ALL_PLAYERS, 'ai-0', 'Robo Rovers');
    expect(team.squad).toHaveLength(11);
    const slotIndices = new Set(team.squad.map((p) => p.slotIndex));
    expect(slotIndices.size).toBe(11);
    const playerIds = new Set(team.squad.map((p) => p.player.id));
    expect(playerIds.size).toBe(11);
    for (const pick of team.squad) {
      expect(pick.assignedRole).toBeDefined();
      expect(pick.rolePenalty).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateAITeam(mulberry32(42), ALL_PLAYERS, 'x', 'X');
    const b = generateAITeam(mulberry32(42), ALL_PLAYERS, 'x', 'X');
    expect(a.squad.map((p) => p.player.id)).toEqual(b.squad.map((p) => p.player.id));
  });
});

describe('simulateLeague', () => {
  it('plays a double round-robin: each team plays 2(N-1) games', () => {
    const teams = makeTeams(4);
    const { fixtures, table } = simulateLeague(teams, mulberry32(99));
    expect(fixtures).toHaveLength(4 * 3); // N*(N-1) fixtures
    for (const row of table) {
      expect(row.played).toBe(6); // 2*(N-1)
    }
  });

  it('points are consistent with results', () => {
    const teams = makeTeams(6);
    const { table } = simulateLeague(teams, mulberry32(123));
    for (const row of table) {
      expect(row.points).toBe(row.wins * 3 + row.draws);
      expect(row.wins + row.draws + row.losses).toBe(row.played);
    }
  });

  it('table is sorted by points then goal difference', () => {
    const teams = makeTeams(8);
    const { table } = simulateLeague(teams, mulberry32(5));
    for (let i = 1; i < table.length; i++) {
      const prev = table[i - 1];
      const cur = table[i];
      const prevGd = prev.goalsFor - prev.goalsAgainst;
      const curGd = cur.goalsFor - cur.goalsAgainst;
      expect(
        prev.points > cur.points || (prev.points === cur.points && prevGd >= curGd),
      ).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = simulateLeague(makeTeams(4, 11), mulberry32(77));
    const b = simulateLeague(makeTeams(4, 11), mulberry32(77));
    expect(a.table.map((t) => `${t.teamId}:${t.points}`)).toEqual(
      b.table.map((t) => `${t.teamId}:${t.points}`),
    );
  });
});

describe('difficulty', () => {
  it('easier difficulties yield more points on average', async () => {
    const { simulateSeason } = await import('@/game/draft/simulation');
    const { FORMATIONS } = await import('@/game/draft/constraints');
    const team = makeTeams(1, 3)[0];
    let easyPts = 0;
    let legendaryPts = 0;
    const RUNS = 30;
    for (let i = 0; i < RUNS; i++) {
      easyPts += simulateSeason(team.squad, FORMATIONS[team.formationId], mulberry32(9000 + i), 'easy').points;
      legendaryPts += simulateSeason(team.squad, FORMATIONS[team.formationId], mulberry32(9000 + i), 'legendary').points;
    }
    expect(easyPts / RUNS).toBeGreaterThan(legendaryPts / RUNS + 10);
  });
});
