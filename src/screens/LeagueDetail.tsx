import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Play, Trophy, UserPlus, Bot } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import { useProfile } from '@/store/profileStore';
import { useDraft } from '@/store/draftStore';
import {
  inviteToLeague,
  setLeagueSquad,
  startLeague,
  subscribeLeague,
  type LeagueDoc,
} from '@/lib/leagues';
import { loadFriendships, otherUid, type Friendship } from '@/lib/friends';

export function LeagueDetail() {
  const { id } = useParams();
  const user = useAuth((s) => s.user);
  const displayName = useProfile((s) => s.displayName);
  const draftStore = useDraft();
  const [league, setLeague] = useState<LeagueDoc | null | undefined>(undefined);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    return subscribeLeague(id, setLeague);
  }, [id]);

  useEffect(() => {
    if (!user) return;
    loadFriendships(user.uid).then((f) => setFriends(f.accepted));
  }, [user]);

  // My most recent complete XI: a finished in-progress draft, else last result's squad.
  const mySquad = useMemo(() => {
    if (draftStore.picks.length === 11 && draftStore.formationId) {
      return { squad: draftStore.picks, formationId: draftStore.formationId };
    }
    if (draftStore.lastResult) {
      return { squad: draftStore.lastResult.squad, formationId: draftStore.lastResult.formationId };
    }
    return null;
  }, [draftStore.picks, draftStore.formationId, draftStore.lastResult]);

  const handleEnterSquad = useCallback(async () => {
    if (!user || !league || !mySquad) return;
    setBusy(true);
    setError(null);
    try {
      await setLeagueSquad(league.id, user.uid, displayName, mySquad.squad, mySquad.formationId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [user, league, mySquad, displayName]);

  const handleStart = useCallback(async () => {
    if (!league) return;
    setBusy(true);
    setError(null);
    try {
      await startLeague(league);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [league]);

  if (league === undefined) {
    return (
      <Screen title="League">
        <div className="py-12 text-center text-slate-400">Loading…</div>
      </Screen>
    );
  }
  if (league === null || !user) {
    return (
      <Screen title="League">
        <div className="py-12 text-center space-y-3">
          <p className="text-slate-300">League not found.</p>
          <Link to="/leagues" className="text-neon-cyan underline">Back to leagues</Link>
        </div>
      </Screen>
    );
  }

  const isCreator = league.createdBy === user.uid;
  const me = league.members[user.uid];
  const memberEntries = Object.entries(league.members);
  const readyCount = memberEntries.filter(([, m]) => m.ready).length;
  const invitableFriends = friends.filter((f) => {
    const oUid = otherUid(f, user.uid);
    return !league.memberUids.includes(oUid) && !league.invitedUids.includes(oUid);
  });

  // ── Completed: standings + fixtures ──────────────────────────────────────
  if (league.status === 'completed' && league.table) {
    const champion = league.table[0];
    return (
      <Screen title={league.name}>
        <section className="py-6 space-y-5 max-w-3xl mx-auto">
          <div className="text-center">
            <Trophy className="mx-auto text-neon-amber" size={48} />
            <h2 className="font-display text-4xl mt-2">{league.name}</h2>
            <p className="text-slate-300">
              Champions: <strong className="text-neon-amber">{champion?.name}</strong>
              {champion?.teamId === user.uid && ' — that’s you!'}
            </p>
          </div>

          <Card className="p-2 sm:p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-400 text-left">
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Team</th>
                  <th className="px-2 py-1 text-right">P</th>
                  <th className="px-2 py-1 text-right">W</th>
                  <th className="px-2 py-1 text-right">D</th>
                  <th className="px-2 py-1 text-right">L</th>
                  <th className="px-2 py-1 text-right">GF</th>
                  <th className="px-2 py-1 text-right">GA</th>
                  <th className="px-2 py-1 text-right">GD</th>
                  <th className="px-2 py-1 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {league.table.map((row, i) => {
                  const isMe = row.teamId === user.uid;
                  return (
                    <tr
                      key={row.teamId}
                      className={[
                        'border-t border-white/5',
                        isMe ? 'bg-neon-cyan/10' : '',
                        i === 0 ? 'text-neon-amber' : '',
                      ].join(' ')}
                    >
                      <td className="px-2 py-1.5 tabular-nums">{i + 1}</td>
                      <td className="px-2 py-1.5 font-semibold">
                        {row.isAI && <Bot size={12} className="inline-block mr-1 text-slate-400" />}
                        {row.name}
                        {isMe && <span className="ml-1 text-[10px] text-neon-cyan">YOU</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.played}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.wins}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.draws}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.losses}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.goalsFor}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.goalsAgainst}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {row.goalsFor - row.goalsAgainst}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {league.fixtures && (
            <Card className="p-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                My results
              </h3>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5 text-sm">
                {league.fixtures
                  .filter((f) => f.homeId === user.uid || f.awayId === user.uid)
                  .map((f, i) => {
                    const home = league.table!.find((t) => t.teamId === f.homeId);
                    const away = league.table!.find((t) => t.teamId === f.awayId);
                    const iWon =
                      (f.homeId === user.uid && f.homeGoals > f.awayGoals) ||
                      (f.awayId === user.uid && f.awayGoals > f.homeGoals);
                    const draw = f.homeGoals === f.awayGoals;
                    return (
                      <div key={i} className="flex items-center justify-between px-2 py-1.5">
                        <span className="truncate flex-1">{home?.name}</span>
                        <span
                          className={[
                            'mx-3 tabular-nums font-bold',
                            draw ? 'text-slate-300' : iWon ? 'text-correct' : 'text-wrong',
                          ].join(' ')}
                        >
                          {f.homeGoals}–{f.awayGoals}
                        </span>
                        <span className="truncate flex-1 text-right">{away?.name}</span>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          <div className="text-center">
            <Link to="/leagues" className="text-sm text-slate-400 hover:text-neon-cyan">
              <ArrowLeft size={14} className="inline-block mr-1" />
              Back to leagues
            </Link>
          </div>
        </section>
      </Screen>
    );
  }

  // ── Lobby ────────────────────────────────────────────────────────────────
  return (
    <Screen title={league.name}>
      <section className="py-6 space-y-5 max-w-2xl mx-auto">
        <div>
          <h2 className="font-display text-4xl tracking-wide">{league.name}</h2>
          <p className="text-sm text-slate-400">
            {league.memberUids.length}/{league.size} spots claimed · unclaimed spots become AI teams
          </p>
        </div>

        {/* My squad entry */}
        <Card className="p-5 space-y-3" glow={!me?.ready}>
          <h3 className="text-xs uppercase tracking-wider text-slate-400">Your entry</h3>
          {me?.ready ? (
            <p className="text-sm">
              <Check size={14} className="inline-block mr-1 text-correct" />
              Squad entered ({me.formationId}). You can update it any time before kick-off.
            </p>
          ) : (
            <p className="text-sm text-slate-300">
              Enter your most recent drafted XI to take your spot in the league.
            </p>
          )}
          {mySquad ? (
            <Button onClick={handleEnterSquad} disabled={busy}>
              {me?.ready ? 'Update squad' : 'Enter my XI'} ({mySquad.formationId})
            </Button>
          ) : (
            <p className="text-sm text-amber-300">
              You don't have a drafted XI yet —{' '}
              <Link to="/perfect-season" className="underline">draft one first</Link>, then come back.
            </p>
          )}
        </Card>

        {/* Members */}
        <Card className="p-5 space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">
            Managers ({readyCount} ready)
          </h3>
          {memberEntries.map(([uid, m]) => (
            <div key={uid} className="flex items-center justify-between text-sm py-1">
              <span>
                {m.displayName}
                {uid === league.createdBy && (
                  <span className="ml-2 text-[10px] uppercase text-slate-500">creator</span>
                )}
              </span>
              {m.ready ? (
                <span className="text-correct text-xs font-semibold">
                  <Check size={12} className="inline-block mr-1" />
                  ready
                </span>
              ) : (
                <span className="text-slate-400 text-xs">
                  <Clock size={12} className="inline-block mr-1" />
                  no squad yet
                </span>
              )}
            </div>
          ))}
          {league.invitedUids.length > 0 && (
            <div className="text-xs text-slate-500 pt-1">
              Invited:{' '}
              {league.invitedUids.map((uid) => league.invitedInfo[uid]?.displayName ?? 'a friend').join(', ')}
            </div>
          )}
        </Card>

        {/* Invite friends */}
        {league.memberUids.length + league.invitedUids.length < league.size && (
          <Card className="p-5 space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-400">Invite friends</h3>
            {invitableFriends.length === 0 ? (
              <p className="text-sm text-slate-400">
                No friends to invite — add some on the{' '}
                <Link to="/friends" className="text-neon-cyan underline">Friends</Link> page.
              </p>
            ) : (
              invitableFriends.map((f) => {
                const oUid = otherUid(f, user.uid);
                const info = f.userInfo[oUid];
                return (
                  <div key={f.id} className="flex items-center justify-between text-sm py-1">
                    <span>{info?.displayName ?? 'Player'}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => inviteToLeague(league.id, oUid, info?.displayName ?? 'Player')}
                    >
                      <UserPlus size={14} className="inline-block mr-1" />
                      Invite
                    </Button>
                  </div>
                );
              })
            )}
          </Card>
        )}

        {error && <p className="text-sm text-wrong">{error}</p>}

        {/* Start */}
        {isCreator && (
          <Button size="lg" fullWidth onClick={handleStart} disabled={busy || readyCount === 0}>
            <Play size={18} className="inline-block mr-2" />
            Kick off the season ({readyCount} manager{readyCount === 1 ? '' : 's'} +{' '}
            {league.size - readyCount} AI)
          </Button>
        )}
        {!isCreator && (
          <p className="text-center text-sm text-slate-400">
            Waiting for {league.members[league.createdBy]?.displayName ?? 'the creator'} to kick off
            the season.
          </p>
        )}

        <div className="text-center">
          <Link to="/leagues" className="text-sm text-slate-400 hover:text-neon-cyan">
            <ArrowLeft size={14} className="inline-block mr-1" />
            Back to leagues
          </Link>
        </div>
      </section>
    </Screen>
  );
}

