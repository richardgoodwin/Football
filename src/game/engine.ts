import type { Question } from '@/types/question';
import { scoreCorrect, type ScoreResult } from './scoring';

export type EngineStatus = 'idle' | 'running' | 'finished';

export interface EngineConfig {
  questions: Question[];
  /** Per-question time in ms. */
  perQuestionMs: number;
  /** Number of lives (1+). Wrong answer = -1. 0 = game over. */
  lives: number;
  /** If true, no advance after wrong — game ends immediately (Survival). */
  endOnFirstWrong?: boolean;
  /** Optional cap on questions; default = questions.length, but pools that re-fill may pass Infinity. */
  maxQuestions?: number;
}

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  score: number;
  timeTakenMs: number;
}

export interface EngineState {
  status: EngineStatus;
  questions: Question[];
  index: number;
  score: number;
  streak: number;
  bestStreak: number;
  lives: number;
  answered: AnswerRecord[];
}

export function createEngineState(config: EngineConfig): EngineState {
  return {
    status: 'idle',
    questions: config.questions,
    index: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: config.lives,
    answered: [],
  };
}

export interface AnswerOutcome {
  state: EngineState;
  correct: boolean;
  score: ScoreResult | null;
  finished: boolean;
}

export function submitAnswer(
  state: EngineState,
  config: EngineConfig,
  correct: boolean,
  timeRemainingMs: number,
): AnswerOutcome {
  if (state.status === 'finished') {
    return { state, correct, score: null, finished: true };
  }

  const q = state.questions[state.index];
  if (!q) {
    return { state: { ...state, status: 'finished' }, correct, score: null, finished: true };
  }

  let newScore = state.score;
  let scoreResult: ScoreResult | null = null;
  let newStreak = state.streak;
  let newLives = state.lives;
  const newAnswered = [...state.answered];

  if (correct) {
    scoreResult = scoreCorrect({
      difficulty: q.difficulty,
      timeRemainingMs,
      totalTimeMs: config.perQuestionMs,
      streakBefore: state.streak,
    });
    newScore += scoreResult.total;
    newStreak += 1;
  } else {
    newStreak = 0;
    newLives = Math.max(0, newLives - 1);
  }

  newAnswered.push({
    questionId: q.id,
    correct,
    score: scoreResult?.total ?? 0,
    timeTakenMs: Math.max(0, config.perQuestionMs - timeRemainingMs),
  });

  const cap = config.maxQuestions ?? state.questions.length;
  const ranOutOfLives = newLives <= 0;
  const hitWrongStop = !correct && config.endOnFirstWrong === true;
  const nextIndex = state.index + 1;
  const exhausted = nextIndex >= cap || nextIndex >= state.questions.length;
  const finished = hitWrongStop || ranOutOfLives || exhausted;

  return {
    state: {
      status: finished ? 'finished' : 'running',
      questions: state.questions,
      index: nextIndex,
      score: newScore,
      streak: newStreak,
      bestStreak: Math.max(state.bestStreak, newStreak),
      lives: newLives,
      answered: newAnswered,
    },
    correct,
    score: scoreResult,
    finished,
  };
}

export function startEngine(state: EngineState): EngineState {
  return { ...state, status: 'running' };
}

export function currentQuestion(state: EngineState): Question | null {
  return state.questions[state.index] ?? null;
}
