import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DraftPick, FormationId, SeasonDifficulty, SeasonResult } from '@/types/draft';
import { FORMATIONS } from '@/game/draft/constraints';

interface DraftStore {
  /** Formation chosen for the active draft (null = no active draft). */
  formationId: FormationId | null;
  /** Picks made in the active draft. */
  picks: DraftPick[];
  /** Respins left in the active draft. */
  respinsRemaining: number;
  /** Most recent simulated season (null until first sim). */
  lastResult: SeasonResult | null;
  /** Dynasty season counter: 1 = first season with this squad, +1 per continue. */
  dynastySeason: number;
  /** Difficulty for season simulations. */
  difficulty: SeasonDifficulty;
  /** Lifetime stats — sync layer will pick these up via existing max-of merge. */
  totalAttempts: number;
  bestPoints: number;
  perfectSeasons: number;

  startDraft: (formationId: FormationId) => void;
  addPick: (pick: DraftPick) => void;
  consumeRespin: () => void;
  clearDraft: () => void;
  setLastResult: (result: SeasonResult) => void;
  recordAttempt: (result: SeasonResult) => void;
  /** Advance the dynasty to the next season (squad ages one year). */
  continueDynasty: () => void;
  setDifficulty: (difficulty: SeasonDifficulty) => void;
}

export const useDraft = create<DraftStore>()(
  persist(
    (set) => ({
      formationId: null,
      picks: [],
      respinsRemaining: 1,
      lastResult: null,
      dynastySeason: 1,
      difficulty: 'normal',
      totalAttempts: 0,
      bestPoints: 0,
      perfectSeasons: 0,

      startDraft: (formationId) =>
        set({
          formationId,
          picks: [],
          respinsRemaining: 1,
          dynastySeason: 1,
        }),

      addPick: (pick) =>
        set((s) => ({
          picks: [...s.picks, pick],
        })),

      consumeRespin: () =>
        set((s) => ({ respinsRemaining: Math.max(0, s.respinsRemaining - 1) })),

      clearDraft: () =>
        set({ formationId: null, picks: [], respinsRemaining: 1, dynastySeason: 1 }),

      setLastResult: (result) => set({ lastResult: result }),

      recordAttempt: (result) =>
        set((s) => ({
          lastResult: result,
          totalAttempts: s.totalAttempts + 1,
          bestPoints: Math.max(s.bestPoints, result.points),
          perfectSeasons: s.perfectSeasons + (result.perfect ? 1 : 0),
        })),

      continueDynasty: () =>
        set((s) => ({ dynastySeason: s.dynastySeason + 1 })),

      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    {
      name: 'fq:v1:draft',
      version: 2,
      // v2 added role-slot picks; in-progress v1 drafts lack slotIndex, so drop them.
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return {
            ...state,
            formationId: null,
            picks: [],
            respinsRemaining: 1,
            dynastySeason: 1,
            difficulty: 'normal',
          };
        }
        return state;
      },
      partialize: (s) => ({
        formationId: s.formationId,
        picks: s.picks,
        respinsRemaining: s.respinsRemaining,
        lastResult: s.lastResult,
        dynastySeason: s.dynastySeason,
        difficulty: s.difficulty,
        totalAttempts: s.totalAttempts,
        bestPoints: s.bestPoints,
        perfectSeasons: s.perfectSeasons,
      }),
    },
  ),
);

/** Rebuild a transient DraftState (with Set) from the persisted store. */
export function deriveDraftState(store: ReturnType<typeof useDraft.getState>) {
  const formation = store.formationId ? FORMATIONS[store.formationId] : null;
  if (!formation) return null;
  const pickedPlayerIds = new Set(store.picks.map((p) => p.player.id));
  const picksByClub: Record<string, number> = {};
  for (const p of store.picks) {
    picksByClub[p.player.club] = (picksByClub[p.player.club] ?? 0) + 1;
  }
  return {
    formation,
    picks: store.picks,
    pickedPlayerIds,
    picksByClub,
    respinsRemaining: store.respinsRemaining,
  };
}
