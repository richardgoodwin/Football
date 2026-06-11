import type {
  DraftPick,
  DraftState,
  Formation,
  Player,
  Position,
} from '@/types/draft';
import { MAX_PICKS_PER_CLUB, openPositions, remainingSlots } from './constraints';
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

export function positionCounts(state: DraftState): Record<Position, number> {
  const counts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of state.picks) {
    counts[p.player.position]++;
  }
  return counts;
}

export function remaining(state: DraftState): Record<Position, number> {
  return remainingSlots(state.formation, positionCounts(state));
}

export function openPositionsFor(state: DraftState): Position[] {
  return openPositions(remaining(state));
}

export function isComplete(state: DraftState): boolean {
  return state.picks.length >= 11;
}

/**
 * Filter the pool to players eligible to be picked given the current draft state
 * and the wheel landing.
 */
export function eligiblePlayers(
  state: DraftState,
  landing: WheelLanding,
  pool: Player[],
): Player[] {
  const open = new Set(openPositionsFor(state));
  return pool.filter((p) => {
    if (p.club !== landing.club || p.season !== landing.season) return false;
    if (state.pickedPlayerIds.has(p.id)) return false;
    if (!open.has(p.position)) return false;
    if ((state.picksByClub[p.club] ?? 0) >= MAX_PICKS_PER_CLUB) return false;
    return true;
  });
}

/** Returns a new state with the player added. Caller must verify eligibility. */
export function applyPick(state: DraftState, player: Player, landing: WheelLanding): DraftState {
  const pick: DraftPick = { player, wheelLanding: landing };
  const nextPicked = new Set(state.pickedPlayerIds);
  nextPicked.add(player.id);
  const nextByClub = { ...state.picksByClub };
  nextByClub[player.club] = (nextByClub[player.club] ?? 0) + 1;
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
