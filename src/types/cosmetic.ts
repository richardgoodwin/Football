export type CosmeticType =
  | 'avatar'
  | 'stadium-theme'
  | 'badge-frame'
  | 'quiz-effect'
  | 'sound-pack';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type UnlockCondition =
  | { kind: 'level'; value: number }
  | { kind: 'achievement'; value: string }
  | { kind: 'career-tier'; value: number }
  | { kind: 'daily-streak'; value: number }
  | { kind: 'default' };

export interface Cosmetic {
  id: string;
  name: string;
  type: CosmeticType;
  rarity: Rarity;
  unlock: UnlockCondition;
  description: string;
  preview?: string;
  themeTokens?: {
    accent?: string;
    bgFrom?: string;
    bgTo?: string;
  };
}
