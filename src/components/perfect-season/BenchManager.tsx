import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { DraftPick } from '@/types/draft';
import { pickEffectiveRating } from '@/game/draft/roles';
import { Button } from '@/components/ui/Button';

interface BenchManagerProps {
  picks: DraftPick[];
  bench: DraftPick[];
  onSwap: (slotIndex: number, benchPlayerId: string) => void;
}

/**
 * Lets the player swap a starting XI player with one on the bench. Tap one from
 * each column, then Swap. The bench player inherits the XI slot's role (and any
 * out-of-position penalty); the replaced starter drops to the bench.
 */
export function BenchManager({ picks, bench, onSwap }: BenchManagerProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedBenchId, setSelectedBenchId] = useState<string | null>(null);

  const xi = [...picks].sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));

  function doSwap() {
    if (selectedSlot === null || !selectedBenchId) return;
    onSwap(selectedSlot, selectedBenchId);
    setSelectedSlot(null);
    setSelectedBenchId(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-xs uppercase tracking-wider text-slate-400">Manage bench</h3>
        <Button
          size="sm"
          onClick={doSwap}
          disabled={selectedSlot === null || !selectedBenchId}
        >
          <ArrowLeftRight size={14} className="inline-block mr-1.5" />
          Swap
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        Pick a starter and a sub, then Swap. A sub takes the starter's position (with any
        out-of-position penalty).
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
            Starting XI
          </div>
          <div className="space-y-1.5">
            {xi.map((p) => (
              <Row
                key={p.player.id}
                role={p.assignedRole ?? '—'}
                name={p.player.name}
                sub={`${p.player.club} · ${p.player.season}`}
                rating={pickEffectiveRating(p)}
                selected={selectedSlot === p.slotIndex}
                onClick={() => setSelectedSlot(p.slotIndex ?? null)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
            Bench ({bench.length})
          </div>
          <div className="space-y-1.5">
            {bench.length === 0 && (
              <div className="text-xs text-slate-500 px-3 py-2">No subs drafted.</div>
            )}
            {bench.map((p) => (
              <Row
                key={p.player.id}
                role={p.player.role ?? '—'}
                name={p.player.name}
                sub={`${p.player.club} · ${p.player.season}`}
                rating={p.player.rating}
                selected={selectedBenchId === p.player.id}
                onClick={() => setSelectedBenchId(p.player.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  role,
  name,
  sub,
  rating,
  selected,
  onClick,
}: {
  role: string;
  name: string;
  sub: string;
  rating: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left',
        selected ? 'border-neon-cyan bg-neon-cyan/15' : 'border-white/10 bg-white/5 hover:bg-white/10',
      ].join(' ')}
    >
      <span className="w-9 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {role}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold truncate">{name}</span>
        <span className="block text-[10px] text-slate-400 truncate">{sub}</span>
      </span>
      <span className="font-display tabular-nums text-neon-cyan">{rating}</span>
    </button>
  );
}
