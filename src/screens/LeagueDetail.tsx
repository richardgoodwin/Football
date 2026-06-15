import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Clock, Play, Trophy, UserPlus, Bot, RefreshCw, Sparkles, X } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import { useProfile } from '@/store/profileStore';
import {
  canRespinThisWeek,
  catchUpLeague,
  inviteToLeague,
  leagueTable,
  matchdaysPlayed,
  respinLeaguePlayer,
  setLeagueSquad,
  startLeague,
  subscribeLeague,
  type LeagueDoc,
} from '@/lib/leagues';
import { loadFriendships, otherUid, type Friendship } from '@/lib/friends';
import { FORMATIONS, FORMATION_LIST, MAX_PICKS_PER_CLUB } from '@/game/draft/constraints';
import { uniqueClubSeasons, WHEEL_MIN_PLAYERS, ALL_PLAYERS } from '@/data/players';
import { effectiveRating, pickEffectiveRating, playerRole, rolePenalty, sortPlayersForDisplay } from '@/game/draft/roles';
import {
  applyPick,
  buildPick,
  createDraft,
  eligiblePlayers,
  isComplete,
  openSlots,
} from '@/game/draft/draftState';
import { Wheel } from '@/components/perfect-season/Wheel';
import { PlayerCard } from '@/components/perfect-season/PlayerCard';
import type { DraftPick, DraftState, Formation, Player } from '@/types/draft';
import { weightedPick, type WheelLanding } from '@/game/draft/wheel';

function formatKickoff(ms: number): string {
  return new Date(ms).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LeagueDetail() {
  const { id } = useParams();
  const user = useAuth((s) => s.user);
  const displayName = useProfile((s) => s.displayName);
  const [league, setLeague] = useState<LeagueDoc | null | undefined>(undefined);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRespin, setShowRespin] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const catchingUp = useRef(false);

  useEffect(() => {
    if (!id) return;
    return subscribeLeague(id, setLeague);
  }, [id]);

  useEffect(() => {
    if (!user) return;
    loadFriendships(user.uid).then((f) => setFriends(f.accepted));
  }, [user]);

  // Catch up any matchdays whose kickoff has passed.
  useEffect(() => {
    if (!league || league.status !== 'running' || catchingUp.current) return;
    const now = Date.now();
    const due = (league.schedule ?? []).some((_, i) => {
      const md = i + 1;
      return (league.kickoffs?.[i] ?? Infinity) <= now && !league.results?.[String(md)];
    });
    if (!due) return;
    catchingUp.current = true;
    catchUpLeague(league).finally(() => {
      catchingUp.current = false;
    });
  }, [league]);

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

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (league.status === 'lobby') {
    const isCreator = league.createdBy === user.uid;
    const me = league.members[user.uid];
    const readyCount = Object.values(league.members).filter((m) => m.ready).length;
    const invitable = friends.filter((f) => {
      const oUid = otherUid(f, user.uid);
      return !league.memberUids.includes(oUid) && !league.invitedUids.includes(oUid);
    });

    return (
      <Screen title={league.name}>
        <section className="py-6 space-y-5 max-w-2xl mx-auto">
          <div>
            <h2 className="font-display text-4xl tracking-wide">{league.name}</h2>
            <p className="text-sm text-slate-400">
              {league.memberUids.length} manager{league.memberUids.length === 1 ? '' : 's'} joined ·
              AI fills the rest of the 38-team division
            </p>
          </div>

          <Card className="p-5 space-y-3" glow={!me?.ready}>
            <h3 className="text-xs uppercase tracking-wider text-slate-400">Your entry</h3>
            {me?.ready ? (
              <p className="text-sm">
                <Check size={14} className="inline-block mr-1 text-correct" />
                <strong>{me.teamName ?? displayName}</strong> entered ({me.formationId}). You can
                re-draft to change it before kick-off.
              </p>
            ) : (
              <p className="text-sm text-slate-300">
                Spin the wheel, draft your XI, then name your team to take your spot.
              </p>
            )}
            <Button onClick={() => setShowDraft(true)} disabled={busy}>
              <Sparkles size={16} className="inline-block mr-2" />
              {me?.ready ? 'Re-draft my team' : 'Draft my XI'}
            </Button>
          </Card>

          <Card className="p-5 space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-400">Managers ({readyCount} ready)</h3>
            {Object.entries(league.members).map(([uid, m]) => (
              <div key={uid} className="flex items-center justify-between text-sm py-1">
                <span>
                  {m.displayName}
                  {m.ready && m.teamName && m.teamName !== m.displayName && (
                    <span className="text-slate-400"> · {m.teamName}</span>
                  )}
                  {uid === league.createdBy && (
                    <span className="ml-2 text-[10px] uppercase text-slate-500">creator</span>
                  )}
                </span>
                {m.ready ? (
                  <span className="text-correct text-xs font-semibold">
                    <Check size={12} className="inline-block mr-1" />ready
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">
                    <Clock size={12} className="inline-block mr-1" />no squad yet
                  </span>
                )}
              </div>
            ))}
            {league.invitedUids.length > 0 && (
              <div className="text-xs text-slate-500 pt-1">
                Invited: {league.invitedUids.map((u) => league.invitedInfo[u]?.displayName ?? 'a friend').join(', ')}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-400">Invite friends</h3>
            {invitable.length === 0 ? (
              <p className="text-sm text-slate-400">
                No friends to invite — add some on the{' '}
                <Link to="/friends" className="text-neon-cyan underline">Friends</Link> page.
              </p>
            ) : (
              invitable.map((f) => {
                const oUid = otherUid(f, user.uid);
                const info = f.userInfo[oUid];
                return (
                  <div key={f.id} className="flex items-center justify-between text-sm py-1">
                    <span>{info?.displayName ?? 'Player'}</span>
                    <Button size="sm" variant="secondary" onClick={() => inviteToLeague(league.id, oUid, info?.displayName ?? 'Player')}>
                      <UserPlus size={14} className="inline-block mr-1" />Invite
                    </Button>
                  </div>
                );
              })
            )}
          </Card>

          {error && <p className="text-sm text-wrong">{error}</p>}

          {isCreator ? (
            <Button size="lg" fullWidth onClick={handleStart} disabled={busy || readyCount === 0}>
              <Play size={18} className="inline-block mr-2" />
              Start the season ({readyCount} manager{readyCount === 1 ? '' : 's'} + AI to 38)
            </Button>
          ) : (
            <p className="text-center text-sm text-slate-400">
              Waiting for {league.members[league.createdBy]?.displayName ?? 'the creator'} to start the season.
            </p>
          )}

          <div className="text-center">
            <Link to="/leagues" className="text-sm text-slate-400 hover:text-neon-cyan">
              <ArrowLeft size={14} className="inline-block mr-1" />Back to leagues
            </Link>
          </div>
        </section>

        <AnimatePresence>
          {showDraft && (
            <LeagueDraftModal
              league={league}
              uid={user.uid}
              displayName={displayName}
              initialName={me?.teamName}
              onClose={() => setShowDraft(false)}
            />
          )}
        </AnimatePresence>
      </Screen>
    );
  }

  // ── RUNNING / COMPLETED ─────────────────────────────────────────────────────
  const table = leagueTable(league);
  const played = matchdaysPlayed(league);
  const total = league.schedule?.length ?? 38;
  const myTeam = league.teams?.find((t) => t.id === user.uid);
  const me = league.members[user.uid];
  const respinAvailable = canRespinThisWeek(me) && !!myTeam;

  // My upcoming fixtures
  const upcoming = (league.schedule ?? [])
    .map((md, i) => ({ md: md.matchday, kickoff: league.kickoffs?.[i] ?? 0, fixtures: md.fixtures }))
    .filter((row) => row.md > played)
    .map((row) => {
      const fx = row.fixtures.find((f) => f.homeId === user.uid || f.awayId === user.uid);
      if (!fx) return null;
      const opponentId = fx.homeId === user.uid ? fx.awayId : fx.homeId;
      const home = fx.homeId === user.uid;
      const oppName = league.teams?.find((t) => t.id === opponentId)?.name ?? 'TBC';
      return { md: row.md, kickoff: row.kickoff, oppName, home };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 5);

  // My recent results
  const myResults: { md: number; oppName: string; gf: number; ga: number }[] = [];
  if (league.results) {
    for (let md = played; md >= 1 && myResults.length < 6; md--) {
      const fixtures = league.results[String(md)];
      if (!fixtures) continue;
      const fx = fixtures.find((f) => f.homeId === user.uid || f.awayId === user.uid);
      if (!fx) continue;
      const home = fx.homeId === user.uid;
      const oppId = home ? fx.awayId : fx.homeId;
      myResults.push({
        md,
        oppName: league.teams?.find((t) => t.id === oppId)?.name ?? 'TBC',
        gf: home ? fx.homeGoals : fx.awayGoals,
        ga: home ? fx.awayGoals : fx.homeGoals,
      });
    }
  }

  const champion = league.status === 'completed' ? table[0] : null;

  return (
    <Screen title={league.name}>
      <section className="py-6 space-y-5 max-w-3xl mx-auto">
        <div className="text-center">
          {champion ? (
            <>
              <Trophy className="mx-auto text-neon-amber" size={44} />
              <h2 className="font-display text-3xl mt-1">{league.name}</h2>
              <p className="text-slate-300">
                Champions: <strong className="text-neon-amber">{champion.name}</strong>
                {champion.teamId === user.uid && ' — that’s you!'}
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl">{league.name}</h2>
              <p className="text-slate-400 text-sm">
                Matchday {played} / {total}
                {upcoming[0] && ` · next: ${formatKickoff(upcoming[0].kickoff)}`}
              </p>
            </>
          )}
        </div>

        {/* Re-spin */}
        {league.status === 'running' && myTeam && (
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold">
                <RefreshCw size={14} className="inline-block mr-1.5 text-neon-cyan" />
                Weekly re-spin
              </div>
              <div className="text-xs text-slate-400">
                {respinAvailable
                  ? 'Swap one player into your team. Resets Saturday morning.'
                  : 'Used this week — resets Saturday morning.'}
              </div>
            </div>
            <Button size="sm" onClick={() => setShowRespin(true)} disabled={!respinAvailable}>
              Use re-spin
            </Button>
          </Card>
        )}

        {/* Table */}
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
                <th className="px-2 py-1 text-right">GD</th>
                <th className="px-2 py-1 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => {
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
                    <td className="px-2 py-1.5 text-right tabular-nums">{row.goalsFor - row.goalsAgainst}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-bold">{row.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* My fixtures + results */}
        <div className="grid sm:grid-cols-2 gap-4">
          {myResults.length > 0 && (
            <Card className="p-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Your recent results</h3>
              <div className="space-y-1 text-sm">
                {myResults.map((r) => {
                  const win = r.gf > r.ga;
                  const draw = r.gf === r.ga;
                  return (
                    <div key={r.md} className="flex items-center justify-between">
                      <span className="text-slate-400 w-12 shrink-0">MD {r.md}</span>
                      <span className="flex-1 truncate">{r.oppName}</span>
                      <span className={['tabular-nums font-bold ml-2', draw ? 'text-slate-300' : win ? 'text-correct' : 'text-wrong'].join(' ')}>
                        {r.gf}-{r.ga}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {league.status === 'running' && upcoming.length > 0 && (
            <Card className="p-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Your next fixtures</h3>
              <div className="space-y-1 text-sm">
                {upcoming.map((u) => (
                  <div key={u.md} className="flex items-center justify-between">
                    <span className="text-slate-400 w-12 shrink-0">MD {u.md}</span>
                    <span className="flex-1 truncate">
                      {u.home ? 'vs' : '@'} {u.oppName}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-2">{formatKickoff(u.kickoff)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="text-center">
          <Link to="/leagues" className="text-sm text-slate-400 hover:text-neon-cyan">
            <ArrowLeft size={14} className="inline-block mr-1" />Back to leagues
          </Link>
        </div>
      </section>

      <AnimatePresence>
        {showRespin && myTeam && (
          <RespinModal
            league={league}
            team={myTeam}
            uid={user.uid}
            onClose={() => setShowRespin(false)}
          />
        )}
      </AnimatePresence>
    </Screen>
  );
}

function RespinModal({
  league,
  team,
  uid,
  onClose,
}: {
  league: LeagueDoc;
  team: { id: string; formationId: keyof typeof FORMATIONS; squad: DraftPick[] };
  uid: string;
  onClose: () => void;
}) {
  const slots = useMemo(() => uniqueClubSeasons(ALL_PLAYERS, WHEEL_MIN_PLAYERS), []);
  const [landingIndex, setLandingIndex] = useState<number | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formation = FORMATIONS[team.formationId];
  const pickedIds = useMemo(() => new Set(team.squad.map((p) => p.player.id)), [team.squad]);
  const landing: WheelLanding | null = landingIndex !== null ? slots[landingIndex] ?? null : null;

  const eligible = useMemo<Player[]>(() => {
    if (!landing || !showResults) return [];
    return sortPlayersForDisplay(
      ALL_PLAYERS.filter(
        (p) => p.club === landing.club && p.season === landing.season && !pickedIds.has(p.id),
      ),
    );
  }, [landing, showResults, pickedIds]);

  function handleSpin() {
    const choice = weightedPick(Math.random, slots, ALL_PLAYERS);
    const idx = slots.findIndex((s) => s.club === choice.club && s.season === choice.season);
    setLandingIndex(idx);
    setSpinToken((t) => t + 1);
    setShowResults(false);
    setSelected(null);
  }

  async function confirmSlot(slotIndex: number) {
    if (!landing || !selected) return;
    setBusy(true);
    setError(null);
    try {
      await respinLeaguePlayer(league, uid, slotIndex, {
        player: selected,
        wheelLanding: landing,
      });
      onClose();
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
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-lg my-8 rounded-2xl border border-white/10 bg-stadium-900 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">Weekly re-spin</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <Wheel slots={slots} landingIndex={landingIndex ?? 0} spinToken={spinToken} onSpinEnd={() => setShowResults(true)} />

        <Button onClick={handleSpin} fullWidth disabled={showResults && !selected ? false : false}>
          <Sparkles size={16} className="inline-block mr-2" />
          {spinToken === 0 ? 'Spin' : 'Spin again'}
        </Button>

        {showResults && landing && !selected && (
          <div className="space-y-2">
            <div className="text-sm text-slate-400">
              {landing.club} · {landing.season} — tap a player to sign:
            </div>
            <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {eligible.map((p) => (
                <PlayerCard key={p.id} player={p} onClick={() => setSelected(p)} />
              ))}
              {eligible.length === 0 && (
                <p className="text-sm text-slate-400">No new players here — spin again.</p>
              )}
            </div>
          </div>
        )}

        {selected && (
          <div className="space-y-2">
            <button type="button" onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-neon-cyan">
              <ArrowLeft size={12} className="inline-block mr-1" />Back to players
            </button>
            <div className="text-sm">
              Swap <strong>{selected.name}</strong> ({playerRole(selected)}) in for:
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {[...team.squad]
                .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
                .map((cur) => {
                  const slotIndex = cur.slotIndex ?? 0;
                  const role = formation.roleSlots[slotIndex];
                  const pen = rolePenalty(playerRole(selected), role);
                  const incoming = effectiveRating(selected.rating, pen);
                  return (
                    <button
                      key={slotIndex}
                      type="button"
                      disabled={busy}
                      onClick={() => confirmSlot(slotIndex)}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left"
                    >
                      <span className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400">{role}</span>
                        <span className="block text-sm truncate">out: {cur.player.name} ({pickEffectiveRating(cur)})</span>
                      </span>
                      <span className={['font-display tabular-nums', pen === 0 ? 'text-correct' : pen <= 4 ? 'text-amber-300' : 'text-wrong'].join(' ')}>
                        {incoming}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-wrong">{error}</p>}
      </motion.div>
    </motion.div>
  );
}

/**
 * Self-contained league entry draft: pick a formation, spin & draft 11 players,
 * then name your team. Writes the squad + team name to the league on confirm.
 */
function LeagueDraftModal({
  league,
  uid,
  displayName,
  initialName,
  onClose,
}: {
  league: LeagueDoc;
  uid: string;
  displayName: string;
  initialName?: string;
  onClose: () => void;
}) {
  const slots = useMemo(() => uniqueClubSeasons(ALL_PLAYERS, WHEEL_MIN_PLAYERS), []);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [state, setState] = useState<DraftState | null>(null);
  const [landingIndex, setLandingIndex] = useState<number | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [teamName, setTeamName] = useState(initialName || `${displayName}'s XI`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const landing: WheelLanding | null = landingIndex !== null ? slots[landingIndex] ?? null : null;
  const complete = state ? isComplete(state) : false;

  const eligible = useMemo<Player[]>(() => {
    if (!state || !landing || !showResults) return [];
    return sortPlayersForDisplay(eligiblePlayers(state, landing, ALL_PLAYERS));
  }, [state, landing, showResults]);

  function chooseFormation(f: Formation) {
    setFormation(f);
    setState(createDraft(f));
  }

  function handleSpin() {
    if (!state) return;
    const usable = slots.filter((s) => {
      if ((state.picksByClub[s.club] ?? 0) >= MAX_PICKS_PER_CLUB) return false;
      return ALL_PLAYERS.some(
        (p) => p.club === s.club && p.season === s.season && !state.pickedPlayerIds.has(p.id),
      );
    });
    const pool = usable.length > 0 ? usable : slots;
    const choice = weightedPick(Math.random, pool, ALL_PLAYERS);
    const idx = slots.findIndex((s) => s.club === choice.club && s.season === choice.season);
    setLandingIndex(idx >= 0 ? idx : 0);
    setSpinToken((t) => t + 1);
    setShowResults(false);
  }

  function pickPlayer(player: Player) {
    if (!state || !landing) return;
    // Slot the player into their lowest-penalty open position.
    const open = openSlots(state);
    let best = open[0];
    let bestPen = Infinity;
    for (const i of open) {
      const pen = rolePenalty(playerRole(player), state.formation.roleSlots[i]);
      if (pen < bestPen) {
        bestPen = pen;
        best = i;
      }
    }
    setState(applyPick(state, buildPick(state.formation, player, landing, best)));
    setLandingIndex(null);
    setShowResults(false);
  }

  async function confirm() {
    if (!state || !formation || !isComplete(state)) return;
    setBusy(true);
    setError(null);
    try {
      await setLeagueSquad(league.id, uid, displayName, state.picks, formation.id, teamName);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const orderedPicks = state
    ? [...state.picks].sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-lg my-8 rounded-2xl border border-white/10 bg-stadium-900 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">
            {!formation ? 'Pick a formation' : complete ? 'Name your team' : `Draft your XI (${state!.picks.length}/11)`}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Step 1: formation */}
        {!formation && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FORMATION_LIST.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => chooseFormation(f)}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-2 py-3 text-center"
              >
                <div className="font-display tracking-wide">{f.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: draft */}
        {formation && state && !complete && (
          <>
            <Wheel
              slots={slots}
              landingIndex={landingIndex ?? 0}
              spinToken={spinToken}
              onSpinEnd={() => setShowResults(true)}
            />
            <Button onClick={handleSpin} fullWidth>
              <Sparkles size={16} className="inline-block mr-2" />
              {spinToken === 0 ? 'Spin the wheel' : 'Spin again'}
            </Button>

            {showResults && landing && (
              <div className="space-y-2">
                <div className="text-sm text-slate-400">
                  {landing.club} · {landing.season} — tap a player to sign:
                </div>
                <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                  {eligible.map((p) => (
                    <PlayerCard key={p.id} player={p} onClick={() => pickPlayer(p)} />
                  ))}
                  {eligible.length === 0 && (
                    <p className="text-sm text-slate-400">No new players here — spin again.</p>
                  )}
                </div>
              </div>
            )}

            {orderedPicks.length > 0 && (
              <div className="text-xs text-slate-400">
                <span className="uppercase tracking-wider">Drafted:</span>{' '}
                {orderedPicks
                  .map((p) => `${p.assignedRole} ${p.player.name}`)
                  .join(' · ')}
              </div>
            )}
          </>
        )}

        {/* Step 3: name */}
        {complete && (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              <Check size={14} className="inline-block mr-1 text-correct" />
              Your XI is set. Give your team a name for the league table.
            </p>
            <input
              type="text"
              maxLength={28}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={`${displayName}'s XI`}
              className="w-full px-4 py-2.5 rounded-xl bg-stadium-950/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={confirm} disabled={busy || !teamName.trim()}>
                <Check size={16} className="inline-block mr-2" />
                Enter team
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-wrong">{error}</p>}
      </motion.div>
    </motion.div>
  );
}
