interface TimerProps {
  remainingMs: number;
  totalMs: number;
}

export function Timer({ remainingMs, totalMs }: TimerProps) {
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const secs = Math.max(0, Math.ceil(remainingMs / 1000));
  const danger = ratio < 0.25;

  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - ratio);

  return (
    <div className="relative inline-flex items-center justify-center" aria-label={`${secs} seconds remaining`}>
      <svg width="90" height="90" className="-rotate-90">
        <circle cx="45" cy="45" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
        <circle
          cx="45"
          cy="45"
          r={r}
          stroke={danger ? 'rgb(244 63 94)' : 'rgb(34 211 238)'}
          strokeWidth="6"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-100"
        />
      </svg>
      <span className={`absolute font-display text-2xl tabular-nums ${danger ? 'text-rose-400' : 'text-slate-100'}`}>
        {secs}
      </span>
    </div>
  );
}
