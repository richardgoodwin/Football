import { describe, it, expect } from 'vitest';
import { applyFilters, pickQuestions, survivalDifficultyForStep } from '@/game/difficulty';
import { ALL_QUESTIONS } from '@/data/questions';

describe('applyFilters', () => {
  it('filters by difficulty', () => {
    const easy = applyFilters(ALL_QUESTIONS, { difficulties: ['easy'] });
    expect(easy.length).toBeGreaterThan(0);
    expect(easy.every((q) => q.difficulty === 'easy')).toBe(true);
  });

  it('filters by category', () => {
    const ucl = applyFilters(ALL_QUESTIONS, { categories: ['champions-league'] });
    expect(ucl.length).toBeGreaterThan(0);
    expect(ucl.every((q) => q.category === 'champions-league')).toBe(true);
  });
});

describe('pickQuestions', () => {
  it('returns at most N questions', () => {
    const picked = pickQuestions(ALL_QUESTIONS, 5);
    expect(picked.length).toBe(5);
  });

  it('returns no duplicate ids', () => {
    const picked = pickQuestions(ALL_QUESTIONS, 10);
    const ids = new Set(picked.map((q) => q.id));
    expect(ids.size).toBe(picked.length);
  });
});

describe('survivalDifficultyForStep', () => {
  it('ramps from easy to legendary', () => {
    expect(survivalDifficultyForStep(0)).toBe('easy');
    expect(survivalDifficultyForStep(4)).toBe('easy');
    expect(survivalDifficultyForStep(5)).toBe('medium');
    expect(survivalDifficultyForStep(12)).toBe('hard');
    expect(survivalDifficultyForStep(22)).toBe('legendary');
  });
});
