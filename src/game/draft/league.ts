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

const AI_TEAM_NAMES = [
  'Robo Rovers', 'The Algorithms', 'Silicon City', 'Neural Nets FC',
  'Quantum Wanderers', 'Bot Albion', 'Circuit Town', 'Vector Villa',
  'Binary United', 'Cache County',
];

export function aiTeamName(index: number): string {
  return AI_TEAM_NAMES[index % AI_TEAM_NAMES.length];
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
