import type { GuessThePlayerQ } from '@/types/question';
import { fuzzyMatch } from '@/utils/format';

export function checkGuessThePlayer(q: GuessThePlayerQ, input: string): boolean {
  return fuzzyMatch(input, [q.correct, ...q.acceptedAnswers]);
}

/** Score multiplier based on how many clues were revealed (fewer = better). */
export function clueScoreMultiplier(cluesRevealed: number, total: number): number {
  if (total <= 1) return 1;
  const ratio = (total - cluesRevealed) / (total - 1);
  return 0.5 + 0.5 * Math.max(0, ratio);
}
