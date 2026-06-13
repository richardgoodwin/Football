export function formatScore(n: number): string {
  return n.toLocaleString('en-GB');
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 21 → "21st", etc. */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
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
