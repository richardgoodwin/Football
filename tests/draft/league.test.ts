import { describe, it, expect } from 'vitest';
import {
  generateAITeam,
  generateSchedule,
  scheduleKickoffs,
  simulateLeague,
  SEASON_MATCHDAYS,
  type LeagueTeam,
} from '@/game/draft/league';
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

describe('generateSchedule', () => {
  const ids = Array.from({ length: 38 }, (_, i) => `t${i}`);

  it('produces a full 38-matchday season', () => {
    const schedule = generateSchedule(ids, mulberry32(1));
    expect(schedule).toHaveLength(SEASON_MATCHDAYS);
  });

  it('every team plays exactly once per matchday', () => {
    const schedule = generateSchedule(ids, mulberry32(2));
    for (const md of schedule) {
      const seen = new Set<string>();
      for (const f of md.fixtures) {
        expect(seen.has(f.homeId)).toBe(false);
        expect(seen.has(f.awayId)).toBe(false);
        seen.add(f.homeId);
        seen.add(f.awayId);
      }
      expect(seen.size).toBe(ids.length); // all 38 teams featured
      expect(md.fixtures).toHaveLength(ids.length / 2);
    }
  });

  it('every team plays 38 games across the season', () => {
    const schedule = generateSchedule(ids, mulberry32(3));
    const counts = new Map<string, number>();
    for (const md of schedule) {
      for (const f of md.fixtures) {
        counts.set(f.homeId, (counts.get(f.homeId) ?? 0) + 1);
        counts.set(f.awayId, (counts.get(f.awayId) ?? 0) + 1);
      }
    }
    for (const id of ids) expect(counts.get(id)).toBe(SEASON_MATCHDAYS);
  });
});

describe('scheduleKickoffs', () => {
  it('returns 38 kickoffs, all on Wednesday or Saturday at 3pm', () => {
    const start = new Date('2026-06-15T09:00:00').getTime(); // a Monday
    const kickoffs = scheduleKickoffs(start);
    expect(kickoffs).toHaveLength(SEASON_MATCHDAYS);
    for (const k of kickoffs) {
      const d = new Date(k);
      expect([3, 6]).toContain(d.getDay()); // Wed or Sat
      expect(d.getHours()).toBe(15);
    }
    // strictly increasing
    for (let i = 1; i < kickoffs.length; i++) {
      expect(kickoffs[i]).toBeGreaterThan(kickoffs[i - 1]);
    }
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
