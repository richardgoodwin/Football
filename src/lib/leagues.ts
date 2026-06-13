/**
 * Friends leagues — a full 38-team division that plays out like a real season.
 *
 * Flow:
 *  - Create a league and invite friends. Every member enters their drafted XI.
 *  - The leader starts the league: a Premier-League-style fixture list is
 *    generated (38 matchdays, two a week — Wed & Sat at 3pm), AI teams fill any
 *    unclaimed spots up to 38, and per-matchday kickoff times are stamped.
 *  - Matchdays simulate deterministically as their kickoff passes. Any member's
 *    client "catches up" due matchdays and writes the results (idempotent —
 *    once a matchday is recorded it's locked, so it reflects the squads at the
 *    time it was played).
 *  - Each member gets one re-spin per week (swap a single player); the
 *    allowance resets on Saturday morning. Re-spins only affect future,
 *    unplayed matchdays.
 *
 * Serverless by design: there is no cron — the deterministic seed + stored
 * kickoff times mean every client agrees on results without a backend.
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
  computeTable,
  generateAITeam,
  generateSchedule,
  LEAGUE_SIZE,
  scheduleKickoffs,
  type LeagueStanding,
  type LeagueTeam,
  type RecordedFixture,
  type ScheduleMatchday,
} from '@/game/draft/league';
import { simulateHeadToHead } from '@/game/draft/simulation';
import { FORMATIONS } from '@/game/draft/constraints';
import { playerRole, rolePenalty } from '@/game/draft/roles';
import { withCurrentAge } from '@/game/draft/aging';
import { ALL_PLAYERS } from '@/data/players';
import { mulberry32 } from '@/utils/rng';

export type LeagueStatus = 'lobby' | 'running' | 'completed';

export interface LeagueMember {
  displayName: string;
  ready: boolean;
  formationId?: FormationId;
  squad?: DraftPick[];
  /** Saturday-week key of the member's most recent re-spin. */
  lastRespinWeek?: string;
}

export interface LeagueDoc {
  id: string;
  name: string;
  size: number;
  status: LeagueStatus;
  createdBy: string;
  memberUids: string[];
  invitedUids: string[];
  invitedInfo: Record<string, { displayName: string }>;
  members: Record<string, LeagueMember>;
  seed: number;
  createdAt: Timestamp;
  // Set when the league starts:
  startedAt?: Timestamp;
  teams?: LeagueTeam[];
  schedule?: ScheduleMatchday[];
  kickoffs?: number[];
  /** Recorded results keyed by matchday number (as a string). */
  results?: Record<string, RecordedFixture[]>;
}

/** Identifier for the current Saturday-anchored week (re-spin reset point). */
export function saturdayWeekKey(now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const back = (d.getDay() - 6 + 7) % 7; // days since last Saturday
  d.setDate(d.getDate() - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function canRespinThisWeek(member: LeagueMember | undefined): boolean {
  if (!member) return false;
  return member.lastRespinWeek !== saturdayWeekKey();
}

export async function createLeague(
  user: User,
  displayName: string,
  name: string,
): Promise<string> {
  if (!db) throw new Error('Database not available.');
  const ref = await addDoc(collection(db, 'leagues'), {
    name: name.trim() || `${displayName}'s League`,
    size: LEAGUE_SIZE,
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

export async function inviteToLeague(leagueId: string, uid: string, displayName: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'leagues', leagueId), {
    invitedUids: arrayUnion(uid),
    [`invitedInfo.${uid}`]: { displayName },
  });
}

export async function acceptLeagueInvite(league: LeagueDoc, user: User, displayName: string): Promise<void> {
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
 * Start the league: ready members + AI fill become a 38-team division, the
 * fixture list and kickoff calendar are generated, and the league goes live.
 * Matches are NOT simulated here — they play out at their kickoff times.
 */
export async function startLeague(league: LeagueDoc): Promise<void> {
  if (!db) return;
  if (league.status !== 'lobby') throw new Error('League has already started.');

  const humans: LeagueTeam[] = Object.entries(league.members)
    .filter(([, m]) => m.ready && m.squad && m.squad.length === 11 && m.formationId)
    .map(([uid, m]) => ({
      id: uid,
      name: m.displayName,
      isAI: false,
      formationId: m.formationId!,
      squad: m.squad!,
    }));

  if (humans.length === 0) throw new Error('No ready squads — enter your XI first.');

  const rng = mulberry32(league.seed);
  const teams: LeagueTeam[] = [...humans];
  let aiIndex = 0;
  while (teams.length < LEAGUE_SIZE) {
    teams.push(generateAITeam(rng, ALL_PLAYERS, `ai-${aiIndex}`, aiTeamName(aiIndex)));
    aiIndex++;
  }

  const schedule = generateSchedule(
    teams.map((t) => t.id),
    rng,
  );
  const kickoffs = scheduleKickoffs(Date.now());

  await updateDoc(doc(db, 'leagues', league.id), {
    status: 'running',
    startedAt: serverTimestamp(),
    teams,
    schedule,
    kickoffs,
    results: {},
  });
}

/**
 * Simulate any matchdays whose kickoff has passed but aren't yet recorded.
 * Deterministic per matchday (seed + matchday), so concurrent clients agree.
 */
export async function catchUpLeague(league: LeagueDoc): Promise<void> {
  if (!db) return;
  if (league.status !== 'running' || !league.schedule || !league.kickoffs || !league.teams) return;

  const now = Date.now();
  const results: Record<string, RecordedFixture[]> = { ...(league.results ?? {}) };
  const teamById = new Map(league.teams.map((t) => [t.id, t]));
  let changed = false;

  for (let md = 1; md <= league.schedule.length; md++) {
    if (results[String(md)]) continue;
    const kickoff = league.kickoffs[md - 1];
    if (kickoff === undefined || kickoff > now) continue;

    const rng = mulberry32(league.seed + md * 7919);
    const recorded: RecordedFixture[] = league.schedule[md - 1].fixtures.map((f) => {
      const home = teamById.get(f.homeId);
      const away = teamById.get(f.awayId);
      if (!home || !away) return { ...f, homeGoals: 0, awayGoals: 0 };
      const { goalsA, goalsB } = simulateHeadToHead(home.squad, away.squad, rng);
      return { homeId: f.homeId, awayId: f.awayId, homeGoals: goalsA, awayGoals: goalsB };
    });
    results[String(md)] = recorded;
    changed = true;
  }

  if (!changed) return;
  const completed = Object.keys(results).length >= league.schedule.length;
  await updateDoc(doc(db, 'leagues', league.id), {
    results,
    ...(completed ? { status: 'completed' } : {}),
  });
}

/**
 * Weekly re-spin: replace a single player in a member's team at `slotIndex`.
 * Only allowed once per Saturday-anchored week, and only affects future matchdays.
 */
export async function respinLeaguePlayer(
  league: LeagueDoc,
  uid: string,
  slotIndex: number,
  pick: DraftPick,
): Promise<void> {
  if (!db || !league.teams) return;
  const member = league.members[uid];
  if (!canRespinThisWeek(member)) throw new Error('No re-spin left this week.');

  const teams = league.teams.map((t) => {
    if (t.id !== uid) return t;
    const slotRole = FORMATIONS[t.formationId].roleSlots[slotIndex];
    const newPick = withCurrentAge({
      ...pick,
      slotIndex,
      assignedRole: slotRole,
      rolePenalty: rolePenalty(playerRole(pick.player), slotRole),
    });
    const squad = t.squad.filter((p) => p.slotIndex !== slotIndex).concat(newPick);
    return { ...t, squad };
  });

  await updateDoc(doc(db, 'leagues', league.id), {
    teams,
    [`members.${uid}.lastRespinWeek`]: saturdayWeekKey(),
  });
}

/** All recorded fixtures, flattened across matchdays. */
export function playedFixtures(league: LeagueDoc): RecordedFixture[] {
  if (!league.results) return [];
  return Object.values(league.results).flat();
}

/** Current standings from whatever has been played. */
export function leagueTable(league: LeagueDoc): LeagueStanding[] {
  if (!league.teams) return [];
  return computeTable(league.teams, playedFixtures(league));
}

/** How many matchdays have been recorded. */
export function matchdaysPlayed(league: LeagueDoc): number {
  return league.results ? Object.keys(league.results).length : 0;
}

export function subscribeLeague(leagueId: string, onChange: (l: LeagueDoc | null) => void): () => void {
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
