import type { RunSummary } from '@/store/profileStore';
import type { ProfileState } from '@/types/profile';

export interface AchievementCheck {
  id: string;
  /** Returns true if the achievement should fire for this run. */
  test: (run: RunSummary, profile: ProfileState) => boolean;
}

export const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
  {
    id: 'first-blood',
    test: (run) => run.perQuestion.some((q) => q.correct),
  },
  {
    id: 'perfect-quick-play',
    test: (run) => run.modeId === 'quick-play' && run.total >= 10 && run.correct === run.total,
  },
  {
    id: 'streak-10',
    test: (run) => run.bestStreak >= 10,
  },
  {
    id: 'survival-15',
    test: (run) => run.modeId === 'survival' && run.bestStreak >= 15,
  },
  {
    id: 'survival-30',
    test: (run) => run.modeId === 'survival' && run.bestStreak >= 30,
  },
  {
    id: 'transfer-guru',
    test: (run) => {
      const transfers = run.perQuestion.filter((q) => q.category === 'transfers');
      return transfers.length >= 3 && transfers.every((q) => q.correct);
    },
  },
  {
    id: 'ucl-historian',
    test: (run) => {
      const ucl = run.perQuestion.filter((q) => q.category === 'champions-league' && (q.difficulty === 'hard' || q.difficulty === 'legendary'));
      return ucl.length >= 2 && ucl.every((q) => q.correct);
    },
  },
  {
    id: 'level-10',
    test: (_run, profile) => profile.level >= 10,
  },
  {
    id: 'level-25',
    test: (_run, profile) => profile.level >= 25,
  },
  {
    id: 'career-tier-3',
    test: (_run, profile) => profile.careerTierUnlocked > 3,
  },
  {
    id: 'career-tier-6',
    test: (_run, profile) => profile.careerTierUnlocked > 6,
  },
  {
    id: 'daily-streak-7',
    test: (_run, profile) => profile.stats.dailyStreak >= 7,
  },
];

export function checkAchievements(run: RunSummary, profile: ProfileState): string[] {
  const fired: string[] = [];
  for (const check of ACHIEVEMENT_CHECKS) {
    if (profile.unlockedAchievements.includes(check.id)) continue;
    if (check.test(run, profile)) fired.push(check.id);
  }
  return fired;
}
