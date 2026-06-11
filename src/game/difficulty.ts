import type { Category, Difficulty, Question } from '@/types/question';
import { shuffle } from '@/utils/shuffle';

export interface SelectorFilters {
  difficulties?: Difficulty[];
  categories?: Category[];
  /** Year range filter — question must overlap. */
  yearRange?: [number, number];
  /** Tag filter — question must contain at least one. */
  tagsAny?: string[];
}

export function applyFilters(pool: Question[], filters: SelectorFilters): Question[] {
  return pool.filter((q) => {
    if (filters.difficulties && !filters.difficulties.includes(q.difficulty)) return false;
    if (filters.categories && !filters.categories.includes(q.category)) return false;
    if (filters.yearRange) {
      const [from, to] = filters.yearRange;
      if (q.yearEnd < from || q.yearStart > to) return false;
    }
    if (filters.tagsAny && !filters.tagsAny.some((t) => q.tags.includes(t))) return false;
    return true;
  });
}

export function pickQuestions(
  pool: Question[],
  count: number,
  filters: SelectorFilters = {},
  rng: () => number = Math.random,
): Question[] {
  const filtered = applyFilters(pool, filters);
  return shuffle(filtered, rng).slice(0, count);
}

/**
 * Survival ramping: pick a difficulty for the Nth question. Step every 5 correct.
 */
export function survivalDifficultyForStep(step: number): Difficulty {
  if (step < 5) return 'easy';
  if (step < 12) return 'medium';
  if (step < 22) return 'hard';
  return 'legendary';
}
