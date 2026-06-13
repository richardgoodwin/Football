import { Zap, CircleDot, Shield, Hand } from 'lucide-react';
import type { DraftPick, Position } from '@/types/draft';
import { ROLE_FAMILY } from '@/types/draft';
import { pickEffectiveRating } from '@/game/draft/roles';

interface OverallRatingProps {
  picks: DraftPick[];
}

function familyOf(p: DraftPick): Position {
  return p.assignedRole ? ROLE_FAMILY[p.assignedRole] : p.player.position;
}

function lineAverage(picks: DraftPick[], family: Position): number {
  const inLine = picks.filter((p) => familyOf(p) === family);
  if (inLine.length === 0) return 0;
  return Math.round(inLine.reduce((s, p) => s + pickEffectiveRating(p), 0) / inLine.length);
}

function overallRating(picks: DraftPick[]): number {
  if (picks.length === 0) return 0;
  return Math.round(picks.reduce((s, p) => s + pickEffectiveRating(p), 0) / picks.length);
}

const LINES: { key: Position; label: string; icon: typeof Zap; bar: string; text: string }[] = [
  { key: 'FWD', label: 'Attack', icon: Zap, bar: 'from-rose-500 to-orange-400', text: 'text-rose-400' },
  { key: 'MID', label: 'Midfield', icon: CircleDot, bar: 'from-emerald-500 to-green-400', text: 'text-emerald-400' },
  { key: 'DEF', label: 'Defence', icon: Shield, bar: 'from-sky-500 to-cyan-400', text: 'text-sky-400' },
  { key: 'GK', label: 'GK', icon: Hand, bar: 'from-amber-500 to-yellow-400', text: 'text-amber-400' },
];

function overallTone(rating: number): string {
  if (rating >= 90) return 'text-neon-amber';
  if (rating >= 84) return 'text-neon-cyan';
  if (rating >= 76) return 'text-neon-lime';
  return 'text-slate-200';
}

/** Team rating summary: overall score plus per-line bars. */
export function OverallRating({ picks }: OverallRatingProps) {
  const overall = overallRating(picks);

  return (
    <div className="rounded-2xl border border-white/10 bg-stadium-900/70 p-5">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">Overall</div>
      <div className={['font-display text-6xl leading-none mb-4', overallTone(overall)].join(' ')}>
        {overall}
      </div>

      <div className="space-y-3">
        {LINES.map(({ key, label, icon: Icon, bar, text }) => {
          const value = lineAverage(picks, key);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon size={15} className={text} />
                  {label}
                </span>
                <span className="font-display text-lg tabular-nums">{value}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={['h-full rounded-full bg-gradient-to-r', bar].join(' ')}
                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
