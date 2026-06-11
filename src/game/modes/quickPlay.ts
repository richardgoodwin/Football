import type { Category, Difficulty, Question } from '@/types/question';
import { pickQuestions } from '../difficulty';
import type { EngineConfig } from '../engine';

export interface QuickPlayOptions {
  difficulty: Difficulty | 'mixed';
  categories: Category[] | 'all';
  count?: number;
  perQuestionMs?: number;
}

export function buildQuickPlay(pool: Question[], opts: QuickPlayOptions): EngineConfig {
  const count = opts.count ?? 10;
  const perQuestionMs = opts.perQuestionMs ?? 15_000;

  const filters = {
    difficulties: opts.difficulty === 'mixed' ? undefined : [opts.difficulty],
    categories: opts.categories === 'all' ? undefined : opts.categories,
  };
  const questions = pickQuestions(pool, count, filters);

  return {
    questions,
    perQuestionMs,
    lives: count,
    endOnFirstWrong: false,
  };
}
