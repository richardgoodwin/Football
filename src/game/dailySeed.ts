import type { Question } from '@/types/question';
import { dateKey, mulberry32, seedFromDate } from '@/utils/rng';
import { pickQuestions } from './difficulty';

export const DAILY_QUESTION_COUNT = 7;

export interface DailyChallenge {
  date: string;
  questions: Question[];
}

export function buildDailyChallenge(pool: Question[], date: Date = new Date()): DailyChallenge {
  const rng = mulberry32(seedFromDate(date));
  // Mix difficulties: 2 easy, 3 medium, 1 hard, 1 legendary.
  const easy = pickQuestions(pool, 2, { difficulties: ['easy'] }, rng);
  const med = pickQuestions(pool, 3, { difficulties: ['medium'] }, rng);
  const hard = pickQuestions(pool, 1, { difficulties: ['hard'] }, rng);
  const leg = pickQuestions(pool, 1, { difficulties: ['legendary'] }, rng);

  const questions = [...easy, ...med, ...hard, ...leg].slice(0, DAILY_QUESTION_COUNT);
  return { date: dateKey(date), questions };
}
