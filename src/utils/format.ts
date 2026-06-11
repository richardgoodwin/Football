export function formatScore(n: number): string {
  return n.toLocaleString('en-GB');
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${s}s`;
}

export function normaliseAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lenient match for free-text answers ("guess the player"). */
export function fuzzyMatch(input: string, accepted: string[]): boolean {
  const n = normaliseAnswer(input);
  if (!n) return false;
  return accepted.some((a) => normaliseAnswer(a) === n);
}
