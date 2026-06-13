import type { DraftPick, Formation, Role } from '@/types/draft';
import { ROLE_FAMILY } from '@/types/draft';
import { pickEffectiveRating } from '@/game/draft/roles';

interface PitchViewProps {
  picks: DraftPick[];
  formation: Formation;
}

/** Vertical band per role (0 = own goal line, 5 = attack). */
const ROLE_TIER: Record<Role, number> = {
  GK: 0,
  RB: 1,
  CB: 1,
  LB: 1,
  CDM: 2,
  RM: 3,
  CM: 3,
  LM: 3,
  CAM: 4,
  RW: 5,
  LW: 5,
  ST: 5,
};

/** Horizontal lean per role: -1 left, 0 centre, 1 right. */
const ROLE_SIDE: Record<Role, number> = {
  GK: 0,
  RB: 1,
  CB: 0,
  LB: -1,
  CDM: 0,
  RM: 1,
  CM: 0,
  LM: -1,
  CAM: 0,
  RW: 1,
  ST: 0,
  LW: -1,
};

/** Short descriptive label shown under the position badge. */
const ROLE_DESC: Record<Role, string> = {
  GK: 'Goalkeeper',
  RB: 'Right',
  CB: 'Centre',
  LB: 'Left',
  CDM: 'Defensive',
  CM: 'Central',
  CAM: 'Attacking',
  RM: 'Right',
  LM: 'Left',
  RW: 'Right',
  LW: 'Left',
  ST: 'Striker',
};

/** Vertical position (% from top) per tier — GK at the bottom, attack at top. */
const TIER_Y: Record<number, number> = { 0: 89, 1: 70, 2: 56, 3: 45, 4: 32, 5: 16 };

interface PlacedSlot {
  slotIndex: number;
  role: Role;
  x: number;
  y: number;
}

function placeSlots(formation: Formation): PlacedSlot[] {
  const byTier = new Map<number, number[]>();
  formation.roleSlots.forEach((role, i) => {
    const tier = ROLE_TIER[role];
    const arr = byTier.get(tier) ?? [];
    arr.push(i);
    byTier.set(tier, arr);
  });

  const placed: PlacedSlot[] = [];
  for (const [tier, indices] of byTier) {
    // Left-to-right by side lean, stable on ties.
    const ordered = [...indices].sort((a, b) => {
      const sa = ROLE_SIDE[formation.roleSlots[a]];
      const sb = ROLE_SIDE[formation.roleSlots[b]];
      return sa === sb ? a - b : sa - sb;
    });
    const n = ordered.length;
    ordered.forEach((slotIndex, k) => {
      placed.push({
        slotIndex,
        role: formation.roleSlots[slotIndex],
        x: ((k + 1) / (n + 1)) * 100,
        y: TIER_Y[tier] ?? 50,
      });
    });
  }
  return placed;
}

function ratingTone(rating: number): string {
  if (rating >= 90) return 'bg-neon-amber text-stadium-950 border-neon-amber';
  if (rating >= 84) return 'bg-neon-cyan text-stadium-950 border-neon-cyan';
  if (rating >= 76) return 'bg-neon-lime/90 text-stadium-950 border-neon-lime';
  return 'bg-slate-300 text-stadium-950 border-slate-300';
}

function surname(name: string): string {
  const parts = name.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : name;
}

export function PitchView({ picks, formation }: PitchViewProps) {
  const slots = placeSlots(formation);

  // Map picks to their slot; place legacy/slotless picks into same-family gaps.
  const bySlot = new Map<number, DraftPick>();
  const slotless: DraftPick[] = [];
  for (const p of picks) {
    if (p.slotIndex !== undefined && !bySlot.has(p.slotIndex)) bySlot.set(p.slotIndex, p);
    else slotless.push(p);
  }
  for (const p of slotless) {
    const idx = formation.roleSlots.findIndex(
      (role, i) => ROLE_FAMILY[role] === p.player.position && !bySlot.has(i),
    );
    if (idx >= 0) bySlot.set(idx, p);
  }

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden border border-pitch-700/40 shadow-xl">
      {/* Grass + mowed stripes */}
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-700 to-pitch-900" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.06) 0 10%, transparent 10% 20%)',
        }}
      />

      {/* Pitch markings */}
      <svg
        viewBox="0 0 100 133"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <g fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4">
          <rect x="3" y="3" width="94" height="127" rx="1" />
          <line x1="3" y1="66.5" x2="97" y2="66.5" />
          <circle cx="50" cy="66.5" r="11" />
          <circle cx="50" cy="66.5" r="0.8" fill="rgba(255,255,255,0.4)" stroke="none" />
          {/* Top penalty area (attacking) */}
          <rect x="28" y="3" width="44" height="16" />
          <rect x="40" y="3" width="20" height="6" />
          {/* Bottom penalty area (own) */}
          <rect x="28" y="114" width="44" height="16" />
          <rect x="40" y="124" width="20" height="6" />
        </g>
      </svg>

      {/* Slots */}
      {slots.map((slot) => {
        const pick = bySlot.get(slot.slotIndex);
        const filled = !!pick;
        const eff = pick ? pickEffectiveRating(pick) : 0;
        return (
          <div
            key={slot.slotIndex}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-[26%]"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <div
              className={[
                'flex items-center justify-center rounded-full h-11 w-11 text-sm font-display tabular-nums',
                filled
                  ? `border-2 ${ratingTone(eff)}`
                  : 'border-2 border-dashed border-white/40 text-white/70 bg-black/15',
              ].join(' ')}
            >
              {filled ? eff : slot.role}
            </div>
            <div className="mt-1 px-1.5 py-0.5 rounded bg-stadium-950/80 border border-white/10 max-w-full">
              <div className="text-[10px] font-semibold leading-none truncate text-center">
                {filled ? surname(pick!.player.name) : slot.role}
              </div>
            </div>
            {!filled && (
              <div className="text-[8px] uppercase tracking-wide text-white/50 mt-0.5">
                {ROLE_DESC[slot.role]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
