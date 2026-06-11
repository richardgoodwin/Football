import { motion } from 'framer-motion';

interface AnswerButtonProps {
  label: string;
  onClick: () => void;
  state: 'idle' | 'selected' | 'correct' | 'wrong' | 'reveal-correct' | 'disabled';
  shortcut?: string;
}

const stateStyles: Record<AnswerButtonProps['state'], string> = {
  idle: 'border-white/10 bg-stadium-800/70 hover:bg-stadium-700/70',
  selected: 'border-neon-cyan bg-neon-cyan/10',
  correct: 'border-correct bg-correct/20',
  'reveal-correct': 'border-correct bg-correct/15',
  wrong: 'border-wrong bg-wrong/20',
  disabled: 'border-white/5 bg-stadium-800/40 text-slate-400',
};

export function AnswerButton({ label, onClick, state, shortcut }: AnswerButtonProps) {
  const disabled = state === 'disabled' || state === 'correct' || state === 'wrong' || state === 'reveal-correct';
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full text-left px-4 py-3.5 sm:py-4 rounded-xl border transition-colors flex items-center gap-3',
        stateStyles[state],
      ].join(' ')}
    >
      {shortcut && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-bold text-slate-400">
          {shortcut}
        </span>
      )}
      <span className="font-medium text-base sm:text-lg">{label}</span>
    </motion.button>
  );
}
