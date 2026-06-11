import type { Category, Difficulty } from './question';

export interface ProfileStats {
  totalAnswered: number;
  totalCorrect: number;
  bestSurvivalStreak: number;
  dailyStreak: number;
  lastDailyDate: string | null;
  perCategory: Partial<Record<Category, { answered: number; correct: number }>>;
  perDifficulty: Partial<Record<Difficulty, { answered: number; correct: number }>>;
  runsCompleted: number;
  perfectRuns: number;
}

export interface ProfileState {
  displayName: string;
  xp: number;
  level: number;
  prestige: number;
  ownedCosmetics: string[];
  equipped: {
    avatar: string | null;
    theme: string | null;
    badgeFrame: string | null;
    quizEffect: string | null;
    soundPack: string | null;
  };
  unlockedAchievements: string[];
  careerTierUnlocked: number;
  stats: ProfileStats;
}
