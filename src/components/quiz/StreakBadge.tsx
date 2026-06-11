import { AnimatePresence, motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak < 2) return null;
  const isCombo = streak >= 3;
  return (
    <AnimatePresence>
      <motion.div
        key={streak}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold',
          isCombo
            ? 'bg-gradient-to-r from-neon-amber/80 to-neon-pink/80 text-stadium-950'
            : 'bg-white/10 text-slate-200',
        ].join(' ')}
      >
        <Flame size={14} />
        {streak}× streak
      </motion.div>
    </AnimatePresence>
  );
}
