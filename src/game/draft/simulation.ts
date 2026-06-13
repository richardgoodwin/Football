import type {
  DraftPick,
  Formation,
  MatchSimulation,
  SeasonDifficulty,
  SeasonResult,
} from '@/types/draft';
import { pointsToPosition, squadAttack, squadDefense, squadStrength } from './scoring';
import { shuffle } from '@/utils/shuffle';

const SEASON_LENGTH = 38;

/** Opposition strength means per difficulty. Higher = tougher league. */
const OPPOSITION_MEAN: Record<SeasonDifficulty, number> = {
  easy: 70,
  normal: 76,
  hard: 81,
  legendary: 86,
};

/** Names for the 19 opposition clubs (each faced home and away). */
const OPPONENT_NAMES = [
  'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
  'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Leeds United',
  'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United',
  'Newcastle United', 'Nottingham Forest', 'Tottenham', 'West Ham', 'Wolves',
];

/** Sample from Poisson(lambda) using Knuth's algorithm. */
export function samplePoisson(rng: () => number, lambda: number): number {
  const lam = Math.max(0.05, lambda);
  const L = Math.exp(-lam);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L && k < 12);
  return k - 1;
}

/** Box-Muller transform for a normal-ish random. */
export function sampleNormal(rng: () => number, mean: number, stddev: number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

/** Expected goals for a side with `attack` facing a side with `defense`. */
export function expectedGoals(attack: number, defense: number): number {
  return Math.max(0.2, 1.3 + (attack - defense) * 0.085);
}

/** Poisson probability mass: P(X = k) for X ~ Poisson(lambda). */
function poissonPmf(k: number, lambda: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / fact;
}

export interface SeasonPrediction {
  points: number;
  position: number;
}

/**
 * Deterministic pre-season prediction of where a squad will finish, computed
 * from expected goals against an average opponent at the chosen difficulty.
 * No randomness — same squad always predicts the same finish.
 */
export function predictSeason(
  picks: DraftPick[],
  difficulty: SeasonDifficulty = 'normal',
): SeasonPrediction {
  const attack = squadAttack(picks);
  const defense = squadDefense(picks);
  const oppMean = OPPOSITION_MEAN[difficulty];
  const lambdaFor = expectedGoals(attack, oppMean);
  const lambdaAgainst = expectedGoals(oppMean, defense);

  let pWin = 0;
  let pDraw = 0;
  for (let f = 0; f <= 8; f++) {
    const pf = poissonPmf(f, lambdaFor);
    for (let a = 0; a <= 8; a++) {
      const p = pf * poissonPmf(a, lambdaAgainst);
      if (f > a) pWin += p;
      else if (f === a) pDraw += p;
    }
  }
  const ppg = 3 * pWin + pDraw;
  const points = Math.round(ppg * SEASON_LENGTH);
  return { points, position: pointsToPosition(points) };
}

/**
 * Simulate one match between two drafted squads (used by friends leagues).
 */
export function simulateHeadToHead(
  squadA: DraftPick[],
  squadB: DraftPick[],
  rng: () => number,
): { goalsA: number; goalsB: number } {
  const attackA = squadAttack(squadA);
  const defenseA = squadDefense(squadA);
  const attackB = squadAttack(squadB);
  const defenseB = squadDefense(squadB);
  return {
    goalsA: samplePoisson(rng, expectedGoals(attackA, defenseB)),
    goalsB: samplePoisson(rng, expectedGoals(attackB, defenseA)),
  };
}

/**
 * Simulate one Premier League season for the given squad against a field of
 * simulated opponents whose strength depends on the difficulty.
 *
 * Calibration (normal): a ~99-effective squad occasionally goes 38-0; a
 * 70-rated squad is mid-table and never does.
 */
export function simulateSeason(
  picks: DraftPick[],
  formation: Formation,
  rng: () => number,
  difficulty: SeasonDifficulty = 'normal',
): SeasonResult {
  const overall = squadStrength(picks);
  const attack = squadAttack(picks);
  const defense = squadDefense(picks);
  const oppMean = OPPOSITION_MEAN[difficulty];

  // Fixture list: each opposition club twice (home and away), shuffled.
  const fixtures = shuffle([...OPPONENT_NAMES, ...OPPONENT_NAMES], rng);

  const matches: MatchSimulation[] = [];
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (let i = 0; i < SEASON_LENGTH; i++) {
    const oppOverall = clamp(sampleNormal(rng, oppMean, 6), 58, 96);
    const oppAttack = oppOverall + sampleNormal(rng, 0, 2);
    const oppDefense = oppOverall + sampleNormal(rng, 0, 2);

    const gf = samplePoisson(rng, expectedGoals(attack, oppDefense));
    const ga = samplePoisson(rng, expectedGoals(oppAttack, defense));
    const result: MatchSimulation['result'] = gf > ga ? 'W' : gf < ga ? 'L' : 'D';

    if (result === 'W') wins++;
    else if (result === 'D') draws++;
    else losses++;
    goalsFor += gf;
    goalsAgainst += ga;

    matches.push({
      opponent: fixtures[i] ?? `Opposition ${i + 1}`,
      goalsFor: gf,
      goalsAgainst: ga,
      result,
      squadStrength: overall,
      opponentStrength: oppOverall,
    });
  }

  const points = wins * 3 + draws;
  const perfect = wins === SEASON_LENGTH;

  return {
    squad: picks,
    formationId: formation.id,
    difficulty,
    played: SEASON_LENGTH,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    points,
    position: pointsToPosition(points),
    matches,
    perfect,
    squadStrength: overall,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
