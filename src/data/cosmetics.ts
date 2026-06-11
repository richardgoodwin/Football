import type { Cosmetic } from '@/types/cosmetic';
import data from './cosmetics.json';

export const ALL_COSMETICS: Cosmetic[] = data as Cosmetic[];

export function getCosmetic(id: string): Cosmetic | undefined {
  return ALL_COSMETICS.find((c) => c.id === id);
}

export function cosmeticsOfType(type: Cosmetic['type']): Cosmetic[] {
  return ALL_COSMETICS.filter((c) => c.type === type);
}
