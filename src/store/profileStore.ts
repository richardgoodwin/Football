import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfileState } from '@/types/profile';
import type { Category, Difficulty } from '@/types/question';
import { levelFromXp, xpFromScore } from '@/game/scoring';

const initialProfile: ProfileState = {
  displayName: 'Player',
  xp: 0,
  level: 1,
  prestige: 0,
  ownedCosmetics: ['avatar-default', 'theme-default'],
  equipped: {
    avatar: 'avatar-default',
    theme: 'theme-default',
    badgeFrame: null,
    quizEffect: null,
    soundPack: null,
  },
  unlockedAchievements: [],
  careerTierUnlocked: 1,
  stats: {
    totalAnswered: 0,
    totalCorrect: 0,
    bestSurvivalStreak: 0,
    dailyStreak: 0,
    lastDailyDate: null,
    perCategory: {},
    perDifficulty: {},
    runsCompleted: 0,
    perfectRuns: 0,
  },
};

export interface RunSummary {
  modeId: string;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  perQuestion: Array<{ category: Category; difficulty: Difficulty; correct: boolean }>;
  perfect: boolean;
}

interface ProfileStore extends ProfileState {
  setDisplayName: (name: string) => void;
  applyRun: (summary: RunSummary) => { xpGained: number; levelUps: number; newLevel: number };
  unlockCosmetic: (id: string) => void;
  equip: (slot: keyof ProfileState['equipped'], id: string | null) => void;
  unlockAchievement: (id: string) => boolean;
  unlockCareerTier: (id: number) => void;
  markDaily: (dateIso: string, completedCorrect: boolean) => void;
  reset: () => void;
}

export const useProfile = create<ProfileStore>()(
  persist(
    (set, get) => ({
      ...initialProfile,

      setDisplayName: (name) => set({ displayName: name.slice(0, 20) || 'Player' }),

      applyRun: (summary) => {
        const state = get();
        const xpGained = xpFromScore(summary.score);
        const newXp = state.xp + xpGained;
        const newLevel = levelFromXp(newXp);
        const levelUps = newLevel - state.level;

        const perCategory = { ...state.stats.perCategory };
        const perDifficulty = { ...state.stats.perDifficulty };
        for (const q of summary.perQuestion) {
          const c = perCategory[q.category] ?? { answered: 0, correct: 0 };
          perCategory[q.category] = { answered: c.answered + 1, correct: c.correct + (q.correct ? 1 : 0) };
          const d = perDifficulty[q.difficulty] ?? { answered: 0, correct: 0 };
          perDifficulty[q.difficulty] = { answered: d.answered + 1, correct: d.correct + (q.correct ? 1 : 0) };
        }

        set({
          xp: newXp,
          level: newLevel,
          stats: {
            ...state.stats,
            totalAnswered: state.stats.totalAnswered + summary.total,
            totalCorrect: state.stats.totalCorrect + summary.correct,
            bestSurvivalStreak:
              summary.modeId === 'survival'
                ? Math.max(state.stats.bestSurvivalStreak, summary.bestStreak)
                : state.stats.bestSurvivalStreak,
            perCategory,
            perDifficulty,
            runsCompleted: state.stats.runsCompleted + 1,
            perfectRuns: state.stats.perfectRuns + (summary.perfect ? 1 : 0),
          },
        });

        return { xpGained, levelUps, newLevel };
      },

      unlockCosmetic: (id) =>
        set((s) => (s.ownedCosmetics.includes(id) ? s : { ownedCosmetics: [...s.ownedCosmetics, id] })),

      equip: (slot, id) =>
        set((s) => ({ equipped: { ...s.equipped, [slot]: id } })),

      unlockAchievement: (id) => {
        const s = get();
        if (s.unlockedAchievements.includes(id)) return false;
        set({ unlockedAchievements: [...s.unlockedAchievements, id] });
        return true;
      },

      unlockCareerTier: (id) =>
        set((s) => ({ careerTierUnlocked: Math.max(s.careerTierUnlocked, id) })),

      markDaily: (dateIso, completedCorrect) =>
        set((s) => {
          const last = s.stats.lastDailyDate;
          // Check if previous date is exactly the day before (UTC).
          const isConsecutive = (() => {
            if (!last) return false;
            const prev = new Date(last + 'T00:00:00Z').getTime();
            const today = new Date(dateIso + 'T00:00:00Z').getTime();
            return today - prev === 86_400_000;
          })();
          return {
            stats: {
              ...s.stats,
              lastDailyDate: dateIso,
              dailyStreak: completedCorrect
                ? isConsecutive
                  ? s.stats.dailyStreak + 1
                  : 1
                : 0,
            },
          };
        }),

      reset: () => set({ ...initialProfile }),
    }),
    {
      name: 'fq:v1:profile',
      version: 1,
    },
  ),
);
