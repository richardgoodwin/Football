import type { DraftPick, Formation, Position } from '@/types/draft';
import { PlayerCard } from './PlayerCard';

interface SquadViewProps {
  picks: DraftPick[];
  formation: Formation;
}

const POSITION_ORDER: Position[] = ['FWD', 'MID', 'DEF', 'GK'];

export function SquadView({ picks, formation }: SquadViewProps) {
  const byPosition: Record<Position, DraftPick[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of picks) byPosition[p.player.position].push(p);

  return (
    <div className="space-y-3">
      {POSITION_ORDER.map((pos) => {
        const filled = byPosition[pos];
        const slots = formation.slots[pos];
        if (slots === 0) return null;
        const empties = Math.max(0, slots - filled.length);
        return (
          <div key={pos}>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
              {pos} · {filled.length}/{slots}
            </div>
            <div
              className={[
                'grid gap-2',
                slots <= 2 ? 'grid-cols-1 sm:grid-cols-2' : '',
                slots === 3 ? 'grid-cols-2 sm:grid-cols-3' : '',
                slots === 4 ? 'grid-cols-2 sm:grid-cols-4' : '',
                slots === 5 ? 'grid-cols-2 sm:grid-cols-5' : '',
              ].join(' ')}
            >
              {filled.map((p) => (
                <PlayerCard key={p.player.id} player={p.player} compact />
              ))}
              {Array.from({ length: empties }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500"
                >
                  empty
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
