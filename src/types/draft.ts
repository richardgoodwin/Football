/**
 * Types for the Perfect Season draft + simulation game.
 */

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

export interface Player {
  id: string;
  name: string;
  club: string;
  season: string;
  position: Position;
  /** Overall ability, 60-99. */
  rating: number;
  goals?: number;
  assists?: number;
  appearances?: number;
  cleanSheets?: number;
  tags?: string[];
}

export type FormationId = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1';

export interface Formation {
  id: FormationId;
  label: string;
  /** Count of slots per position. Sums to 11. */
  slots: Record<Position, number>;
}

export interface DraftPick {
  player: Player;
  wheelLanding: { club: string; season: string };
}

export interface DraftState {
  formation: Formation;
  picks: DraftPick[];
  /** Players that may not be picked again. */
  pickedPlayerIds: Set<string>;
  /** Track per-club picks for the "max per club" rule. */
  picksByClub: Record<string, number>;
  /** Remaining respins (currently a single-use safety valve). */
  respinsRemaining: number;
}

export interface MatchSimulation {
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
  squadStrength: number;
  opponentStrength: number;
}

export interface SeasonResult {
  squad: DraftPick[];
  formationId: FormationId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  /** Best estimate of final league position. */
  position: number;
  /** Per-match detail. */
  matches: MatchSimulation[];
  /** True if won every game (38-0). */
  perfect: boolean;
  /** Snapshot of squad strength used. */
  squadStrength: number;
}
