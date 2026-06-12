import { motion } from 'framer-motion';
import type { Player } from '@/types/draft';
import { BIRTH_YEARS, snapshotAge } from '@/game/draft/aging';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

function ratingTone(rating: number): { ring: string; chip: string } {
  if (rating >= 95) return { ring: 'ring-neon-amber/60', chip: 'bg-neon-amber text-stadium-950' };
  if (rating >= 88) return { ring: 'ring-neon-cyan/60', chip: 'bg-neon-cyan text-stadium-950' };
  if (rating >= 80) return { ring: 'ring-neon-lime/40', chip: 'bg-neon-lime/80 text-stadium-950' };
  if (rating >= 72) return { ring: 'ring-slate-400/40', chip: 'bg-slate-300 text-stadium-950' };
  return { ring: 'ring-slate-500/40', chip: 'bg-slate-400 text-stadium-950' };
}

function positionTone(pos: Player['position']): string {
  switch (pos) {
    case 'GK': return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    case 'DEF': return 'bg-sky-500/20 text-sky-200 border-sky-500/40';
    case 'MID': return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
    case 'FWD': return 'bg-rose-500/20 text-rose-200 border-rose-500/40';
  }
}

function funStat(player: Player): string | null {
  if (player.goals !== undefined && player.goals > 0) {
    const a = player.assists ? ` · ${player.assists} assists` : '';
    return `${player.goals} goals${a}`;
  }
  if (player.cleanSheets !== undefined && player.cleanSheets > 0) {
    return `${player.cleanSheets} clean sheets`;
  }
  if (player.tags && player.tags.length) {
    return player.tags.slice(0, 2).join(' · ');
  }
  return null;
}

export function PlayerCard({ player, onClick, selected, disabled, compact }: PlayerCardProps) {
  const tone = ratingTone(player.rating);
  const stat = funStat(player);
  // age: set by the aging module in dynasty mode; otherwise derive the
  // player's age in their snapshot season (only when birth year is known).
  const age = player.age ?? (BIRTH_YEARS[player.name] ? snapshotAge(player) : null);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      whileHover={!disabled && onClick ? { y: -2 } : undefined}
      whileTap={!disabled && onClick ? { scale: 0.98 } : undefined}
      className={[
        'text-left w-full rounded-2xl border bg-stadium-800/70 backdrop-blur-md shadow-lg ring-1',
        compact ? 'p-3' : 'p-4',
        selected ? 'border-neon-cyan ring-neon-cyan/40' : 'border-white/10',
        tone.ring,
        disabled && !selected ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            'shrink-0 flex h-10 w-10 items-center justify-center rounded-xl font-display text-xl tabular-nums',
            tone.chip,
          ].join(' ')}
        >
          {player.rating}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight truncate">{player.name}</div>
          <div className="text-xs text-slate-400">
            {player.club} · {player.season}
            {age !== null && ` · age ${age}`}
          </div>
          {stat && !compact && <div className="text-xs text-slate-300 mt-1">{stat}</div>}
        </div>
        <span
          className={[
            'shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
            positionTone(player.position),
          ].join(' ')}
        >
          {player.position}
        </span>
      </div>
    </motion.button>
  );
}
