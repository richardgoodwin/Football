import type { TimelineQ } from '@/types/question';

/**
 * Returns true if the supplied ordering matches the canonical (sortKey ascending) order.
 */
export function checkTimelineOrder(q: TimelineQ, ordered: string[]): boolean {
  const expected = [...q.items].sort((a, b) => a.sortKey - b.sortKey).map((i) => i.label);
  if (ordered.length !== expected.length) return false;
  return ordered.every((label, idx) => label === expected[idx]);
}
