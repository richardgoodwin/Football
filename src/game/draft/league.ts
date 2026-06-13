/**
 * Friends league engine: round-robin season between member squads, with
 * randomly-drafted AI teams filling unclaimed spots.
 */
import type { DraftPick, FormationId, Player } from '@/types/draft';
import { FORMATIONS, FORMATION_LIST } from './constraints';
import { playerRole, rolePenalty } from './roles';
import { simulateHeadToHead } from './simulation';
import { shuffle } from '@/utils/shuffle';

export interface LeagueTeam {
  id: string; // uid for humans, 'ai-N' for AI teams
  name: string;
  isAI: boolean;
  formationId: FormationId;
  squad: DraftPick[];
}

export interface LeagueFixture {
  round: number;
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
}

export interface LeagueStanding {
  teamId: string;
  name: string;
  isAI: boolean;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

/** A friends league always fields a full 38-team division (humans + AI fill). */
export const LEAGUE_SIZE = 38;
/** A 38-game season, two matchdays a week (Wed + Sat). */
export const SEASON_MATCHDAYS = 38;
export const KICKOFF_HOUR = 15; // 3pm

const AI_TEAM_NAMES = [
  'Robo Rovers', 'The Algorithms', 'Silicon City', 'Neural Nets',
  'Quantum Wanderers', 'Bot Albion', 'Circuit Town', 'Vector Villa',
  'Binary United', 'Cache County', 'Pixel Athletic', 'Logic Lions',
  'Cyber Swans', 'Data Dynamo', 'Server Rangers', 'Kernel Town',
  'Sprite City', 'Render Rovers', 'Async Albion', 'Cloud Wanderers',
  'Compiler FC', 'Latency Town', 'Buffer Rovers', 'Syntax City',
  'Runtime Rangers', 'Packet United', 'Schema Swifts', 'Token Town',
  'Closure FC', 'Daemon Athletic', 'Mainframe City', 'Proxy Rovers',
  'Bitwise Wanderers', 'Heap United', 'Stack Athletic', 'Thread Town',
  'Socket Rovers', 'Codec City',
];

export function aiTeamName(index: number): string {
  return AI_TEAM_NAMES[index % AI_TEAM_NAMES.length];
}

// ─── fixture scheduling ──────────────────────────────────────────────────────

export interface ScheduledFixture {
  homeId: string;
  awayId: string;
}

export interface ScheduleMatchday {
  matchday: number; // 1-based
  fixtures: ScheduledFixture[];
}

export interface RecordedFixture extends ScheduledFixture {
  homeGoals: number;
  awayGoals: number;
}

/**
 * Build a 38-matchday fixture list for an even set of teams using the circle
 * (round-robin) method. With N teams there are N-1 unique rounds; matchday 38
 * repeats round 1 with home/away reversed so every team plays exactly 38 games.
 */
export function generateSchedule(teamIds: string[], rng: () => number): ScheduleMatchday[] {
  const teams = shuffle(teamIds, rng);
  const n = teams.length; // even
  const half = n / 2;
  const fixed = teams[0];
  let rotating = teams.slice(1);

  const rounds: ScheduleMatchday[] = [];
  for (let r = 0; r < n - 1 && rounds.length < SEASON_MATCHDAYS; r++) {
    const dayTeams = [fixed, ...rotating];
    const fixtures: ScheduledFixture[] = [];
    for (let i = 0; i < half; i++) {
      const a = dayTeams[i];
      const b = dayTeams[n - 1 - i];
      // Alternate home advantage round to round for fairness.
      fixtures.push(r % 2 === 0 ? { homeId: a, awayId: b } : { homeId: b, awayId: a });
    }
    rounds.push({ matchday: rounds.length + 1, fixtures });
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  // Top up to 38 matchdays by replaying earlier rounds with home/away swapped.
  let src = 0;
  while (rounds.length < SEASON_MATCHDAYS) {
    const base = rounds[src];
    rounds.push({
      matchday: rounds.length + 1,
      fixtures: base.fixtures.map((f) => ({ homeId: f.awayId, awayId: f.homeId })),
    });
    src++;
  }

  return rounds.slice(0, SEASON_MATCHDAYS);
}

/** Local Date for a given day-of-week (0=Sun…6=Sat) at the kickoff hour, on/after `from`. */
function nextKickoff(from: Date, days: number[]): Date {
  const d = new Date(from);
  for (let i = 0; i < 14; i++) {
    if (days.includes(d.getDay())) {
      const k = new Date(d);
      k.setHours(KICKOFF_HOUR, 0, 0, 0);
      if (k.getTime() > from.getTime()) return k;
    }
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
  }
  // Fallback (shouldn't happen): a week out.
  return new Date(from.getTime() + 7 * 86400000);
}

/**
 * 38 kickoff timestamps (ms): Wednesday & Saturday at 3pm, starting from the
 * next such slot after `startMs`.
 */
export function scheduleKickoffs(startMs: number): number[] {
  const SAT = 6;
  const WED = 3;
  const out: number[] = [];
  let cursor = new Date(startMs);
  for (let i = 0; i < SEASON_MATCHDAYS; i++) {
    const next = nextKickoff(cursor, [WED, SAT]);
    out.push(next.getTime());
    cursor = new Date(next.getTime() + 60_000); // step just past this kickoff
  }
  return out;
}

/** Build the standings table from whatever fixtures have been played so far. */
export function computeTable(
  teams: LeagueTeam[],
  played: RecordedFixture[],
): LeagueStanding[] {
  const stats = new Map<string, LeagueStanding>();
  for (const t of teams) {
    stats.set(t.id, {
      teamId: t.id,
      name: t.name,
      isAI: t.isAI,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }
  for (const f of played) {
    const hs = stats.get(f.homeId);
    const as = stats.get(f.awayId);
    if (!hs || !as) continue;
    hs.played++;
    as.played++;
    hs.goalsFor += f.homeGoals;
    hs.goalsAgainst += f.awayGoals;
    as.goalsFor += f.awayGoals;
    as.goalsAgainst += f.homeGoals;
    if (f.homeGoals > f.awayGoals) {
      hs.wins++;
      hs.points += 3;
      as.losses++;
    } else if (f.homeGoals < f.awayGoals) {
      as.wins++;
      as.points += 3;
      hs.losses++;
    } else {
      hs.draws++;
      as.draws++;
      hs.points++;
      as.points++;
    }
  }
  return [...stats.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Draft a random AI team: random formation, each slot filled by a random
 * player — preferring exact-role matches, falling back to whoever fits best.
 */
export function generateAITeam(
  rng: () => number,
  pool: Player[],
  id: string,
  name: string,
): LeagueTeam {
  const formation = FORMATION_LIST[Math.floor(rng() * FORMATION_LIST.length)];
  const available = shuffle(pool, rng);
  const used = new Set<string>();
  const squad: DraftPick[] = [];

  formation.roleSlots.forEach((slotRole, slotIndex) => {
    // Prefer an exact role match, then the lowest-penalty fit.
    let candidate = available.find((p) => !used.has(p.id) && playerRole(p) === slotRole);
    if (!candidate) {
      let best: Player | undefined;
      let bestPenalty = Infinity;
      for (const p of available) {
        if (used.has(p.id)) continue;
        const pen = rolePenalty(playerRole(p), slotRole);
        if (pen < bestPenalty) {
          bestPenalty = pen;
          best = p;
        }
      }
      candidate = best;
    }
    if (!candidate) return;
    used.add(candidate.id);
    squad.push({
      player: candidate,
      wheelLanding: { club: candidate.club, season: candidate.season },
      slotIndex,
      assignedRole: slotRole,
      rolePenalty: rolePenalty(playerRole(candidate), slotRole),
    });
  });

  return { id, name, isAI: true, formationId: formation.id, squad };
}

/**
 * Double round-robin: every team plays every other home and away.
 * Deterministic for a given rng seed.
 */
export function simulateLeague(
  teams: LeagueTeam[],
  rng: () => number,
): { fixtures: LeagueFixture[]; table: LeagueStanding[] } {
  const fixtures: LeagueFixture[] = [];
  const stats = new Map<string, LeagueStanding>();
  for (const t of teams) {
    stats.set(t.id, {
      teamId: t.id,
      name: t.name,
      isAI: t.isAI,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }

  let round = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i === j) continue;
      round++;
      const home = teams[i];
      const away = teams[j];
      const { goalsA, goalsB } = simulateHeadToHead(home.squad, away.squad, rng);
      fixtures.push({ round, homeId: home.id, awayId: away.id, homeGoals: goalsA, awayGoals: goalsB });

      const hs = stats.get(home.id)!;
      const as = stats.get(away.id)!;
      hs.played++;
      as.played++;
      hs.goalsFor += goalsA;
      hs.goalsAgainst += goalsB;
      as.goalsFor += goalsB;
      as.goalsAgainst += goalsA;
      if (goalsA > goalsB) {
        hs.wins++;
        hs.points += 3;
        as.losses++;
      } else if (goalsA < goalsB) {
        as.wins++;
        as.points += 3;
        hs.losses++;
      } else {
        hs.draws++;
        as.draws++;
        hs.points++;
        as.points++;
      }
    }
  }

  const table = [...stats.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });

  return { fixtures, table };
}

export function formationById(id: FormationId) {
  return FORMATIONS[id];
}
