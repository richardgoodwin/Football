import { useEffect, useMemo, useState } from 'react';
import type { MultipleChoiceQ } from '@/types/question';
import { buildOptions, type MCOption } from '@/game/questionFormats/multipleChoice';
import { AnswerButton } from '../AnswerButton';
import type { AnswerEvent } from '../QuestionCard';

interface Props {
  question: MultipleChoiceQ;
  remainingMs: number;
  onAnswer: (event: AnswerEvent) => void;
  feedbackOpen: boolean;
}

const SHORTCUTS = ['1', '2', '3', '4'];

export function MultipleChoiceRenderer({ question, remainingMs, onAnswer, feedbackOpen }: Props) {
  const options = useMemo<MCOption[]>(() => buildOptions(question), [question.id]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [question.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (feedbackOpen) return;
      const idx = SHORTCUTS.indexOf(e.key);
      if (idx === -1 || !options[idx]) return;
      handleSelect(options[idx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, feedbackOpen]);

  function handleSelect(opt: MCOption) {
    if (selected !== null || feedbackOpen) return;
    setSelected(opt.label);
    onAnswer({ correct: opt.isCorrect, timeRemainingMs: remainingMs });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">{question.prompt}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          let state: React.ComponentProps<typeof AnswerButton>['state'] = 'idle';
          if (selected !== null) {
            if (opt.isCorrect) state = 'reveal-correct';
            if (opt.label === selected && !opt.isCorrect) state = 'wrong';
            if (opt.label !== selected && !opt.isCorrect) state = 'disabled';
            if (opt.label === selected && opt.isCorrect) state = 'correct';
          }
          return (
            <AnswerButton
              key={opt.label}
              label={opt.label}
              onClick={() => handleSelect(opt)}
              state={state}
              shortcut={SHORTCUTS[i]}
            />
          );
        })}
      </div>
    </div>
  );
}
