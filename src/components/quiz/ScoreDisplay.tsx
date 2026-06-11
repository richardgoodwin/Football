import { formatScore } from '@/utils/format';

interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-xs uppercase tracking-wider text-slate-400">Score</span>
      <span className="font-display text-3xl tabular-nums text-neon-cyan">{formatScore(score)}</span>
    </div>
  );
}
