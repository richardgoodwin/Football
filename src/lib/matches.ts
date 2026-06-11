/**
 * Head-to-head matches. Supports two modes via a discriminator:
 *
 *  - `trivia`         — alternating Q&A, original mode.
 *  - `perfect-season` — both players draft an XI from a shared wheel sequence,
 *                       then their squads are simulated; higher points wins.
 *
 * Each match document is a snapshot — both clients see identical content even
 * if the underlying pools (questions or players) change later.
 *
 * Auto-forfeit: if `lastActionAt` is older than 7 days AND it's not your turn,
 * the waiting player can claim a forfeit win.
 */
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { MultipleChoiceQ, Question } from '@/types/question';
import { ALL_QUESTIONS } from '@/data/questions';
import { shuffle } from '@/utils/shuffle';
import { mulberry32 } from '@/utils/rng';
import { scoreCorrect } from '@/game/scoring';
import type { DraftPick, FormationId, SeasonResult } from '@/types/draft';
import { ALL_PLAYERS } from '@/data/players';
import { buildWheelSequence, type WheelLanding } from '@/game/draft/wheel';
import { simulateSeason } from '@/game/draft/simulation';
import { FORMATIONS } from '@/game/draft/constraints';

export type MatchMode = 'trivia' | 'perfect-season';
export type MatchStatus = 'pending' | 'in-progress' | 'completed' | 'declined' | 'cancelled';

export interface MatchAnswer {
  uid: string;
  questionId: string;
  correct: boolean;
  points: number;
  at: Timestamp;
}

interface BaseMatchDoc {
  id: string;
  mode: MatchMode;
  players: [string, string]; // [challenger, opponent]
  playerInfo: Record<string, { displayName: string }>;
  status: MatchStatus;
  createdBy: string;
  createdAt: Timestamp;
  lastActionAt: Timestamp;
  completedAt?: Timestamp;
  winnerUid?: string | 'tie';
}

export interface TriviaMatchDoc extends BaseMatchDoc {
  mode: 'trivia';
  questionsPerPlayer: number;
  questions: MultipleChoiceQ[];
  turnIndex: number;
  currentTurn: string;
  answers: Record<string, MatchAnswer>;
  scores: Record<string, number>;
}

export interface PerfectSeasonMatchDoc extends BaseMatchDoc {
  mode: 'perfect-season';
  formationId: FormationId;
  /** Deterministic wheel sequence (e.g. 22 landings = 11 each at most). */
  wheelSequence: WheelLanding[];
  /** Per-player picks. Each player picks 11 in total. */
  drafts: Record<string, DraftPick[]>;
  /** Seed used for the simulation so both clients agree. */
  simulationSeed: number;
  /** Populated when both drafts complete + simulations have been written. */
  seasonResults?: Record<string, SeasonResult>;
}

export type MatchDoc = TriviaMatchDoc | PerfectSeasonMatchDoc;

const FORFEIT_AFTER_DAYS = 7;
export const MATCH_FORFEIT_AFTER_MS = FORFEIT_AFTER_DAYS * 24 * 60 * 60 * 1000;

export const QUESTIONS_PER_PLAYER_OPTIONS = [3, 5, 7, 10] as const;

/** Normalize raw Firestore data — older docs may not have a `mode` field. */
function normalize(raw: Record<string, unknown>, id: string): MatchDoc {
  const mode = (raw.mode as MatchMode | undefined) ?? 'trivia';
  return { ...(raw as object), id, mode } as MatchDoc;
}

// ─── trivia helpers ────────────────────────────────────────────────────────

function pickMatchQuestions(count: number): MultipleChoiceQ[] {
  const pool = ALL_QUESTIONS.filter(
    (q): q is MultipleChoiceQ => q.format === 'multiple-choice',
  );
  return shuffle(pool).slice(0, count);
}

export async function createMatch(
  challenger: User,
  challengerDisplayName: string,
  opponentUid: string,
  opponentDisplayName: string,
  questionsPerPlayer: number,
): Promise<string> {
  if (!db) throw new Error('Database not available.');
  const totalQuestions = questionsPerPlayer * 2;
  const questions = pickMatchQuestions(totalQuestions);
  if (questions.length < totalQuestions) {
    throw new Error('Not enough questions available.');
  }

  const ref = await addDoc(collection(db, 'matches'), {
    mode: 'trivia',
    players: [challenger.uid, opponentUid],
    playerInfo: {
      [challenger.uid]: { displayName: challengerDisplayName },
      [opponentUid]: { displayName: opponentDisplayName },
    },
    questionsPerPlayer,
    questions,
    status: 'pending',
    turnIndex: 0,
    currentTurn: challenger.uid,
    answers: {},
    scores: { [challenger.uid]: 0, [opponentUid]: 0 },
    createdBy: challenger.uid,
    createdAt: serverTimestamp(),
    lastActionAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── perfect-season helpers ────────────────────────────────────────────────

/**
 * Create a Perfect Season head-to-head match. The wheel sequence is seeded
 * and stored on the doc so both players see the same (club, season) landings.
 *
 * We over-provision the wheel sequence (22 landings) so players have variety
 * — each player picks 11 entries from those 22.
 */
export async function createPerfectSeasonMatch(
  challenger: User,
  challengerDisplayName: string,
  opponentUid: string,
  opponentDisplayName: string,
  formationId: FormationId,
): Promise<string> {
  if (!db) throw new Error('Database not available.');
  const seed = Math.floor(Math.random() * 1_000_000);
  const wheelSequence = buildWheelSequence(mulberry32(seed), ALL_PLAYERS, 22);
  const simulationSeed = Math.floor(Math.random() * 1_000_000);

  const ref = await addDoc(collection(db, 'matches'), {
    mode: 'perfect-season',
    players: [challenger.uid, opponentUid],
    playerInfo: {
      [challenger.uid]: { displayName: challengerDisplayName },
      [opponentUid]: { displayName: opponentDisplayName },
    },
    formationId,
    wheelSequence,
    drafts: { [challenger.uid]: [], [opponentUid]: [] },
    simulationSeed,
    status: 'pending',
    createdBy: challenger.uid,
    createdAt: serverTimestamp(),
    lastActionAt: serverTimestamp(),
  });
  return ref.id;
}

export async function submitDraftPick(
  match: PerfectSeasonMatchDoc,
  uid: string,
  pick: DraftPick,
): Promise<void> {
  if (!db) return;
  if (match.status !== 'in-progress') throw new Error('Match is not in progress.');
  const current = match.drafts[uid] ?? [];
  if (current.length >= 11) throw new Error('Squad already full.');
  const next = [...current, pick];
  await updateDoc(doc(db, 'matches', match.id), {
    [`drafts.${uid}`]: next,
    lastActionAt: serverTimestamp(),
  });
}

/**
 * If both players have full XIs and results haven't been written yet, compute
 * the simulations and write them along with the winner.
 *
 * Both clients may race to do this; it's idempotent because both produce the
 * same deterministic result from `simulationSeed`. Last writer wins safely.
 */
export async function maybeFinalizePerfectSeasonMatch(match: PerfectSeasonMatchDoc): Promise<void> {
  if (!db) return;
  if (match.status !== 'in-progress') return;
  if (match.seasonResults) return; // already finalized

  const [a, b] = match.players;
  const draftA = match.drafts[a] ?? [];
  const draftB = match.drafts[b] ?? [];
  if (draftA.length < 11 || draftB.length < 11) return;

  const formation = FORMATIONS[match.formationId];
  const seedA = mulberry32(match.simulationSeed);
  const seedB = mulberry32(match.simulationSeed); // same seed → fair comparison
  const resultA = simulateSeason(draftA, formation, seedA);
  const resultB = simulateSeason(draftB, formation, seedB);

  let winner: string | 'tie';
  if (resultA.points !== resultB.points) {
    winner = resultA.points > resultB.points ? a : b;
  } else {
    const gdA = resultA.goalsFor - resultA.goalsAgainst;
    const gdB = resultB.goalsFor - resultB.goalsAgainst;
    if (gdA !== gdB) winner = gdA > gdB ? a : b;
    else winner = 'tie';
  }

  await updateDoc(doc(db, 'matches', match.id), {
    seasonResults: { [a]: resultA, [b]: resultB },
    status: 'completed',
    completedAt: serverTimestamp(),
    winnerUid: winner,
    lastActionAt: serverTimestamp(),
  });
}

// ─── lifecycle shared between modes ────────────────────────────────────────

export async function acceptMatch(matchId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'matches', matchId), {
    status: 'in-progress',
    lastActionAt: serverTimestamp(),
  });
}

export async function declineMatch(matchId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'matches', matchId), {
    status: 'declined',
    completedAt: serverTimestamp(),
  });
}

export async function cancelMatch(matchId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'matches', matchId), {
    status: 'cancelled',
    completedAt: serverTimestamp(),
  });
}

/**
 * Submit a trivia answer for the current turn. Computes winner if final.
 */
export async function submitMatchAnswer(
  match: TriviaMatchDoc,
  uid: string,
  selectedLabel: string,
): Promise<void> {
  if (!db) return;
  if (match.currentTurn !== uid) throw new Error("It's not your turn.");
  if (match.status !== 'in-progress') throw new Error('Match is not in progress.');

  const q = match.questions[match.turnIndex];
  if (!q) throw new Error('No question at this turn.');

  const correct = selectedLabel === q.correct;
  const result = correct
    ? scoreCorrect({
        difficulty: q.difficulty,
        timeRemainingMs: 10_000,
        totalTimeMs: 10_000,
        streakBefore: 0,
      })
    : null;
  const points = result?.total ?? 0;

  const nextScores = { ...match.scores };
  nextScores[uid] = (nextScores[uid] ?? 0) + points;

  const nextAnswers = { ...match.answers };
  nextAnswers[String(match.turnIndex)] = {
    uid,
    questionId: q.id,
    correct,
    points,
    at: Timestamp.now(),
  };

  const totalQuestions = match.questions.length;
  const nextIndex = match.turnIndex + 1;
  const finished = nextIndex >= totalQuestions;
  const nextCurrentTurn = finished ? uid : match.players[nextIndex % 2];

  const updates: Record<string, unknown> = {
    answers: nextAnswers,
    scores: nextScores,
    turnIndex: nextIndex,
    currentTurn: nextCurrentTurn,
    lastActionAt: serverTimestamp(),
  };

  if (finished) {
    updates.status = 'completed';
    updates.completedAt = serverTimestamp();
    const [a, b] = match.players;
    const sa = nextScores[a] ?? 0;
    const sb = nextScores[b] ?? 0;
    updates.winnerUid = sa === sb ? 'tie' : sa > sb ? a : b;
  }

  await updateDoc(doc(db, 'matches', match.id), updates);
}

export async function claimForfeit(match: MatchDoc, claimingUid: string): Promise<void> {
  if (!db) return;
  if (match.mode === 'trivia' && match.currentTurn === claimingUid) {
    throw new Error("It's your turn — you can't claim a forfeit.");
  }
  if (match.status !== 'in-progress' && match.status !== 'pending') {
    throw new Error('Match is not active.');
  }
  await updateDoc(doc(db, 'matches', match.id), {
    status: 'completed',
    completedAt: serverTimestamp(),
    winnerUid: claimingUid,
  });
}

export function subscribeMatch(matchId: string, onChange: (m: MatchDoc | null) => void): () => void {
  if (!db) return () => undefined;
  const ref = doc(db, 'matches', matchId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    onChange(normalize(snap.data() as Record<string, unknown>, snap.id));
  });
}

export async function loadMyMatches(uid: string): Promise<MatchDoc[]> {
  if (!db) return [];
  const q = query(collection(db, 'matches'), where('players', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => normalize(d.data() as Record<string, unknown>, d.id))
    .sort((a, b) => {
      const ta = a.lastActionAt?.toMillis?.() ?? 0;
      const tb = b.lastActionAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
}

/**
 * Compute head-to-head record across BOTH modes. Wins are wins.
 */
export function computeH2H(
  matches: MatchDoc[],
  selfUid: string,
  opponentUid: string,
): { wins: number; losses: number; ties: number } {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const m of matches) {
    if (m.status !== 'completed') continue;
    if (!m.players.includes(opponentUid)) continue;
    if (m.winnerUid === 'tie') ties++;
    else if (m.winnerUid === selfUid) wins++;
    else if (m.winnerUid === opponentUid) losses++;
  }
  return { wins, losses, ties };
}

/** Question to render for the current trivia turn. */
export function questionForTurn(
  match: TriviaMatchDoc,
  uid: string,
): { question: Question | null; isMyTurn: boolean } {
  const isMyTurn = match.currentTurn === uid;
  const q = match.questions[match.turnIndex] ?? null;
  return { question: isMyTurn ? q : null, isMyTurn };
}

/** Forfeit eligibility check, mode-aware. */
export function canClaimForfeit(match: MatchDoc, selfUid: string): boolean {
  if (match.status !== 'in-progress' && match.status !== 'pending') return false;
  if (match.mode === 'trivia') {
    if (match.currentTurn === selfUid) return false;
  } else {
    // Perfect-season: forfeit if I've finished my draft and opponent hasn't.
    const myDraft = match.drafts[selfUid] ?? [];
    const oppUid = match.players.find((p) => p !== selfUid) ?? '';
    const oppDraft = match.drafts[oppUid] ?? [];
    if (myDraft.length < 11) return false; // still my responsibility
    if (oppDraft.length >= 11) return false; // both done — sim happens automatically
  }
  const last = match.lastActionAt?.toMillis?.() ?? 0;
  return Date.now() - last > MATCH_FORFEIT_AFTER_MS;
}
