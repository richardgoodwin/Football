import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DraftPick, FormationId, SeasonDifficulty, SeasonResult } from '@/types/draft';
import { FORMATIONS } from '@/game/draft/constraints';
import { playerRole, rolePenalty } from '@/game/draft/roles';
import { isRetired } from '@/game/draft/aging';

export const BENCH_SIZE = 5;

interface DraftStore {
  /** Formation chosen for the active draft (null = no active draft). */
  formationId: FormationId | null;
  /** The starting XI. */
  picks: DraftPick[];
  /** The substitutes bench (up to BENCH_SIZE). */
  bench: DraftPick[];
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
  addBenchPick: (pick: DraftPick) => void;
  swapWithBench: (slotIndex: number, benchPlayerId: string) => void;
  clearDraft: () => void;
  setLastResult: (result: SeasonResult) => void;
  recordAttempt: (result: SeasonResult) => void;
  /** Advance the dynasty to the next season (squad ages one year). */
  continueDynasty: () => void;
  /** Remove retired players from XI + bench at the current season. Returns the removed picks. */
  applyRetirements: () => DraftPick[];
  setDifficulty: (difficulty: SeasonDifficulty) => void;
}

export const useDraft = create<DraftStore>()(
  persist(
    (set, get) => ({
      formationId: null,
      picks: [],
      bench: [],
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
          bench: [],
          dynastySeason: 1,
        }),

      addPick: (pick) =>
        set((s) => ({
          picks: [...s.picks, { ...pick, draftedInSeason: pick.draftedInSeason ?? s.dynastySeason }],
        })),

      addBenchPick: (pick) =>
        set((s) => {
          if (s.bench.length >= BENCH_SIZE) return s;
          // Bench players carry no slot assignment until swapped in.
          const benchPick: DraftPick = {
            ...pick,
            slotIndex: undefined,
            assignedRole: undefined,
            rolePenalty: undefined,
            draftedInSeason: pick.draftedInSeason ?? s.dynastySeason,
          };
          return { bench: [...s.bench, benchPick] };
        }),

      swapWithBench: (slotIndex, benchPlayerId) =>
        set((s) => {
          if (!s.formationId) return s;
          const formation = FORMATIONS[s.formationId];
          const xiIdx = s.picks.findIndex((p) => p.slotIndex === slotIndex);
          const benchIdx = s.bench.findIndex((p) => p.player.id === benchPlayerId);
          if (xiIdx < 0 || benchIdx < 0) return s;

          const xiPick = s.picks[xiIdx];
          const benchPick = s.bench[benchIdx];
          const slotRole = formation.roleSlots[slotIndex];

          // Bench player moves into the XI slot, taking its role + penalty.
          const newXiPick: DraftPick = {
            ...benchPick,
            slotIndex,
            assignedRole: slotRole,
            rolePenalty: rolePenalty(playerRole(benchPick.player), slotRole),
          };
          // The replaced XI player drops to the bench (slot cleared).
          const newBenchPick: DraftPick = {
            ...xiPick,
            slotIndex: undefined,
            assignedRole: undefined,
            rolePenalty: undefined,
          };

          const picks = [...s.picks];
          picks[xiIdx] = newXiPick;
          const bench = [...s.bench];
          bench[benchIdx] = newBenchPick;
          return { picks, bench };
        }),

      clearDraft: () =>
        set({ formationId: null, picks: [], bench: [], dynastySeason: 1 }),

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

      applyRetirements: () => {
        const s = get();
        const season = s.dynastySeason;
        const retired = [
          ...s.picks.filter((p) => isRetired(p, season)),
          ...s.bench.filter((p) => isRetired(p, season)),
        ];
        if (retired.length === 0) return [];
        set({
          picks: s.picks.filter((p) => !isRetired(p, season)),
          bench: s.bench.filter((p) => !isRetired(p, season)),
        });
        return retired;
      },

      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    {
      name: 'fq:v1:draft',
      version: 3,
      // v2 added role slots, v3 added the bench. In-progress older drafts are
      // structurally incompatible, so reset the active draft (stats are kept).
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 3) {
          return {
            ...state,
            formationId: null,
            picks: [],
            bench: [],
            dynastySeason: 1,
            difficulty: state.difficulty ?? 'normal',
          };
        }
        return state;
      },
      partialize: (s) => ({
        formationId: s.formationId,
        picks: s.picks,
        bench: s.bench,
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
  // Track XI + bench together so eligibility and club caps span the whole squad.
  const all = [...store.picks, ...store.bench];
  const pickedPlayerIds = new Set(all.map((p) => p.player.id));
  const picksByClub: Record<string, number> = {};
  for (const p of all) {
    picksByClub[p.player.club] = (picksByClub[p.player.club] ?? 0) + 1;
  }
  return {
    formation,
    picks: store.picks,
    pickedPlayerIds,
    picksByClub,
    respinsRemaining: 0,
  };
}
