import type { TrueFalseQ } from '@/types/question';

export function checkTFAnswer(q: TrueFalseQ, selected: boolean): boolean {
  return selected === q.correct;
}
