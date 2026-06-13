import type { Formation, FormationId, Position, Role } from '@/types/draft';
import { ROLE_FAMILY } from '@/types/draft';

function familyCounts(roleSlots: Role[]): Record<Position, number> {
  const counts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const role of roleSlots) counts[ROLE_FAMILY[role]]++;
  return counts;
}

function formation(id: FormationId, roleSlots: Role[]): Formation {
  return { id, label: id, roleSlots, slots: familyCounts(roleSlots) };
}

export const FORMATIONS: Record<FormationId, Formation> = {
  '4-4-2': formation('4-4-2', ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST']),
  '4-3-3': formation('4-3-3', ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'ST', 'LW']),
  '3-5-2': formation('3-5-2', ['GK', 'CB', 'CB', 'CB', 'RM', 'CDM', 'CM', 'CAM', 'LM', 'ST', 'ST']),
  '4-2-3-1': formation('4-2-3-1', ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'RW', 'CAM', 'LW', 'ST']),
};

export const FORMATION_LIST: Formation[] = Object.values(FORMATIONS);

/** Maximum picks allowed from any single club, to encourage variety. */
export const MAX_PICKS_PER_CLUB = 3;
