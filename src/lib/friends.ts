/**
 * Friend system: lookup by email, send requests, accept/decline, list friends.
 *
 * Data model:
 *   /userLookup/{lowercaseEmail}   - public-ish: any auth user can read for
 *                                    friend search; each user writes own entry.
 *   /friendships/{compoundId}      - one doc per friendship/request.
 *                                    compoundId = `${minUid}_${maxUid}` so
 *                                    each pair has exactly one doc.
 */
import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserLookupEntry {
  uid: string;
  email: string;
  displayName: string;
  updatedAt?: unknown;
}

export interface Friendship {
  id: string;
  users: [string, string];
  userInfo: Record<string, { email: string; displayName: string }>;
  status: 'pending' | 'accepted';
  requestedBy: string;
  createdAt?: unknown;
}

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function friendshipId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export function otherUid(f: Friendship, selfUid: string): string {
  return f.users[0] === selfUid ? f.users[1] : f.users[0];
}

/**
 * Write this user's lookup entry. Called on sign-in so others can find them.
 */
export async function upsertUserLookup(user: User, displayName: string): Promise<void> {
  if (!db || !user.email) return;
  const email = normEmail(user.email);
  await setDoc(
    doc(db, 'userLookup', email),
    {
      uid: user.uid,
      email,
      displayName: displayName || user.displayName || 'Player',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Find a user by email. Returns null if not found or not signed up yet.
 */
export async function findUserByEmail(email: string): Promise<UserLookupEntry | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'userLookup', normEmail(email)));
  return snap.exists() ? (snap.data() as UserLookupEntry) : null;
}

/**
 * List every registered player (everyone who has signed in at least once),
 * excluding the current user. Sorted by display name for the friend directory.
 */
export async function listAllUsers(selfUid: string): Promise<UserLookupEntry[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'userLookup'));
  return snap.docs
    .map((d) => d.data() as UserLookupEntry)
    .filter((u) => u.uid && u.uid !== selfUid)
    .sort((a, b) =>
      (a.displayName || a.email).localeCompare(b.displayName || b.email, undefined, {
        sensitivity: 'base',
      }),
    );
}

/**
 * Send a friend request. Creates the friendship doc with status='pending'.
 */
export async function sendFriendRequest(
  me: User,
  myDisplayName: string,
  toEmail: string,
): Promise<{ ok: true; friendship: Friendship } | { ok: false; reason: string }> {
  if (!db) return { ok: false, reason: 'Database not available.' };
  if (!me.email) return { ok: false, reason: 'Your account has no email.' };
  if (normEmail(me.email) === normEmail(toEmail)) {
    return { ok: false, reason: "That's your own email." };
  }

  const target = await findUserByEmail(toEmail);
  if (!target) {
    return { ok: false, reason: 'No user with that email. They need to sign up first.' };
  }

  const id = friendshipId(me.uid, target.uid);
  const ref = doc(db, 'friendships', id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const data = existing.data() as Friendship;
    if (data.status === 'accepted') return { ok: false, reason: 'Already friends.' };
    return { ok: false, reason: 'Friend request already pending.' };
  }

  const payload: Omit<Friendship, 'id'> = {
    users: [me.uid, target.uid] as [string, string],
    userInfo: {
      [me.uid]: { email: normEmail(me.email), displayName: myDisplayName || 'Player' },
      [target.uid]: { email: target.email, displayName: target.displayName },
    },
    status: 'pending',
    requestedBy: me.uid,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { ok: true, friendship: { ...payload, id } as Friendship };
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'friendships', friendshipId), { status: 'accepted' });
}

export async function declineFriendRequest(friendshipId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'friendships', friendshipId));
}

export async function removeFriend(friendshipId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'friendships', friendshipId));
}

/**
 * Load all friendships where I'm one of the users. Returned in two buckets.
 */
export async function loadFriendships(uid: string): Promise<{
  pendingIncoming: Friendship[];
  pendingOutgoing: Friendship[];
  accepted: Friendship[];
}> {
  if (!db) return { pendingIncoming: [], pendingOutgoing: [], accepted: [] };
  const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid));
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ ...(d.data() as Friendship), id: d.id }));

  return {
    pendingIncoming: all.filter((f) => f.status === 'pending' && f.requestedBy !== uid),
    pendingOutgoing: all.filter((f) => f.status === 'pending' && f.requestedBy === uid),
    accepted: all.filter((f) => f.status === 'accepted'),
  };
}
