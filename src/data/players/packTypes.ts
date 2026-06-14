import type { Role } from '@/types/draft';

/**
 * Compact squad-pack format. A player is a 4-field tuple:
 *   [name, role, rating, birthYear]
 * Position is derived from the role at load time, and the id is generated
 * from name + club + season. This keeps each squad terse so the database can
 * scale to hundreds of teams without thousands of lines of verbose JSON.
 */
export type PackPlayer = readonly [name: string, role: Role, rating: number, birthYear: number];

export interface SquadPack {
  club: string;
  season: string;
  players: readonly PackPlayer[];
}
