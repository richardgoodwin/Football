import type { MultipleChoiceQ } from '@/types/question';
import { shuffle } from '@/utils/shuffle';

export interface MCOption {
  label: string;
  isCorrect: boolean;
}

export function buildOptions(q: MultipleChoiceQ, rng: () => number = Math.random): MCOption[] {
  const opts: MCOption[] = [
    { label: q.correct, isCorrect: true },
    ...q.distractors.map((d) => ({ label: d, isCorrect: false })),
  ];
  return shuffle(opts, rng);
}

export function checkMCAnswer(q: MultipleChoiceQ, selected: string): boolean {
  return selected === q.correct;
}
