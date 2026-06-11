import { useEffect, useState } from 'react';
import type { CareerPathQ } from '@/types/question';
import { checkCareerPath } from '@/game/questionFormats/careerPath';
import { Button } from '@/components/ui/Button';
import type { AnswerEvent } from '../QuestionCard';

interface Props {
  question: CareerPathQ;
  remainingMs: number;
  onAnswer: (event: AnswerEvent) => void;
  feedbackOpen: boolean;
}

export function CareerPathRenderer({ question, remainingMs, onAnswer, feedbackOpen }: Props) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setInput('');
    setSubmitted(false);
  }, [question.id]);

  function handleSubmit() {
    if (submitted || feedbackOpen) return;
    setSubmitted(true);
    onAnswer({ correct: checkCareerPath(question, input), timeRemainingMs: remainingMs });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">Whose career path is this?</h2>
      <ol className="relative border-l border-neon-cyan/30 ml-2 space-y-3 pl-5">
        {question.timeline.map((row, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-neon-cyan" />
            <div className="text-sm text-slate-400">{row.years}</div>
            <div className="font-semibold">{row.club}</div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Player name..."
          disabled={submitted}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-stadium-900/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60 disabled:opacity-60"
        />
        <Button onClick={handleSubmit} disabled={submitted || !input.trim()}>
          Guess
        </Button>
      </div>
      {submitted && (
        <p className="text-sm text-slate-300">
          Answer: <span className="font-semibold">{question.correct}</span>
        </p>
      )}
    </div>
  );
}
