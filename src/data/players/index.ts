import type { Player } from '@/types/draft';
import iconic from './iconic.json';
import additional from './additional.json';

// Dedupe by id so accidental overlaps between files don't double-count.
const _seenIds = new Set<string>();
const _allRaw: Player[] = [...(iconic as Player[]), ...(additional as Player[])];
export const ALL_PLAYERS: Player[] = _allRaw.filter((p) => {
  if (_seenIds.has(p.id)) return false;
  _seenIds.add(p.id);
  return true;
});

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

/** Unique (club, season) pairs available in the database. */
export function uniqueClubSeasons(pool: Player[] = ALL_PLAYERS): Array<{ club: string; season: string }> {
  const seen = new Set<string>();
  const out: Array<{ club: string; season: string }> = [];
  for (const p of pool) {
    const key = `${p.club} :: ${p.season}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ club: p.club, season: p.season });
  }
  return out;
}

if (import.meta.env?.DEV) {
  const ids = new Set<string>();
  for (const p of ALL_PLAYERS) {
    if (ids.has(p.id)) {
      // eslint-disable-next-line no-console
      console.warn(`[players] Duplicate id: ${p.id}`);
    }
    ids.add(p.id);
  }
  // eslint-disable-next-line no-console
  console.info(
    `[players] Loaded ${ALL_PLAYERS.length} player-seasons across ${uniqueClubSeasons().length} club-seasons`,
  );
}
