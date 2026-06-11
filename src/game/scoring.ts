import { DIFFICULTY_MULTIPLIER, type Difficulty } from '@/types/question';

export const BASE_POINTS = 100;
export const STREAK_BONUS_PER_STEP = 0.1;
export const STREAK_BONUS_CAP = 1.0;

export interface ScoreInputs {
  difficulty: Difficulty;
  /** Milliseconds remaining when answered. */
  timeRemainingMs: number;
  /** Total time the player had for this question, in ms. */
  totalTimeMs: number;
  /** Current consecutive correct count BEFORE this answer. */
  streakBefore: number;
}

export interface ScoreResult {
  total: number;
  base: number;
  difficultyMultiplier: number;
  timeBonus: number;
  streakBonus: number;
}

/**
 * Score for a single correct answer. Wrong answers always score 0 —
 * this function should not be called for them.
 */
export function scoreCorrect(input: ScoreInputs): ScoreResult {
  const difficultyMultiplier = DIFFICULTY_MULTIPLIER[input.difficulty];
  const ratio = input.totalTimeMs > 0 ? Math.max(0, Math.min(1, input.timeRemainingMs / input.totalTimeMs)) : 0;
  // Time bonus: 50% guaranteed for being correct, up to +50% based on speed.
  const timeBonus = 0.5 + 0.5 * ratio;

  const streakStep = Math.min(input.streakBefore, Math.ceil(STREAK_BONUS_CAP / STREAK_BONUS_PER_STEP));
  const streakBonus = 1 + streakStep * STREAK_BONUS_PER_STEP;

  const total = Math.round(BASE_POINTS * difficultyMultiplier * timeBonus * streakBonus);

  return {
    total,
    base: BASE_POINTS,
    difficultyMultiplier,
    timeBonus,
    streakBonus,
  };
}

/** XP gained for a correct answer (score / 10, rounded). */
export function xpFromScore(score: number): number {
  return Math.round(score / 10);
}

/** Cumulative XP required to reach the given level. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

/** Level for a given cumulative XP. */
export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
    if (level > 999) break;
  }
  return level;
}
