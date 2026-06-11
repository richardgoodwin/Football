import type { Question } from '@/types/question';
import { pickQuestions } from '../difficulty';
import type { EngineConfig } from '../engine';

export const PENALTY_ROUNDS = 5;

export interface PenaltyState {
  playerGoals: number;
  aiGoals: number;
  round: number;
  finished: boolean;
}

export function buildPenaltyShootout(pool: Question[]): EngineConfig {
  // Mostly easy-medium so the rhythm stays brisk
  const questions = pickQuestions(pool, PENALTY_ROUNDS, { difficulties: ['easy', 'medium'] });
  return {
    questions,
    perQuestionMs: 10_000,
    lives: PENALTY_ROUNDS,
    endOnFirstWrong: false,
  };
}

/**
 * Returns the AI's goal probability for the given round. Slightly increases
 * to keep tension up if the player is leading.
 */
export function aiScoreProbability(round: number, playerGoals: number, aiGoals: number): number {
  const lead = playerGoals - aiGoals;
  const base = 0.65;
  return Math.min(0.92, base + Math.max(0, lead) * 0.05 + round * 0.01);
}
