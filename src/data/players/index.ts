import type { Player } from '@/types/draft';
import iconic from './iconic.json';
import additional from './additional.json';
import squadDepth from './squad-depth.json';
import { DEFAULT_ROLE_BY_POSITION, PLAYER_ROLES } from '@/game/draft/roles';

// Curated files load first so they win any de-duplication. We drop both exact
// id collisions and the same player appearing twice in one club-season (by
// name) — squad-depth deliberately over-provisions and may re-list a starter.
const _seenIds = new Set<string>();
const _seenPlayers = new Set<string>();
const _allRaw: Player[] = [
  ...(iconic as Player[]),
  ...(additional as Player[]),
  ...(squadDepth as Player[]),
];
export const ALL_PLAYERS: Player[] = _allRaw
  .filter((p) => {
    const nameKey = `${p.name}|${p.club}|${p.season}`;
    if (_seenIds.has(p.id) || _seenPlayers.has(nameKey)) return false;
    _seenIds.add(p.id);
    _seenPlayers.add(nameKey);
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
