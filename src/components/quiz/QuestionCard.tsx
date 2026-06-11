import type { Question, MultipleChoiceQ, TrueFalseQ, GuessThePlayerQ, CareerPathQ, TimelineQ } from '@/types/question';
import { CATEGORY_LABEL } from '@/types/question';
import { CategoryPill } from './CategoryPill';
import { MultipleChoiceRenderer } from './formats/MultipleChoiceRenderer';
import { TrueFalseRenderer } from './formats/TrueFalseRenderer';
import { GuessThePlayerRenderer } from './formats/GuessThePlayerRenderer';
import { CareerPathRenderer } from './formats/CareerPathRenderer';
import { TimelineRenderer } from './formats/TimelineRenderer';

export interface AnswerEvent {
  correct: boolean;
  timeRemainingMs: number;
}

interface QuestionCardProps {
  question: Question;
  totalTimeMs: number;
  remainingMs: number;
  onAnswer: (event: AnswerEvent) => void;
  feedbackOpen: boolean;
}

export function QuestionCard({ question, remainingMs, onAnswer, feedbackOpen }: QuestionCardProps) {
  const common = { remainingMs, onAnswer, feedbackOpen };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <CategoryPill category={question.category} difficulty={question.difficulty} />
        <span className="text-slate-400 text-xs">
          {question.yearStart === question.yearEnd
            ? question.yearStart
            : `${question.yearStart}–${question.yearEnd}`}
        </span>
      </div>

      {question.format === 'multiple-choice' && (
        <MultipleChoiceRenderer {...common} question={question as MultipleChoiceQ} />
      )}
      {question.format === 'true-false' && (
        <TrueFalseRenderer {...common} question={question as TrueFalseQ} />
      )}
      {question.format === 'guess-the-player' && (
        <GuessThePlayerRenderer {...common} question={question as GuessThePlayerQ} />
      )}
      {question.format === 'career-path' && (
        <CareerPathRenderer {...common} question={question as CareerPathQ} />
      )}
      {question.format === 'timeline' && (
        <TimelineRenderer {...common} question={question as TimelineQ} />
      )}

      <p className="text-xs uppercase tracking-wide text-slate-500">
        {CATEGORY_LABEL[question.category]}
      </p>
    </div>
  );
}
