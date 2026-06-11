import { describe, it, expect } from 'vitest';
import {
  scoreCorrect,
  xpFromScore,
  xpForLevel,
  levelFromXp,
  BASE_POINTS,
} from '@/game/scoring';

describe('scoreCorrect', () => {
  it('returns base * difficulty * time * streak', () => {
    const res = scoreCorrect({
      difficulty: 'easy',
      timeRemainingMs: 10_000,
      totalTimeMs: 10_000,
      streakBefore: 0,
    });
    // 100 * 1.0 * 1.0 (full time bonus) * 1.0 (no streak) = 100
    expect(res.total).toBe(BASE_POINTS);
  });

  it('reduces score as the timer drains', () => {
    const fast = scoreCorrect({
      difficulty: 'medium',
      timeRemainingMs: 10_000,
      totalTimeMs: 10_000,
      streakBefore: 0,
    });
    const slow = scoreCorrect({
      difficulty: 'medium',
      timeRemainingMs: 0,
      totalTimeMs: 10_000,
      streakBefore: 0,
    });
    expect(fast.total).toBeGreaterThan(slow.total);
    // Even at zero time, 50% of base+difficulty remains.
    expect(slow.total).toBeGreaterThan(0);
  });

  it('caps the streak multiplier at 2x', () => {
    const ten = scoreCorrect({
      difficulty: 'easy',
      timeRemainingMs: 10_000,
      totalTimeMs: 10_000,
      streakBefore: 10,
    });
    const twenty = scoreCorrect({
      difficulty: 'easy',
      timeRemainingMs: 10_000,
      totalTimeMs: 10_000,
      streakBefore: 20,
    });
    expect(ten.total).toBe(twenty.total);
    expect(ten.streakBonus).toBeCloseTo(2);
  });

  it('rewards harder difficulties more', () => {
    const inputs = {
      timeRemainingMs: 10_000,
      totalTimeMs: 10_000,
      streakBefore: 0,
    } as const;
    const easy = scoreCorrect({ ...inputs, difficulty: 'easy' }).total;
    const medium = scoreCorrect({ ...inputs, difficulty: 'medium' }).total;
    const hard = scoreCorrect({ ...inputs, difficulty: 'hard' }).total;
    const legendary = scoreCorrect({ ...inputs, difficulty: 'legendary' }).total;
    expect(medium).toBeGreaterThan(easy);
    expect(hard).toBeGreaterThan(medium);
    expect(legendary).toBeGreaterThan(hard);
  });
});

describe('xp / level curves', () => {
  it('xpFromScore is score/10 rounded', () => {
    expect(xpFromScore(100)).toBe(10);
    expect(xpFromScore(255)).toBe(26);
  });

  it('levelFromXp inverts xpForLevel', () => {
    for (let lvl = 1; lvl < 30; lvl++) {
      const xp = xpForLevel(lvl);
      expect(levelFromXp(xp)).toBe(lvl);
    }
  });

  it('xpForLevel is monotonically increasing', () => {
    for (let lvl = 2; lvl < 50; lvl++) {
      expect(xpForLevel(lvl)).toBeGreaterThan(xpForLevel(lvl - 1));
    }
  });
});
