interface ProgressDotsProps {
  total: number;
  current: number;
  results: Array<'correct' | 'wrong' | 'pending'>;
}

export function ProgressDots({ total, current, results }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const result = results[i] ?? 'pending';
        const active = i === current;
        return (
          <span
            key={i}
            className={[
              'h-2 rounded-full transition-all',
              active ? 'w-6 bg-neon-cyan' : 'w-2',
              result === 'correct' ? 'bg-correct' : '',
              result === 'wrong' ? 'bg-wrong' : '',
              result === 'pending' && !active ? 'bg-white/15' : '',
            ].join(' ')}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
