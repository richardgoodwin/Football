import type { Question, Category, Difficulty } from '@/types/question';
import { pickQuestions } from '../difficulty';
import type { EngineConfig } from '../engine';

export interface CareerTier {
  id: number;
  name: string;
  description: string;
  requiredLevel: number;
  difficulties: Difficulty[];
  categories?: Category[];
  questionCount: number;
  perQuestionMs: number;
  reward: { xp: number; cosmeticId?: string };
}

export const CAREER_TIERS: CareerTier[] = [
  {
    id: 1,
    name: 'Amateur League',
    description: 'Get your boots dirty. Easy questions, plenty of room to learn.',
    requiredLevel: 1,
    difficulties: ['easy'],
    questionCount: 8,
    perQuestionMs: 18_000,
    reward: { xp: 200, cosmeticId: 'avatar-rookie' },
  },
  {
    id: 2,
    name: 'Semi-Pro Circuit',
    description: 'Step up. Mix of easy and medium across the big leagues.',
    requiredLevel: 3,
    difficulties: ['easy', 'medium'],
    questionCount: 10,
    perQuestionMs: 15_000,
    reward: { xp: 400, cosmeticId: 'badge-frame-bronze' },
  },
  {
    id: 3,
    name: 'Professional Tier',
    description: 'Medium difficulty only. No more freebies.',
    requiredLevel: 6,
    difficulties: ['medium'],
    questionCount: 12,
    perQuestionMs: 14_000,
    reward: { xp: 700, cosmeticId: 'theme-floodlight' },
  },
  {
    id: 4,
    name: 'Champions League',
    description: 'Hard questions. UCL and continental focus.',
    requiredLevel: 10,
    difficulties: ['medium', 'hard'],
    categories: ['champions-league', 'euros', 'legends'],
    questionCount: 12,
    perQuestionMs: 14_000,
    reward: { xp: 1200, cosmeticId: 'badge-frame-silver' },
  },
  {
    id: 5,
    name: 'International Tournament',
    description: 'World Cup, Euros, Copa America — the global stage.',
    requiredLevel: 15,
    difficulties: ['hard'],
    categories: ['world-cup', 'euros'],
    questionCount: 14,
    perQuestionMs: 13_000,
    reward: { xp: 1800, cosmeticId: 'theme-anfield-night' },
  },
  {
    id: 6,
    name: 'Legendary',
    description: 'Pure obscurity. Forgotten loan spells, Intertoto madness.',
    requiredLevel: 20,
    difficulties: ['legendary'],
    questionCount: 10,
    perQuestionMs: 15_000,
    reward: { xp: 3000, cosmeticId: 'badge-frame-gold' },
  },
];

export function buildCareerTier(pool: Question[], tier: CareerTier): EngineConfig {
  const questions = pickQuestions(pool, tier.questionCount, {
    difficulties: tier.difficulties,
    categories: tier.categories,
  });
  return {
    questions,
    perQuestionMs: tier.perQuestionMs,
    lives: tier.questionCount,
    endOnFirstWrong: false,
  };
}

export function tierById(id: number): CareerTier | undefined {
  return CAREER_TIERS.find((t) => t.id === id);
}
