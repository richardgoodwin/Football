import type {
  DraftPick,
  Formation,
  MatchSimulation,
  SeasonResult,
} from '@/types/draft';
import { pointsToPosition, squadAttack, squadDefense, squadStrength } from './scoring';

const SEASON_LENGTH = 38;

/** Sample from Poisson(lambda) using inverse-CDF + uniform draws. */
function samplePoisson(rng: () => number, lambda: number): number {
  const lam = Math.max(0.05, lambda);
  const L = Math.exp(-lam);
  let k = 0;
  let p = 1;
  // Knuth's algorithm
  do {
    k++;
    p *= rng();
  } while (p > L && k < 12);
  return k - 1;
}

/** Box-Muller transform for a normal-ish random. */
function sampleNormal(rng: () => number, mean: number, stddev: number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

/**
 * Simulate one Premier League season for the given squad. Returns a complete
 * season result with per-match detail.
 *
 * Calibration target:
 *  - 99-rated squad (Henry / De Bruyne / Van Dijk class everywhere): ~5% chance of 38-0
 *  - 85-rated squad: ~champions level (90+ points typical)
 *  - 70-rated squad: mid-table (45-55 points)
 *  - 60-rated squad: relegation fodder
 */
export function simulateSeason(
  picks: DraftPick[],
  formation: Formation,
  rng: () => number,
): SeasonResult {
  const overall = squadStrength(picks);
  const attack = squadAttack(picks);
  const defense = squadDefense(picks);

  const matches: MatchSimulation[] = [];
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (let i = 0; i < SEASON_LENGTH; i++) {
    // Opposition strength is normally distributed around mid-table.
    const oppOverall = clamp(sampleNormal(rng, 76, 6), 58, 94);
    const oppAttack = oppOverall + sampleNormal(rng, 0, 2);
    const oppDefense = oppOverall + sampleNormal(rng, 0, 2);

    // Goal expectancy. The diff sets the slope; baseline 1.3 g/g.
    const expectedFor = Math.max(0.2, 1.3 + (attack - oppDefense) * 0.085);
    const expectedAgainst = Math.max(0.2, 1.3 + (oppAttack - defense) * 0.085);

    const gf = samplePoisson(rng, expectedFor);
    const ga = samplePoisson(rng, expectedAgainst);
    const result: MatchSimulation['result'] = gf > ga ? 'W' : gf < ga ? 'L' : 'D';

    if (result === 'W') wins++;
    else if (result === 'D') draws++;
    else losses++;
    goalsFor += gf;
    goalsAgainst += ga;

    matches.push({
      opponent: `Opp ${i + 1}`,
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
