import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DailyStore {
  /** Most recent daily attempt: { date: 'YYYY-MM-DD', score, correctCount } */
  lastAttempt: { date: string; score: number; correctCount: number } | null;
  recordAttempt: (date: string, score: number, correctCount: number) => void;
  hasPlayedToday: (todayDateKey: string) => boolean;
}

export const useDaily = create<DailyStore>()(
  persist(
    (set, get) => ({
      lastAttempt: null,
      recordAttempt: (date, score, correctCount) => set({ lastAttempt: { date, score, correctCount } }),
      hasPlayedToday: (todayDateKey) => get().lastAttempt?.date === todayDateKey,
    }),
    { name: 'fq:v1:daily', version: 1 },
  ),
);
