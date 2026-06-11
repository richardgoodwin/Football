import { describe, it, expect } from 'vitest';
import {
  createEngineState,
  startEngine,
  submitAnswer,
  currentQuestion,
} from '@/game/engine';
import type { MultipleChoiceQ } from '@/types/question';

function q(id: string, difficulty: MultipleChoiceQ['difficulty'] = 'easy'): MultipleChoiceQ {
  return {
    id,
    format: 'multiple-choice',
    category: 'premier-league',
    difficulty,
    yearStart: 2020,
    yearEnd: 2020,
    tags: [],
    prompt: 'Test',
    correct: 'A',
    distractors: ['B', 'C', 'D'],
    explanation: '',
  };
}

describe('engine', () => {
  it('runs through a fixed sequence and finishes', () => {
    const cfg = { questions: [q('1'), q('2'), q('3')], perQuestionMs: 10_000, lives: 3 };
    let s = startEngine(createEngineState(cfg));
    expect(s.status).toBe('running');
    expect(currentQuestion(s)?.id).toBe('1');

    s = submitAnswer(s, cfg, true, 8000).state;
    s = submitAnswer(s, cfg, false, 5000).state;
    s = submitAnswer(s, cfg, true, 1000).state;

    expect(s.status).toBe('finished');
    expect(s.answered).toHaveLength(3);
    expect(s.score).toBeGreaterThan(0);
  });

  it('ends immediately on first wrong when endOnFirstWrong is true', () => {
    const cfg = {
      questions: [q('1'), q('2'), q('3')],
      perQuestionMs: 10_000,
      lives: 1,
      endOnFirstWrong: true,
    };
    let s = startEngine(createEngineState(cfg));
    s = submitAnswer(s, cfg, true, 9000).state;
    expect(s.status).toBe('running');
    s = submitAnswer(s, cfg, false, 9000).state;
    expect(s.status).toBe('finished');
    expect(s.answered).toHaveLength(2);
  });

  it('tracks best streak across the run', () => {
    const cfg = { questions: [q('1'), q('2'), q('3'), q('4')], perQuestionMs: 10_000, lives: 4 };
    let s = startEngine(createEngineState(cfg));
    s = submitAnswer(s, cfg, true, 8000).state;
    s = submitAnswer(s, cfg, true, 8000).state;
    s = submitAnswer(s, cfg, false, 5000).state;
    s = submitAnswer(s, cfg, true, 8000).state;
    expect(s.bestStreak).toBe(2);
    expect(s.streak).toBe(1);
  });
});
