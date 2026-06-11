import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GuessThePlayerQ } from '@/types/question';
import { checkGuessThePlayer } from '@/game/questionFormats/guessThePlayer';
import { Button } from '@/components/ui/Button';
import type { AnswerEvent } from '../QuestionCard';

interface Props {
  question: GuessThePlayerQ;
  remainingMs: number;
  onAnswer: (event: AnswerEvent) => void;
  feedbackOpen: boolean;
}

export function GuessThePlayerRenderer({ question, remainingMs, onAnswer, feedbackOpen }: Props) {
  const [revealed, setRevealed] = useState(1);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setRevealed(1);
    setInput('');
    setSubmitted(false);
  }, [question.id]);

  function handleSubmit() {
    if (submitted || feedbackOpen) return;
    const correct = checkGuessThePlayer(question, input);
    setSubmitted(true);
    onAnswer({ correct, timeRemainingMs: remainingMs });
  }

  function handleReveal() {
    setRevealed((r) => Math.min(r + 1, question.clues.length));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">Guess the player</h2>
      <ul className="space-y-2">
        {question.clues.slice(0, revealed).map((clue, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4 py-2.5 rounded-lg bg-stadium-800/70 border border-white/5"
          >
            <span className="text-xs text-slate-500 mr-2">Clue {i + 1}</span>
            {clue}
          </motion.li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type your guess..."
          disabled={submitted}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-stadium-900/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60 disabled:opacity-60"
        />
        <Button onClick={handleSubmit} disabled={submitted || !input.trim()}>
          Guess
        </Button>
        {revealed < question.clues.length && !submitted && (
          <Button variant="ghost" onClick={handleReveal} title="Reveal another clue (reduces score)">
            Reveal clue
          </Button>
        )}
      </div>
      {submitted && (
        <p className="text-sm text-slate-300">
          Answer: <span className="font-semibold">{question.correct}</span>
        </p>
      )}
    </div>
  );
}
