import { useEffect, useState } from 'react';
import type { TrueFalseQ } from '@/types/question';
import { AnswerButton } from '../AnswerButton';
import type { AnswerEvent } from '../QuestionCard';

interface Props {
  question: TrueFalseQ;
  remainingMs: number;
  onAnswer: (event: AnswerEvent) => void;
  feedbackOpen: boolean;
}

export function TrueFalseRenderer({ question, remainingMs, onAnswer, feedbackOpen }: Props) {
  const [selected, setSelected] = useState<boolean | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [question.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (feedbackOpen || selected !== null) return;
      if (e.key === '1' || e.key.toLowerCase() === 't') handleSelect(true);
      if (e.key === '2' || e.key.toLowerCase() === 'f') handleSelect(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, feedbackOpen]);

  function handleSelect(value: boolean) {
    if (selected !== null || feedbackOpen) return;
    setSelected(value);
    onAnswer({ correct: value === question.correct, timeRemainingMs: remainingMs });
  }

  function stateFor(value: boolean): React.ComponentProps<typeof AnswerButton>['state'] {
    if (selected === null) return 'idle';
    if (value === question.correct) return 'reveal-correct';
    if (value === selected) return 'wrong';
    return 'disabled';
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">{question.prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        <AnswerButton label="True" onClick={() => handleSelect(true)} state={stateFor(true)} shortcut="1" />
        <AnswerButton label="False" onClick={() => handleSelect(false)} state={stateFor(false)} shortcut="2" />
      </div>
    </div>
  );
}
