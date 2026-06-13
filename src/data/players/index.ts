import type { Player } from '@/types/draft';
import iconic from './iconic.json';
import additional from './additional.json';
import { DEFAULT_ROLE_BY_POSITION, PLAYER_ROLES } from '@/game/draft/roles';

// Dedupe by id so accidental overlaps between files don't double-count,
// and attach each player's preferred role from the role map.
const _seenIds = new Set<string>();
const _allRaw: Player[] = [...(iconic as Player[]), ...(additional as Player[])];
export const ALL_PLAYERS: Player[] = _allRaw
  .filter((p) => {
    if (_seenIds.has(p.id)) return false;
    _seenIds.add(p.id);
    return true;
  })
  .map((p) => ({
    ...p,
    role: p.role ?? PLAYER_ROLES[p.name] ?? DEFAULT_ROLE_BY_POSITION[p.position],
  }));

/** Map of `${club} :: ${season}` → players in that club/season. */
export function playersByClubSeason(pool: Player[] = ALL_PLAYERS): Map<string, Player[]> {
  const out = new Map<string, Player[]>();
  for (const p of pool) {
    const key = `${p.club} :: ${p.season}`;
    const arr = out.get(key) ?? [];
    arr.push(p);
    out.set(key, arr);
  }
  return out;
}

/** Unique (club, season) pairs available in the database, optionally
 *  filtered to those that have at least `minPlayers` entries. The wheel uses
 *  a non-trivial minimum so every landing offers a real draft choice — slots
 *  with only one or two players don't make for an interesting pick. */
export function uniqueClubSeasons(
  pool: Player[] = ALL_PLAYERS,
  minPlayers = 1,
): Array<{ club: string; season: string }> {
  const counts = new Map<string, number>();
  for (const p of pool) {
    const key = `${p.club} :: ${p.season}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const seen = new Set<string>();
  const out: Array<{ club: string; season: string }> = [];
  for (const p of pool) {
    const key = `${p.club} :: ${p.season}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if ((counts.get(key) ?? 0) < minPlayers) continue;
    out.push({ club: p.club, season: p.season });
  }
  return out;
}

/**
 * Minimum players a club-season must have to appear on the wheel. Set to a
 * full XI so every landing shows a complete team to draft from.
 */
export const WHEEL_MIN_PLAYERS = 11;

if (import.meta.env?.DEV) {
  const ids = new Set<string>();
  for (const p of ALL_PLAYERS) {
    if (ids.has(p.id)) {
      // eslint-disable-next-line no-console
      console.warn(`[players] Duplicate id: ${p.id}`);
    }
    ids.add(p.id);
  }
  const counts = new Map<string, number>();
  for (const p of ALL_PLAYERS) {
    const key = `${p.club} :: ${p.season}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const partial = [...counts.entries()].filter(([, n]) => n > 1 && n < WHEEL_MIN_PLAYERS);
  if (partial.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[players] Partial club-seasons (>1 but <full XI, hidden from wheel):',
      partial.map(([k, n]) => `${k} (${n})`),
    );
  }
  // eslint-disable-next-line no-console
  console.info(
    `[players] Loaded ${ALL_PLAYERS.length} player-seasons · ${
      uniqueClubSeasons(ALL_PLAYERS, WHEEL_MIN_PLAYERS).length
    } full squads on the wheel`,
  );
}
