import type { Player } from '@/types/draft';
import { ROLE_FAMILY } from '@/types/draft';
import type { SquadPack } from './packTypes';
import { packs as packs90s } from './packs/era-1990s';
import { packs as packs00s } from './packs/era-2000s';
import { packs as packs10s } from './packs/era-2010s';
import { packs as packs20s } from './packs/era-2020s';

const DIACRITICS = /[̀-ͯ]/g;

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const ALL_PACKS: readonly SquadPack[] = [...packs90s, ...packs00s, ...packs10s, ...packs20s];

/** Expanded player rows from every compact squad pack. */
export const PACK_PLAYERS: Player[] = ALL_PACKS.flatMap((pack) => {
  const seasonSlug = pack.season.replace('/', '-');
  return pack.players.map(([name, role, rating, birthYear]) => ({
    id: `p-${slug(name)}-${slug(pack.club)}-${seasonSlug}`,
    name,
    club: pack.club,
    season: pack.season,
    position: ROLE_FAMILY[role],
    role,
    rating,
    birthYear,
  }));
});
