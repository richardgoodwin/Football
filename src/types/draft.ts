/**
 * Types for the Perfect Season draft + simulation game.
 */

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

/** Specific on-pitch roles. Formations are built from these. */
export type Role =
  | 'GK'
  | 'RB'
  | 'CB'
  | 'LB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'RM'
  | 'LM'
  | 'RW'
  | 'LW'
  | 'ST';

/** Which broad position family each role belongs to. */
export const ROLE_FAMILY: Record<Role, Position> = {
  GK: 'GK',
  RB: 'DEF',
  CB: 'DEF',
  LB: 'DEF',
  CDM: 'MID',
  CM: 'MID',
  CAM: 'MID',
  RM: 'MID',
  LM: 'MID',
  RW: 'FWD',
  LW: 'FWD',
  ST: 'FWD',
};

export interface Player {
  id: string;
  name: string;
  club: string;
  season: string;
  position: Position;
  /** Preferred role — attached at load time from the role map. */
  role?: Role;
  /** Overall ability, 60-99. */
  rating: number;
  /** Current age — set by the aging module in dynasty mode. */
  age?: number;
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
  /** The 11 specific role slots, GK first then defence → attack. */
  roleSlots: Role[];
  /** Count of slots per position family (derived from roleSlots). */
  slots: Record<Position, number>;
}

export interface DraftPick {
  player: Player;
  wheelLanding: { club: string; season: string };
  /** Index into formation.roleSlots this player fills (undefined for bench). */
  slotIndex?: number;
  /** The role of that slot. */
  assignedRole?: Role;
  /** Rating reduction for playing out of their preferred role (0 = perfect fit). */
  rolePenalty?: number;
  /** Dynasty season the player was drafted in (1 = initial draft). Drives aging. */
  draftedInSeason?: number;
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

export type SeasonDifficulty = 'easy' | 'normal' | 'hard' | 'legendary';

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
  /** Dynasty season number (1 = freshly drafted squad). */
  seasonNumber?: number;
  /** Difficulty the season was simulated at. */
  difficulty?: SeasonDifficulty;
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
