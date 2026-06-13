import type { DraftPick, Formation, Position, Role } from '@/types/draft';
import { ROLE_FAMILY } from '@/types/draft';
import { pickEffectiveRating } from '@/game/draft/roles';

interface SquadViewProps {
  picks: DraftPick[];
  formation: Formation;
}

const FAMILY_ORDER: Position[] = ['FWD', 'MID', 'DEF', 'GK'];

/**
 * Render the formation as labelled role slots (FWD row at top, GK at bottom).
 * Legacy picks without slotIndex (pre-role saves) are assigned to slots of
 * their player's position family in order.
 */
export function SquadView({ picks, formation }: SquadViewProps) {
  const bySlot = new Map<number, DraftPick>();
  const legacy: DraftPick[] = [];
  for (const p of picks) {
    if (p.slotIndex !== undefined && !bySlot.has(p.slotIndex)) bySlot.set(p.slotIndex, p);
    else legacy.push(p);
  }
  // Place legacy picks into the first empty slot of their family.
  for (const p of legacy) {
    const family = p.player.position;
    const idx = formation.roleSlots.findIndex(
      (role, i) => ROLE_FAMILY[role] === family && !bySlot.has(i),
    );
    if (idx >= 0) bySlot.set(idx, p);
  }

  const rows = FAMILY_ORDER.map((family) => ({
    family,
    slotIndices: formation.roleSlots
      .map((role, i) => ({ role, i }))
      .filter(({ role }) => ROLE_FAMILY[role] === family)
      .map(({ i }) => i),
  })).filter((row) => row.slotIndices.length > 0);

  return (
    <div className="space-y-3">
      {rows.map(({ family, slotIndices }) => (
        <div key={family}>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
            {family} · {slotIndices.filter((i) => bySlot.has(i)).length}/{slotIndices.length}
          </div>
          <div
            className={[
              'grid gap-2',
              slotIndices.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : '',
              slotIndices.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : '',
              slotIndices.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : '',
              slotIndices.length === 5 ? 'grid-cols-2 sm:grid-cols-5' : '',
            ].join(' ')}
          >
            {slotIndices.map((i) => (
              <SlotCell key={i} role={formation.roleSlots[i]} pick={bySlot.get(i)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotCell({ role, pick }: { role: Role; pick?: DraftPick }) {
  if (!pick) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-3 text-center">
        <div className="text-xs font-bold text-slate-500">{role}</div>
        <div className="text-[10px] text-slate-600 mt-0.5">empty</div>
      </div>
    );
  }
  const eff = pickEffectiveRating(pick);
  const penalty = pick.rolePenalty ?? 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-stadium-800/70 p-3">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{role}</span>
        <span
          className={[
            'text-sm font-display tabular-nums px-1.5 rounded',
            penalty > 0 ? 'text-amber-300' : 'text-neon-cyan',
          ].join(' ')}
          title={penalty > 0 ? `Out of position: -${penalty}` : 'Natural role'}
        >
          {eff}
          {penalty > 0 && <span className="text-[9px] align-top ml-0.5">↓</span>}
        </span>
      </div>
      <div className="font-semibold text-sm leading-tight truncate mt-1">{pick.player.name}</div>
      <div className="text-[10px] text-slate-400 truncate">
        {pick.player.club} · {pick.player.season}
      </div>
    </div>
  );
}
