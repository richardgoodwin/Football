/**
 * Global leaderboards: one document per (mode, user) recording their best
 * score. On run completion, we write only if the new score beats the existing.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';

export type ScoreboardMode =
  | 'perfect-season'
  | 'quick-play'
  | 'survival'
  | 'daily'
  | 'penalty'
  | 'career'
  | 'party';

export const SCOREBOARD_MODES: { id: ScoreboardMode; label: string }[] = [
  { id: 'perfect-season', label: 'Perfect Season (points)' },
  { id: 'quick-play', label: 'Quick Play' },
  { id: 'survival', label: 'Survival (best streak)' },
  { id: 'daily', label: 'Daily Challenge' },
  { id: 'penalty', label: 'Penalty Shootout' },
  { id: 'career', label: 'Career Mode' },
  { id: 'party', label: 'Party Mode' },
];

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  score: number;
  bestStreak: number;
  achievedAt: unknown;
  mode: ScoreboardMode;
}

function lbDoc(mode: ScoreboardMode, uid: string) {
  if (!db) throw new Error('Firestore not configured');
  return doc(db, 'leaderboards', mode, 'scores', uid);
}

function lbCol(mode: ScoreboardMode) {
  if (!db) throw new Error('Firestore not configured');
  return collection(db, 'leaderboards', mode, 'scores');
}

/**
 * Write a run's score to the leaderboard if it beats the user's existing best.
 * For Survival, "score" is the best streak (higher = better either way).
 */
export async function submitScore(
  user: User,
  mode: ScoreboardMode,
  displayName: string,
  score: number,
  bestStreak: number,
): Promise<void> {
  if (!db) return;
  const ref = lbDoc(mode, user.uid);
  const existing = await getDoc(ref);
  const existingScore = existing.exists() ? (existing.data().score as number) ?? 0 : 0;

  // Survival ranks by streak, all others by score.
  const newValue = mode === 'survival' ? bestStreak : score;
  const oldValue = mode === 'survival' ? (existing.exists() ? (existing.data().bestStreak as number) ?? 0 : 0) : existingScore;

  if (newValue <= oldValue && existing.exists()) return;

  await setDoc(ref, {
    uid: user.uid,
    displayName: displayName || user.displayName || 'Player',
    score,
    bestStreak,
    mode,
    achievedAt: serverTimestamp(),
  });
}

/**
 * Fetch top N entries for a mode, ranked by score (or streak for survival).
 */
export async function fetchTopScores(
  mode: ScoreboardMode,
  n = 50,
): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  const orderField = mode === 'survival' ? 'bestStreak' : 'score';
  const q = query(lbCol(mode), orderBy(orderField, 'desc'), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as LeaderboardEntry);
}
