import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SimulationProgressProps {
  totalMatches: number;
  durationMs: number;
  onDone: () => void;
}

export function SimulationProgress({ totalMatches, durationMs, onDone }: SimulationProgressProps) {
  const [matchday, setMatchday] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const ratio = Math.min(1, elapsed / durationMs);
      setMatchday(Math.min(totalMatches, Math.floor(ratio * totalMatches)));
      if (ratio < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onDone();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [totalMatches, durationMs, onDone]);

  return (
    <div className="space-y-4 text-center">
      <div className="text-xs uppercase tracking-wider text-slate-400">Matchday</div>
      <div className="font-display text-6xl tabular-nums text-neon-cyan">{matchday}</div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-neon-cyan via-neon-lime to-neon-amber"
          initial={{ width: 0 }}
          animate={{ width: `${(matchday / totalMatches) * 100}%` }}
          transition={{ ease: 'linear', duration: 0.1 }}
        />
      </div>
      <p className="text-sm text-slate-400">Simulating your season...</p>
    </div>
  );
}
