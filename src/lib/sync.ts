/**
 * Profile sync layer: pull from Firestore on sign-in, push debounced writes
 * on local changes. Merge strategy: take max of XP/level/etc. on conflict so
 * the user never loses progress across devices.
 */
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { ProfileState } from '@/types/profile';
import { useProfile } from '@/store/profileStore';
import { useAuth } from '@/store/authStore';
import { upsertUserLookup } from './friends';

const USERS_COL = 'users';

interface RemoteProfile extends ProfileState {
  updatedAt?: unknown; // Firestore timestamp
}

function profileDoc(uid: string) {
  if (!db) throw new Error('Firestore not configured');
  return doc(db, USERS_COL, uid);
}

/**
 * Strip undefined values — Firestore rejects undefined.
 */
function clean<T extends object>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return out as T;
}

/**
 * Merge local + remote, preferring whichever has more progress on each axis.
 * This is safer than last-write-wins for a quiz game — you never want to
 * accidentally erase someone's XP because their phone synced stale state.
 */
function mergeProfiles(local: ProfileState, remote: ProfileState): ProfileState {
  return {
    displayName: remote.displayName || local.displayName,
    xp: Math.max(local.xp, remote.xp),
    level: Math.max(local.level, remote.level),
    prestige: Math.max(local.prestige, remote.prestige),
    ownedCosmetics: Array.from(new Set([...local.ownedCosmetics, ...remote.ownedCosmetics])),
    equipped: { ...local.equipped, ...remote.equipped },
    unlockedAchievements: Array.from(
      new Set([...local.unlockedAchievements, ...remote.unlockedAchievements]),
    ),
    careerTierUnlocked: Math.max(local.careerTierUnlocked, remote.careerTierUnlocked),
    stats: {
      totalAnswered: Math.max(local.stats.totalAnswered, remote.stats.totalAnswered),
      totalCorrect: Math.max(local.stats.totalCorrect, remote.stats.totalCorrect),
      bestSurvivalStreak: Math.max(
        local.stats.bestSurvivalStreak,
        remote.stats.bestSurvivalStreak,
      ),
      dailyStreak: Math.max(local.stats.dailyStreak, remote.stats.dailyStreak),
      lastDailyDate:
        (local.stats.lastDailyDate ?? '') > (remote.stats.lastDailyDate ?? '')
          ? local.stats.lastDailyDate
          : remote.stats.lastDailyDate,
      perCategory: { ...remote.stats.perCategory, ...local.stats.perCategory },
      perDifficulty: { ...remote.stats.perDifficulty, ...local.stats.perDifficulty },
      runsCompleted: Math.max(local.stats.runsCompleted, remote.stats.runsCompleted),
      perfectRuns: Math.max(local.stats.perfectRuns, remote.stats.perfectRuns),
    },
  };
}

/**
 * Pull the remote profile, merge it into local, then push the merged state back.
 */
export async function pullAndMerge(user: User): Promise<void> {
  if (!db) return;
  const ref = profileDoc(user.uid);
  const snap = await getDoc(ref);
  const local = readLocalProfile();

  if (snap.exists()) {
    const remote = snap.data() as RemoteProfile;
    const merged = mergeProfiles(local, remote);
    writeLocalProfile(merged);
    await setDoc(ref, clean({ ...merged, updatedAt: serverTimestamp() }), { merge: true });
  } else {
    // First sign-in: push current local state up.
    await setDoc(
      ref,
      clean({
        ...local,
        displayName: local.displayName || user.displayName || 'Player',
        updatedAt: serverTimestamp(),
      }),
    );
  }
}

/**
 * Push the current local profile up. Used by the debounced auto-sync.
 */
export async function pushLocal(user: User): Promise<void> {
  if (!db) return;
  const local = readLocalProfile();
  await setDoc(
    profileDoc(user.uid),
    clean({ ...local, updatedAt: serverTimestamp() }),
    { merge: true },
  );
}

function readLocalProfile(): ProfileState {
  const s = useProfile.getState();
  // Strip the action functions; keep just the state slice.
  const {
    displayName,
    xp,
    level,
    prestige,
    ownedCosmetics,
    equipped,
    unlockedAchievements,
    careerTierUnlocked,
    stats,
  } = s;
  return {
    displayName,
    xp,
    level,
    prestige,
    ownedCosmetics,
    equipped,
    unlockedAchievements,
    careerTierUnlocked,
    stats,
  };
}

function writeLocalProfile(p: ProfileState) {
  useProfile.setState(p);
}

// ─── Auto-sync wiring ───────────────────────────────────────────────────────

let pushTimer: number | null = null;
let lastPulledUid: string | null = null;

/**
 * Subscribe to auth + profile changes once. On sign-in: pull + merge. On any
 * subsequent profile change: debounce 1.5s and push to Firestore.
 */
export function initProfileSync() {
  if (!db) return;

  // Pull when user changes.
  useAuth.subscribe((s) => {
    if (s.status === 'signed-in' && s.user && s.user.uid !== lastPulledUid) {
      lastPulledUid = s.user.uid;
      const user = s.user;
      pullAndMerge(user)
        .then(() => {
          // Ensure userLookup entry exists so friends can find this player by email.
          const dn = useProfile.getState().displayName;
          return upsertUserLookup(user, dn);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[sync] pullAndMerge failed', err);
        });
    }
    if (s.status === 'signed-out') {
      lastPulledUid = null;
    }
  });

  // Push debounced on every profile change.
  useProfile.subscribe(() => {
    const authState = useAuth.getState();
    if (authState.status !== 'signed-in' || !authState.user) return;
    if (pushTimer !== null) window.clearTimeout(pushTimer);
    const user = authState.user;
    pushTimer = window.setTimeout(() => {
      pushLocal(user).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[sync] pushLocal failed', err);
      });
    }, 1500);
  });
}
