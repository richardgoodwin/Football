import type { CareerPathQ } from '@/types/question';
import { fuzzyMatch } from '@/utils/format';

export function checkCareerPath(q: CareerPathQ, input: string): boolean {
  return fuzzyMatch(input, [q.correct, ...q.acceptedAnswers]);
}
