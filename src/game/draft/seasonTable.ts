import type { SeasonResult } from '@/types/draft';

const SEASON_LENGTH = 38;

/**
 * Opposition clubs, roughly by prestige. They fill the table around the user's
 * XI so the stronger names tend to appear nearer the top — believable without
 * pretending to be a real, fully-simulated league.
 */
const OPPONENT_NAMES_BY_PRESTIGE = [
  'Manchester City',
  'Liverpool',
  'Arsenal',
  'Manchester United',
  'Chelsea',
  'Tottenham',
  'Newcastle United',
  'Aston Villa',
  'Brighton',
  'West Ham',
  'Crystal Palace',
  'Brentford',
  'Fulham',
  'Wolves',
  'Everton',
  'Bournemouth',
  'Nottingham Forest',
  'Leicester City',
  'Leeds United',
];

export interface SeasonTableRow {
  position: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  isUser: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Deterministic pseudo-random integer in [-range, range] from two seeds. */
function jitter(a: number, b: number, range: number): number {
  const h = Math.abs(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453);
  return Math.round((h - Math.floor(h)) * (2 * range + 1)) - range;
}

/**
 * Derive a believable W/D/L split that sums to 38 games and yields exactly
 * `points`. Draws are pulled toward a typical ~9 while keeping the arithmetic
 * exact (points = won * 3 + drawn).
 */
function wdlFromPoints(points: number): { won: number; drawn: number; lost: number } {
  const p = clamp(points, 0, 3 * SEASON_LENGTH);
  const base = ((p % 3) + 3) % 3;
  // Keep won + drawn <= 38 (i.e. points + 2*drawn <= 114) so lost stays >= 0,
  // while drifting draws toward a typical ~9. Steps of 3 keep won an integer.
  const maxDrawn = Math.max(base, Math.floor((3 * SEASON_LENGTH - p) / 2));
  let drawn = base;
  while (
    drawn + 3 <= 14 &&
    drawn + 3 <= maxDrawn &&
    Math.abs(drawn + 3 - 9) <= Math.abs(drawn - 9)
  ) {
    drawn += 3;
  }
  const won = (p - drawn) / 3;
  const lost = SEASON_LENGTH - won - drawn;
  return { won, drawn, lost };
}

/**
 * Build a full 20-team end-of-season table around the user's result. The user's
 * row carries their real record; the other 19 are generated deterministically
 * so that exactly (position - 1) of them finish above the user — i.e. the user
 * lands on the same position the simulation reported. Same result in → same
 * table out (no per-render reshuffling).
 */
export function buildSeasonTable(result: SeasonResult, teamName = 'Your XI'): SeasonTableRow[] {
  const userPoints = result.points;
  const userIdx = clamp(result.position, 1, 20) - 1;

  const rows: SeasonTableRow[] = [
    {
      position: 0,
      name: teamName,
      played: result.played,
      won: result.wins,
      drawn: result.draws,
      lost: result.losses,
      gf: result.goalsFor,
      ga: result.goalsAgainst,
      gd: result.goalsFor - result.goalsAgainst,
      points: userPoints,
      isUser: true,
    },
  ];

  let nameI = 0;
  for (let slot = 0; slot < 20; slot++) {
    if (slot === userIdx) continue;
    const name = OPPONENT_NAMES_BY_PRESTIGE[nameI++] ?? `Club ${slot + 1}`;

    let pts: number;
    if (slot < userIdx) {
      const steps = userIdx - slot;
      pts = userPoints + steps * 3 + jitter(slot, userPoints, 2) + 1;
      if (pts <= userPoints) pts = userPoints + 1;
    } else {
      const steps = slot - userIdx;
      pts = userPoints - steps * 3 + jitter(slot, userPoints, 2) - 1;
      if (pts >= userPoints) pts = userPoints - 1;
    }
    pts = clamp(pts, 16, 106);

    const { won, drawn, lost } = wdlFromPoints(pts);
    const gd = clamp(Math.round((pts - 52) * 0.95) + jitter(slot, pts, 4), -55, 70);
    const gf = clamp(Math.round(46 + (pts - 52) * 0.55) + jitter(slot, pts + 1, 6), 18, 106);
    const ga = clamp(gf - gd, 8, 100);

    rows.push({
      position: 0,
      name,
      played: SEASON_LENGTH,
      won,
      drawn,
      lost,
      gf,
      ga,
      gd: gf - ga,
      points: pts,
      isUser: false,
    });
  }

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      (a.isUser ? -1 : b.isUser ? 1 : 0),
  );
  rows.forEach((row, i) => {
    row.position = i + 1;
  });
  return rows;
}
