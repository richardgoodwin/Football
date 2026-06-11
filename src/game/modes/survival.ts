import type { Question } from '@/types/question';
import { applyFilters, survivalDifficultyForStep } from '../difficulty';
import { shuffle } from '@/utils/shuffle';
import type { EngineConfig } from '../engine';

/**
 * Build a long ramping queue. Difficulty rises every 5 correct, so we precompute
 * a 40-question sequence that should be more than enough for any survival run.
 */
export function buildSurvival(pool: Question[]): EngineConfig {
  const queue: Question[] = [];
  const used = new Set<string>();

  for (let step = 0; step < 40; step++) {
    const diff = survivalDifficultyForStep(step);
    const candidates = applyFilters(pool, { difficulties: [diff] }).filter((q) => !used.has(q.id));
    const next = shuffle(candidates)[0];
    if (!next) continue;
    used.add(next.id);
    queue.push(next);
  }

  return {
    questions: queue,
    perQuestionMs: 12_000,
    lives: 1,
    endOnFirstWrong: true,
  };
}
