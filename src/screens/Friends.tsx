import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, X, Swords, UserMinus, Clock, Trophy } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import { useProfile } from '@/store/profileStore';
import {
  acceptFriendRequest,
  declineFriendRequest,
  loadFriendships,
  otherUid,
  removeFriend,
  sendFriendRequest,
  type Friendship,
} from '@/lib/friends';
import {
  cancelMatch,
  computeH2H,
  createMatch,
  createPerfectSeasonMatch,
  loadMyMatches,
  QUESTIONS_PER_PLAYER_OPTIONS,
  type MatchDoc,
} from '@/lib/matches';
import { FORMATION_LIST } from '@/game/draft/constraints';
import type { FormationId } from '@/types/draft';
import { FIREBASE_CONFIGURED } from '@/lib/firebase';

export function Friends() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);
  const displayName = useProfile((s) => s.displayName);

  const [friendships, setFriendships] = useState<{
    pendingIncoming: Friendship[];
    pendingOutgoing: Friendship[];
    accepted: Friendship[];
  }>({ pendingIncoming: [], pendingOutgoing: [], accepted: [] });
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addMsg, setAddMsg] = useState<string | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<Friendship | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [f, m] = await Promise.all([loadFriendships(user.uid), loadMyMatches(user.uid)]);
      setFriendships(f);
      setMatches(m);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!FIREBASE_CONFIGURED) {
    return (
      <Screen title="Friends">
        <div className="py-12 text-center text-slate-300">
          Multiplayer needs Firebase. See the README for setup.
        </div>
      </Screen>
    );
  }

  if (status !== 'signed-in' || !user) {
    return (
      <Screen title="Friends">
        <div className="py-12 text-center text-slate-300">Sign in to use multiplayer.</div>
      </Screen>
    );
  }

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddMsg(null);
    if (!user) return;
    const result = await sendFriendRequest(user, displayName, addEmail);
    if (!result.ok) {
      setAddError(result.reason);
      return;
    }
    setAddEmail('');
    setAddMsg('Request sent.');
    await reload();
  }

  // "My turn" depends on mode: trivia = it's my answer; perfect-season = draft incomplete.
  function isMyTurn(m: MatchDoc, uid: string): boolean {
    if (m.status !== 'in-progress') return false;
    if (m.mode === 'trivia') return m.currentTurn === uid;
    const mine = m.drafts[uid] ?? [];
    return mine.length < 11;
  }

  // Inbox helpers
  const myTurnMatches = matches.filter((m) => isMyTurn(m, user.uid));
  const theirTurnMatches = matches.filter(
    (m) => m.status === 'in-progress' && !isMyTurn(m, user.uid),
  );
  const pendingMatchesIncoming = matches.filter(
    (m) => m.status === 'pending' && m.createdBy !== user.uid,
  );
  const pendingMatchesOutgoing = matches.filter(
    (m) => m.status === 'pending' && m.createdBy === user.uid,
  );
  const completedMatches = matches
    .filter((m) => m.status === 'completed' || m.status === 'declined' || m.status === 'cancelled')
    .slice(0, 10);

  return (
    <Screen title="Friends & Matches">
      <section className="py-6 space-y-6">
        <h2 className="font-display text-4xl tracking-wide">Friends & Matches</h2>

        {/* Add friend */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">Add a friend</h3>
          <form onSubmit={handleAddFriend} className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              required
              placeholder="friend@example.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-stadium-900/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60"
            />
            <Button type="submit">
              <UserPlus size={16} className="inline-block mr-2" />
              Send request
            </Button>
          </form>
          {addError && <p className="text-sm text-wrong">{addError}</p>}
          {addMsg && <p className="text-sm text-correct">{addMsg}</p>}
          <p className="text-xs text-slate-500">
            They need to have signed in at least once for you to find them.
          </p>
        </Card>

        {/* Pending match invites (incoming) */}
        {pendingMatchesIncoming.length > 0 && (
          <Section title="Challenges waiting for you">
            {pendingMatchesIncoming.map((m) => {
              const opp = otherPlayer(m, user.uid);
              return (
                <Row key={m.id}>
                  <div>
                    <strong>{opp.displayName}</strong>{' '}
                    <span className="text-slate-400 text-sm">
                      {m.mode === 'perfect-season'
                        ? `challenged you to a Perfect Season draft (${m.formationId})`
                        : `challenged you — ${m.questionsPerPlayer} questions each`}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/match/${m.id}`)}>
                    Open
                  </Button>
                </Row>
              );
            })}
          </Section>
        )}

        {/* Your turn */}
        {myTurnMatches.length > 0 && (
          <Section title="Your turn">
            {myTurnMatches.map((m) => {
              const opp = otherPlayer(m, user.uid);
              const me = user.uid;
              return (
                <Row key={m.id}>
                  <div>
                    <strong>vs {opp.displayName}</strong>
                    <div className="text-xs text-slate-400">{matchProgressLabel(m, me, opp.uid)}</div>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/match/${m.id}`)}>
                    {m.mode === 'perfect-season' ? 'Draft' : 'Play turn'}
                  </Button>
                </Row>
              );
            })}
          </Section>
        )}

        {/* Their turn (waiting) */}
        {theirTurnMatches.length > 0 && (
          <Section title="Waiting on opponent" icon={<Clock size={14} />}>
            {theirTurnMatches.map((m) => {
              const opp = otherPlayer(m, user.uid);
              const me = user.uid;
              return (
                <Row key={m.id}>
                  <div>
                    <strong>vs {opp.displayName}</strong>
                    <div className="text-xs text-slate-400">{matchProgressLabel(m, me, opp.uid)}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/match/${m.id}`)}>
                    View
                  </Button>
                </Row>
              );
            })}
          </Section>
        )}

        {/* Friend requests (incoming) */}
        {friendships.pendingIncoming.length > 0 && (
          <Section title="Friend requests">
            {friendships.pendingIncoming.map((f) => {
              const oUid = otherUid(f, user.uid);
              const info = f.userInfo[oUid];
              return (
                <Row key={f.id}>
                  <div>
                    <strong>{info?.displayName ?? 'Player'}</strong>{' '}
                    <span className="text-slate-400 text-sm">{info?.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptFriendRequest(f.id).then(reload)}>
                      <Check size={14} className="inline-block mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => declineFriendRequest(f.id).then(reload)}
                    >
                      <X size={14} className="inline-block mr-1" />
                      Decline
                    </Button>
                  </div>
                </Row>
              );
            })}
          </Section>
        )}

        {/* Friend list */}
        <Section title={`Friends (${friendships.accepted.length})`}>
          {loading && friendships.accepted.length === 0 ? (
            <Row>
              <span className="text-slate-400 text-sm">Loading…</span>
            </Row>
          ) : friendships.accepted.length === 0 ? (
            <Row>
              <span className="text-slate-400 text-sm">
                No friends yet. Add someone above to start challenging.
              </span>
            </Row>
          ) : (
            friendships.accepted.map((f) => {
              const oUid = otherUid(f, user.uid);
              const info = f.userInfo[oUid];
              const h2h = computeH2H(matches, user.uid, oUid);
              return (
                <Row key={f.id}>
                  <div>
                    <strong>{info?.displayName ?? 'Player'}</strong>
                    <div className="text-xs text-slate-400">
                      <Trophy size={12} className="inline-block mr-1 text-neon-amber" />
                      {h2h.wins}W – {h2h.losses}L{h2h.ties > 0 ? ` – ${h2h.ties}T` : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setChallengeTarget(f)}>
                      <Swords size={14} className="inline-block mr-1" />
                      Challenge
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Remove ${info?.displayName ?? 'this friend'}?`)) {
                          removeFriend(f.id).then(reload);
                        }
                      }}
                      title="Remove friend"
                    >
                      <UserMinus size={14} />
                    </Button>
                  </div>
                </Row>
              );
            })
          )}
        </Section>

        {/* Pending outgoing friend requests */}
        {friendships.pendingOutgoing.length > 0 && (
          <Section title="Sent friend requests">
            {friendships.pendingOutgoing.map((f) => {
              const oUid = otherUid(f, user.uid);
              const info = f.userInfo[oUid];
              return (
                <Row key={f.id}>
                  <div>
                    <strong>{info?.displayName ?? 'Player'}</strong>{' '}
                    <span className="text-slate-400 text-sm">awaiting response</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => declineFriendRequest(f.id).then(reload)}>
                    Cancel
                  </Button>
                </Row>
              );
            })}
          </Section>
        )}

        {/* Pending outgoing match invites */}
        {pendingMatchesOutgoing.length > 0 && (
          <Section title="Challenges you sent">
            {pendingMatchesOutgoing.map((m) => {
              const opp = otherPlayer(m, user.uid);
              return (
                <Row key={m.id}>
                  <div>
                    <strong>vs {opp.displayName}</strong>
                    <span className="text-slate-400 text-sm ml-2">
                      {m.mode === 'perfect-season'
                        ? `Perfect Season draft (${m.formationId}) · awaiting accept`
                        : `${m.questionsPerPlayer} questions each · awaiting accept`}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => cancelMatch(m.id).then(reload)}>
                    Cancel
                  </Button>
                </Row>
              );
            })}
          </Section>
        )}

        {/* Completed matches */}
        {completedMatches.length > 0 && (
          <Section title="Recent results">
            {completedMatches.map((m) => {
              const opp = otherPlayer(m, user.uid);
              const me = user.uid;
              const { myScore, oppScore } = completedScores(m, me, opp.uid);
              const wonOrLost =
                m.status === 'declined'
                  ? 'declined'
                  : m.status === 'cancelled'
                    ? 'cancelled'
                    : m.winnerUid === 'tie'
                      ? 'tie'
                      : m.winnerUid === me
                        ? 'win'
                        : 'loss';
              return (
                <Row key={m.id}>
                  <div>
                    <strong>vs {opp.displayName}</strong>
                    <span className="text-slate-400 text-sm ml-2">
                      {myScore.toLocaleString()} – {oppScore.toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={[
                      'text-xs font-bold uppercase px-2 py-0.5 rounded-full',
                      wonOrLost === 'win' ? 'bg-correct/20 text-correct' : '',
                      wonOrLost === 'loss' ? 'bg-wrong/20 text-wrong' : '',
                      wonOrLost === 'tie' ? 'bg-white/10 text-slate-200' : '',
                      wonOrLost === 'declined' || wonOrLost === 'cancelled' ? 'bg-white/5 text-slate-400' : '',
                    ].join(' ')}
                  >
                    {wonOrLost}
                  </span>
                </Row>
              );
            })}
          </Section>
        )}
      </section>

      {/* Challenge modal */}
      <AnimatePresence>
        {challengeTarget && (
          <ChallengeModal
            friendship={challengeTarget}
            myDisplayName={displayName}
            myUid={user.uid}
            onClose={() => setChallengeTarget(null)}
            onCreated={async (matchId) => {
              setChallengeTarget(null);
              await reload();
              navigate(`/match/${matchId}`);
            }}
          />
        )}
      </AnimatePresence>
    </Screen>
  );
}

function otherPlayer(m: MatchDoc, selfUid: string) {
  const oUid = m.players.find((p) => p !== selfUid) ?? m.players[0];
  return { uid: oUid, displayName: m.playerInfo[oUid]?.displayName ?? 'Player' };
}

function matchProgressLabel(m: MatchDoc, me: string, oppUid: string): string {
  if (m.mode === 'trivia') {
    const myScore = m.scores[me] ?? 0;
    const oppScore = m.scores[oppUid] ?? 0;
    return `Q${m.turnIndex + 1} / ${m.questions.length} · ${myScore} – ${oppScore}`;
  }
  const myDraft = (m.drafts[me] ?? []).length;
  const oppDraft = (m.drafts[oppUid] ?? []).length;
  return `Draft · You ${myDraft}/11 — ${oppDraft}/11 opponent · ${m.formationId}`;
}

function completedScores(m: MatchDoc, me: string, oppUid: string): { myScore: number; oppScore: number } {
  if (m.mode === 'trivia') {
    return { myScore: m.scores[me] ?? 0, oppScore: m.scores[oppUid] ?? 0 };
  }
  const myResult = m.seasonResults?.[me];
  const oppResult = m.seasonResults?.[oppUid];
  return { myScore: myResult?.points ?? 0, oppScore: oppResult?.points ?? 0 };
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <Card className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
      {children}
    </Card>
  );
}

type ChallengeMode = 'perfect-season' | 'trivia';

function ChallengeModal({
  friendship,
  myDisplayName,
  myUid,
  onClose,
  onCreated,
}: {
  friendship: Friendship;
  myDisplayName: string;
  myUid: string;
  onClose: () => void;
  onCreated: (matchId: string) => void;
}) {
  const [mode, setMode] = useState<ChallengeMode>('perfect-season');
  const [count, setCount] = useState<number>(5);
  const [formationId, setFormationId] = useState<FormationId>('4-3-3');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuth((s) => s.user);

  const oUid = otherUid(friendship, myUid);
  const opponentName = friendship.userInfo[oUid]?.displayName ?? 'Player';

  async function handleCreate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const id =
        mode === 'perfect-season'
          ? await createPerfectSeasonMatch(user, myDisplayName, oUid, opponentName, formationId)
          : await createMatch(user, myDisplayName, oUid, opponentName, count);
      onCreated(id);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-stadium-900 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-2xl">Challenge {opponentName}</h3>

        {/* Mode toggle */}
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Mode</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('perfect-season')}
              className={[
                'rounded-xl border px-3 py-3 text-left transition-colors',
                mode === 'perfect-season'
                  ? 'border-neon-cyan bg-neon-cyan/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              ].join(' ')}
            >
              <div className="font-semibold">Perfect Season</div>
              <div className="text-xs text-slate-400">Draft battle</div>
            </button>
            <button
              type="button"
              onClick={() => setMode('trivia')}
              className={[
                'rounded-xl border px-3 py-3 text-left transition-colors',
                mode === 'trivia'
                  ? 'border-neon-cyan bg-neon-cyan/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              ].join(' ')}
            >
              <div className="font-semibold">Trivia</div>
              <div className="text-xs text-slate-400">Q&A duel</div>
            </button>
          </div>
        </div>

        {/* Mode-specific config */}
        {mode === 'perfect-season' ? (
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Formation</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMATION_LIST.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormationId(f.id)}
                  className={[
                    'rounded-xl border px-2 py-2 text-center',
                    formationId === f.id
                      ? 'border-neon-cyan bg-neon-cyan/15'
                      : 'border-white/10 bg-white/5',
                  ].join(' ')}
                >
                  <div className="font-display tracking-wide">{f.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Both of you spin the same wheel sequence, pick an XI, then we simulate. No timer.
            </p>
          </div>
        ) : (
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Questions each</div>
            <div className="flex flex-wrap gap-2">
              {QUESTIONS_PER_PLAYER_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={[
                    'px-4 py-2 rounded-full text-sm font-semibold border',
                    count === n
                      ? 'bg-neon-cyan/90 text-stadium-950 border-neon-cyan'
                      : 'bg-white/5 border-white/10',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Total match = {count * 2} questions, alternating. No timer.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-wrong">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={busy}>
            <Swords size={16} className="inline-block mr-2" />
            Send challenge
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Friends;
