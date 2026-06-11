import type { Question } from '@/types/question';
import { pickQuestions } from '../difficulty';
import type { EngineConfig } from '../engine';

export interface PartyConfig {
  players: string[];
  roundsPerPlayer: number;
}

export interface PartyScore {
  player: string;
  score: number;
  correct: number;
}

export function buildPartyTurn(pool: Question[], roundsPerPlayer: number): EngineConfig {
  const questions = pickQuestions(pool, roundsPerPlayer, {
    difficulties: ['easy', 'medium', 'hard'],
  });
  return {
    questions,
    perQuestionMs: 15_000,
    lives: roundsPerPlayer,
    endOnFirstWrong: false,
  };
}
