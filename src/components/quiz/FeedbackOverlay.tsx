import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { Question } from '@/types/question';
import { formatScore } from '@/utils/format';

interface FeedbackOverlayProps {
  open: boolean;
  correct: boolean;
  pointsAwarded: number;
  question: Question | null;
  onContinue: () => void;
  continueLabel?: string;
}

export function FeedbackOverlay({
  open,
  correct,
  pointsAwarded,
  question,
  onContinue,
  continueLabel = 'Continue',
}: FeedbackOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onContinue}
          role="dialog"
          aria-live="polite"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-stadium-900/95 p-6 space-y-4 shadow-2xl"
          >
            <div
              className={[
                'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold',
                correct ? 'bg-correct/20 text-correct' : 'bg-wrong/20 text-wrong',
              ].join(' ')}
            >
              {correct ? <Check size={16} /> : <X size={16} />}
              {correct ? 'Correct!' : 'Wrong'}
            </div>
            {correct && pointsAwarded > 0 && (
              <p className="font-display text-3xl text-neon-cyan">
                +{formatScore(pointsAwarded)}
              </p>
            )}
            {question && (
              <div className="text-sm text-slate-300 space-y-1">
                <p>{question.explanation}</p>
                {question.funFact && (
                  <p className="text-slate-400 text-xs italic">{question.funFact}</p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onContinue}
              className="w-full mt-2 py-3 rounded-xl bg-neon-cyan/90 text-stadium-950 font-semibold hover:bg-neon-cyan"
            >
              {continueLabel}
            </button>
            <p className="text-center text-xs text-slate-500">Tap or press Enter to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
