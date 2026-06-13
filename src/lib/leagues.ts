/**
 * Friends leagues: invite friends, everyone enters their drafted XI, AI teams
 * fill the unclaimed spots, then a double round-robin season is simulated.
 *
 * Data model: /leagues/{leagueId}
 *  - memberUids / invitedUids power array-contains queries + security rules.
 *  - members map holds per-player display name, squad, formation, readiness.
 *  - On start, the creator's client snapshots teams (members + AI), simulates
 *    deterministically from `seed`, and writes fixtures + table.
 */
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
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
import type { DraftPick, FormationId } from '@/types/draft';
import {
  aiTeamName,
  generateAITeam,
  simulateLeague,
  type LeagueFixture,
  type LeagueStanding,
  type LeagueTeam,
} from '@/game/draft/league';
import { ALL_PLAYERS } from '@/data/players';
import { mulberry32 } from '@/utils/rng';

export type LeagueStatus = 'lobby' | 'completed';

export interface LeagueMember {
  displayName: string;
  ready: boolean;
  formationId?: FormationId;
  squad?: DraftPick[];
}

export interface LeagueDoc {
  id: string;
  name: string;
  size: number; // total teams incl. AI fill
  status: LeagueStatus;
  createdBy: string;
  memberUids: string[];
  invitedUids: string[];
  invitedInfo: Record<string, { displayName: string }>;
  members: Record<string, LeagueMember>;
  seed: number;
  createdAt: Timestamp;
  // Populated when completed:
  teams?: LeagueTeam[];
  fixtures?: LeagueFixture[];
  table?: LeagueStanding[];
}

export const LEAGUE_SIZES = [4, 6, 8] as const;

export async function createLeague(
  user: User,
  displayName: string,
  name: string,
  size: number,
): Promise<string> {
  if (!db) throw new Error('Database not available.');
  const ref = await addDoc(collection(db, 'leagues'), {
    name: name.trim() || `${displayName}'s League`,
    size,
    status: 'lobby',
    createdBy: user.uid,
    memberUids: [user.uid],
    invitedUids: [],
    invitedInfo: {},
    members: { [user.uid]: { displayName, ready: false } },
    seed: Math.floor(Math.random() * 1_000_000),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function inviteToLeague(
  leagueId: string,
  uid: string,
  displayName: string,
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'leagues', leagueId), {
    invitedUids: arrayUnion(uid),
    [`invitedInfo.${uid}`]: { displayName },
  });
}

export async function acceptLeagueInvite(
  league: LeagueDoc,
  user: User,
  displayName: string,
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'leagues', league.id), {
    invitedUids: arrayRemove(user.uid),
    [`invitedInfo.${user.uid}`]: deleteField(),
    memberUids: arrayUnion(user.uid),
    [`members.${user.uid}`]: { displayName, ready: false },
  });
}

export async function declineLeagueInvite(leagueId: string, uid: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'leagues', leagueId), {
    invitedUids: arrayRemove(uid),
    [`invitedInfo.${uid}`]: deleteField(),
  });
}

export async function deleteLeague(leagueId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'leagues', leagueId));
}

/** Enter (or update) my squad and mark myself ready. */
export async function setLeagueSquad(
  leagueId: string,
  uid: string,
  displayName: string,
  squad: DraftPick[],
  formationId: FormationId,
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'leagues', leagueId), {
    [`members.${uid}`]: { displayName, ready: true, squad, formationId },
  });
}

/**
 * Start the league: ready members become teams, AI teams fill remaining
 * spots, season simulated deterministically from the stored seed.
 */
export async function startLeague(league: LeagueDoc): Promise<void> {
  if (!db) return;
  if (league.status !== 'lobby') throw new Error('League has already been played.');

  const humans: LeagueTeam[] = Object.entries(league.members)
    .filter(([, m]) => m.ready && m.squad && m.squad.length === 11 && m.formationId)
    .map(([uid, m]) => ({
      id: uid,
      name: m.displayName,
      isAI: false,
      formationId: m.formationId!,
      squad: m.squad!,
    }));

  if (humans.length === 0) {
    throw new Error('No ready squads — enter your XI first.');
  }

  const rng = mulberry32(league.seed);
  const teams: LeagueTeam[] = [...humans];
  let aiIndex = 0;
  while (teams.length < league.size) {
    teams.push(generateAITeam(rng, ALL_PLAYERS, `ai-${aiIndex}`, aiTeamName(aiIndex)));
    aiIndex++;
  }

  const { fixtures, table } = simulateLeague(teams, rng);

  await updateDoc(doc(db, 'leagues', league.id), {
    status: 'completed',
    teams,
    fixtures,
    table,
  });
}

export function subscribeLeague(
  leagueId: string,
  onChange: (l: LeagueDoc | null) => void,
): () => void {
  if (!db) return () => undefined;
  return onSnapshot(doc(db, 'leagues', leagueId), (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    onChange({ ...(snap.data() as Omit<LeagueDoc, 'id'>), id: snap.id });
  });
}

export async function loadMyLeagues(uid: string): Promise<LeagueDoc[]> {
  if (!db) return [];
  const q = query(collection(db, 'leagues'), where('memberUids', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<LeagueDoc, 'id'>), id: d.id }))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export async function loadLeagueInvites(uid: string): Promise<LeagueDoc[]> {
  if (!db) return [];
  const q = query(collection(db, 'leagues'), where('invitedUids', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Omit<LeagueDoc, 'id'>), id: d.id }));
}
