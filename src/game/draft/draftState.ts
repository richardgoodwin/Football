import type {
  DraftPick,
  DraftState,
  Formation,
  Player,
  Position,
} from '@/types/draft';
import { ROLE_FAMILY } from '@/types/draft';
import { MAX_PICKS_PER_CLUB } from './constraints';
import { playerRole, rolePenalty } from './roles';
import type { WheelLanding } from './wheel';

export function createDraft(formation: Formation): DraftState {
  return {
    formation,
    picks: [],
    pickedPlayerIds: new Set(),
    picksByClub: {},
    respinsRemaining: 1,
  };
}

/** Indices into formation.roleSlots already taken by a pick. */
export function filledSlotIndices(state: DraftState): Set<number> {
  const filled = new Set<number>();
  for (const p of state.picks) {
    if (p.slotIndex !== undefined) filled.add(p.slotIndex);
  }
  return filled;
}

/** Open slot indices, in formation order. */
export function openSlots(state: DraftState): number[] {
  const filled = filledSlotIndices(state);
  return state.formation.roleSlots
    .map((_, i) => i)
    .filter((i) => !filled.has(i));
}

/** Family counts still needed (for compact display). */
export function remaining(state: DraftState): Record<Position, number> {
  const counts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const i of openSlots(state)) {
    counts[ROLE_FAMILY[state.formation.roleSlots[i]]]++;
  }
  return counts;
}

export function isComplete(state: DraftState): boolean {
  return state.picks.length >= 11;
}

/**
 * Players from the landed club-season who can be drafted. With the role
 * system, ANY player can fill any open slot (at a rating penalty) — so
 * eligibility is just: from this club-season, not already picked, club cap.
 */
export function eligiblePlayers(
  state: DraftState,
  landing: WheelLanding,
  pool: Player[],
): Player[] {
  return pool.filter((p) => {
    if (p.club !== landing.club || p.season !== landing.season) return false;
    if (state.pickedPlayerIds.has(p.id)) return false;
    if ((state.picksByClub[p.club] ?? 0) >= MAX_PICKS_PER_CLUB) return false;
    return true;
  });
}

/** Build a fully-annotated pick for a player going into a specific slot. */
export function buildPick(
  formation: Formation,
  player: Player,
  landing: WheelLanding,
  slotIndex: number,
): DraftPick {
  const slotRole = formation.roleSlots[slotIndex];
  return {
    player,
    wheelLanding: landing,
    slotIndex,
    assignedRole: slotRole,
    rolePenalty: rolePenalty(playerRole(player), slotRole),
  };
}

/** Returns a new state with the pick added. Caller must verify eligibility. */
export function applyPick(state: DraftState, pick: DraftPick): DraftState {
  const nextPicked = new Set(state.pickedPlayerIds);
  nextPicked.add(pick.player.id);
  const nextByClub = { ...state.picksByClub };
  nextByClub[pick.player.club] = (nextByClub[pick.player.club] ?? 0) + 1;
  return {
    ...state,
    picks: [...state.picks, pick],
    pickedPlayerIds: nextPicked,
    picksByClub: nextByClub,
  };
}

export function consumeRespin(state: DraftState): DraftState {
  if (state.respinsRemaining <= 0) return state;
  return { ...state, respinsRemaining: state.respinsRemaining - 1 };
}
