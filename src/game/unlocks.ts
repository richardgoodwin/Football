import type { Cosmetic } from '@/types/cosmetic';
import type { ProfileState } from '@/types/profile';

export function isUnlocked(cosmetic: Cosmetic, profile: ProfileState): boolean {
  switch (cosmetic.unlock.kind) {
    case 'default':
      return true;
    case 'level':
      return profile.level >= cosmetic.unlock.value;
    case 'achievement':
      return profile.unlockedAchievements.includes(cosmetic.unlock.value);
    case 'career-tier':
      return profile.careerTierUnlocked > cosmetic.unlock.value;
    case 'daily-streak':
      return profile.stats.dailyStreak >= cosmetic.unlock.value;
  }
}

export function unlockRequirementText(cosmetic: Cosmetic): string {
  switch (cosmetic.unlock.kind) {
    case 'default':
      return 'Unlocked';
    case 'level':
      return `Reach level ${cosmetic.unlock.value}`;
    case 'achievement':
      return `Earn achievement: ${cosmetic.unlock.value}`;
    case 'career-tier':
      return `Complete Career tier ${cosmetic.unlock.value}`;
    case 'daily-streak':
      return `Daily streak of ${cosmetic.unlock.value}`;
  }
}
