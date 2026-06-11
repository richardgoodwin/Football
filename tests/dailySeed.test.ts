import { describe, it, expect } from 'vitest';
import { buildDailyChallenge } from '@/game/dailySeed';
import { ALL_QUESTIONS } from '@/data/questions';

describe('buildDailyChallenge', () => {
  it('is deterministic for the same date', () => {
    const date = new Date('2026-05-21T12:00:00Z');
    const a = buildDailyChallenge(ALL_QUESTIONS, date);
    const b = buildDailyChallenge(ALL_QUESTIONS, date);
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
    expect(a.date).toBe('2026-05-21');
  });

  it('produces different questions on different dates', () => {
    const a = buildDailyChallenge(ALL_QUESTIONS, new Date('2026-05-21T00:00:00Z'));
    const b = buildDailyChallenge(ALL_QUESTIONS, new Date('2026-05-22T00:00:00Z'));
    // At least one question should differ between adjacent days.
    const aIds = a.questions.map((q) => q.id).join(',');
    const bIds = b.questions.map((q) => q.id).join(',');
    expect(aIds).not.toBe(bIds);
  });

  it('builds at most DAILY_QUESTION_COUNT questions', () => {
    const a = buildDailyChallenge(ALL_QUESTIONS);
    expect(a.questions.length).toBeLessThanOrEqual(7);
    expect(a.questions.length).toBeGreaterThan(0);
  });
});
