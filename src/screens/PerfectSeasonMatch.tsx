import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, RotateCw, Trophy, Flag, ArrowLeft } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wheel } from '@/components/perfect-season/Wheel';
import { PlayerCard } from '@/components/perfect-season/PlayerCard';
import { SquadView } from '@/components/perfect-season/SquadView';
import { useAuth } from '@/store/authStore';
import {
  canClaimForfeit,
  claimForfeit,
  maybeFinalizePerfectSeasonMatch,
  submitDraftPick,
  type PerfectSeasonMatchDoc,
} from '@/lib/matches';
import { ALL_PLAYERS, uniqueClubSeasons, WHEEL_MIN_PLAYERS } from '@/data/players';
import { FORMATIONS, MAX_PICKS_PER_CLUB } from '@/game/draft/constraints';
import { effectiveRating, playerRole, rolePenalty } from '@/game/draft/roles';
import type { DraftPick, Player, Role } from '@/types/draft';
import { Link } from 'react-router-dom';
import { useAudio } from '@/hooks/useAudio';

interface Props {
  match: PerfectSeasonMatchDoc;
}

export function PerfectSeasonMatchView({ match }: Props) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const audio = useAudio();
  const me = user?.uid;
  const opp = me && match.players.find((p) => p !== me);

  // Try to finalize whenever the match changes (idempotent — same seed → same result).
  useEffect(() => {
    if (!me) return;
    void maybeFinalizePerfectSeasonMatch(match);
  }, [match, me]);

  if (!me || !opp) {
    return (
      <Screen title="Match">
        <div className="py-12 text-center text-slate-300">Loading…</div>
      </Screen>
    );
  }

  const myName = match.playerInfo[me]?.displayName ?? 'You';
  const oppName = match.playerInfo[opp]?.displayName ?? 'Opponent';
  const formation = FORMATIONS[match.formationId];
  const myDraft = match.drafts[me] ?? [];
  const oppDraft = match.drafts[opp] ?? [];
  const myDone = myDraft.length >= 11;
  const oppDone = oppDraft.length >= 11;

  // ── Status branches ────────────────────────────────────────────────────────
  if (match.status === 'completed' && match.seasonResults) {
    const myResult = match.seasonResults[me];
    const oppResult = match.seasonResults[opp];
    const won = match.winnerUid === me;
    const tied = match.winnerUid === 'tie';
    return (
      <Screen title={`vs ${oppName}`}>
        <section className="py-6 space-y-5 max-w-3xl mx-auto">
          <div className="text-center">
            <Trophy className={['mx-auto', won ? 'text-neon-amber' : 'text-neon-cyan'].join(' ')} size={56} />
            <h2 className="font-display text-4xl mt-2">
              {tied ? "It's a tie!" : won ? `You beat ${oppName}!` : `${oppName} beat you`}
            </h2>
            <p className="text-slate-300 text-sm">
              {formation.label} · {match.wheelSequence.length} wheel spins
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <ResultPanel
              name={`${myName} (you)`}
              result={myResult}
              highlight={won}
              picks={myDraft}
              formation={formation}
            />
            <ResultPanel
              name={oppName}
              result={oppResult}
              highlight={!won && !tied}
              picks={oppDraft}
              formation={formation}
            />
          </div>

          <div className="text-center">
            <Button onClick={() => navigate('/friends')}>
              <ArrowLeft size={14} className="inline-block mr-2" />
              Back to friends
            </Button>
          </div>
        </section>
      </Screen>
    );
  }

  if (match.status === 'declined' || match.status === 'cancelled') {
    return (
      <Screen title={`vs ${oppName}`}>
        <section className="py-12 text-center space-y-3">
          <p className="text-slate-300">
            {match.status === 'declined' ? `${oppName} declined the challenge.` : 'Match was cancelled.'}
          </p>
          <Button onClick={() => navigate('/friends')}>Back to friends</Button>
        </section>
      </Screen>
    );
  }

  // pending = waiting on opponent accept
  if (match.status === 'pending') {
    const iAmRecipient = match.createdBy !== me;
    return (
      <Screen title={`vs ${oppName}`}>
        <section className="py-8 max-w-md mx-auto space-y-5 text-center">
          <h2 className="font-display text-3xl">Perfect Season challenge</h2>
          <Card className="p-5 space-y-3">
            <p className="text-slate-300">
              {iAmRecipient ? oppName : 'You'} sent a draft battle — formation{' '}
              <strong>{formation.label}</strong>. Each picks an XI, then we simulate. No timer.
            </p>
            <p className="text-xs text-slate-400">
              Use{' '}
              <Link to="/friends" className="text-neon-cyan">
                Friends
              </Link>{' '}
              to manage challenges.
            </p>
          </Card>
        </section>
      </Screen>
    );
  }

  // in-progress
  return (
    <Screen title={`vs ${oppName}`}>
      <section className="py-4 space-y-4 max-w-3xl mx-auto">
        {/* Scoreboard */}
        <Card className="p-4 flex items-center justify-between gap-3">
          <PlayerProgress name={`${myName} (you)`} done={myDraft.length} />
          <span className="text-slate-400 text-xs font-display">DRAFT · {formation.label}</span>
          <PlayerProgress name={oppName} done={oppDraft.length} align="right" />
        </Card>

        {!myDone && (
          <DraftPanel
            match={match}
            uid={me}
            onPick={async (pick) => {
              audio.play('correct');
              await submitDraftPick(match, me, pick);
            }}
          />
        )}

        {myDone && !oppDone && (
          <Card className="p-8 text-center space-y-3">
            <Clock className="mx-auto text-slate-400" size={36} />
            <p className="font-display text-2xl">Waiting on {oppName}'s squad…</p>
            <p className="text-sm text-slate-400">
              Once they finish drafting, both seasons simulate at the same time.
            </p>
            {canClaimForfeit(match, me) && (
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Claim a forfeit win? ${oppName} hasn't picked in over 7 days.`)) {
                    claimForfeit(match, me).catch((err) => alert((err as Error).message));
                  }
                }}
              >
                <Flag size={14} className="inline-block mr-2" />
                Claim forfeit win
              </Button>
            )}
          </Card>
        )}

        {myDone && oppDone && (
          <Card className="p-8 text-center">
            <Sparkles className="mx-auto text-neon-cyan" size={36} />
            <p className="font-display text-2xl mt-2">Simulating…</p>
            <p className="text-sm text-slate-400">
              Both squads are running their 38-game season. Results in a moment.
            </p>
          </Card>
        )}

        {/* Current squad */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">
            Your XI · {myDraft.length}/11
          </h3>
          <SquadView picks={myDraft} formation={formation} />
        </Card>

        <div className="text-center">
          <Link to="/friends" className="text-sm text-slate-400 hover:text-neon-cyan">
            <ArrowLeft size={14} className="inline-block mr-1" />
            Back to friends
          </Link>
        </div>
      </section>
    </Screen>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PlayerProgress({ name, done, align }: { name: string; done: number; align?: 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className="text-xs uppercase tracking-wider text-slate-400 truncate">{name}</div>
      <div className="font-display text-2xl tabular-nums text-neon-cyan">
        {done} <span className="text-slate-500 text-sm">/ 11</span>
      </div>
    </div>
  );
}

function DraftPanel({
  match,
  uid,
  onPick,
}: {
  match: PerfectSeasonMatchDoc;
  uid: string;
  onPick: (pick: DraftPick) => Promise<void>;
}) {
  const draft = match.drafts[uid] ?? [];
  const formation = FORMATIONS[match.formationId];

  // Open role slots: formation indices not yet filled by a pick.
  const openSlotIndices = useMemo(() => {
    const filled = new Set(draft.map((d) => d.slotIndex).filter((i): i is number => i !== undefined));
    return formation.roleSlots.map((_, i) => i).filter((i) => !filled.has(i));
  }, [draft, formation]);

  // pickedPlayerIds + picksByClub for filtering eligibility.
  const pickedIds = useMemo(() => new Set(draft.map((d) => d.player.id)), [draft]);
  const picksByClub: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of draft) m[d.player.club] = (m[d.player.club] ?? 0) + 1;
    return m;
  }, [draft]);

  // Pre-build a quick slot list (for the wheel visual).
  const allSlots = useMemo(() => uniqueClubSeasons(ALL_PLAYERS, WHEEL_MIN_PLAYERS), []);

  // Spin state. seqOffset advances within the shared wheel sequence when a
  // landing offers no eligible players — otherwise re-spinning would hit the
  // same deterministic slot forever.
  const [spinToken, setSpinToken] = useState(0);
  const [landingIndex, setLandingIndex] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [seqOffset, setSeqOffset] = useState(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [triedSlot, setTriedSlot] = useState<number | null>(null);

  const doSpin = useCallback(
    (offset: number) => {
      if (draft.length >= 11) return;
      // Use the next deterministic landing from the wheel sequence so both players
      // see consistent options at the same pick index.
      const seqIdx = (draft.length + offset) % match.wheelSequence.length;
      const next = match.wheelSequence[seqIdx];
      const idx = allSlots.findIndex((s) => s.club === next.club && s.season === next.season);
      setLandingIndex(idx >= 0 ? idx : 0);
      setSpinToken((t) => t + 1);
      setShowResults(false);
      setSelectedPlayerId(null);
      setTriedSlot(null);
    },
    [draft.length, match.wheelSequence, allSlots],
  );

  const handleSpin = useCallback(() => doSpin(seqOffset), [doSpin, seqOffset]);

  const handleRespin = useCallback(() => {
    const next = seqOffset + 1;
    setSeqOffset(next);
    doSpin(next);
  }, [seqOffset, doSpin]);

  const handleSpinEnd = useCallback(() => setShowResults(true), []);

  const landing = landingIndex !== null ? allSlots[landingIndex] : null;
  const eligible = useMemo<Player[]>(() => {
    if (!landing || !showResults) return [];
    return ALL_PLAYERS.filter((p) => {
      if (p.club !== landing.club || p.season !== landing.season) return false;
      if (pickedIds.has(p.id)) return false;
      if ((picksByClub[p.club] ?? 0) >= MAX_PICKS_PER_CLUB) return false;
      return true;
    });
  }, [landing, showResults, pickedIds, picksByClub]);

  const selectedPlayer = eligible.find((p) => p.id === selectedPlayerId) ?? null;

  const handleSelectPlayer = useCallback(
    (playerId: string) => {
      setSelectedPlayerId(playerId);
      const player = eligible.find((p) => p.id === playerId);
      if (!player) return;
      let best: number | null = null;
      let bestPenalty = Infinity;
      for (const i of openSlotIndices) {
        const pen = rolePenalty(playerRole(player), formation.roleSlots[i]);
        if (pen < bestPenalty) {
          bestPenalty = pen;
          best = i;
        }
      }
      setTriedSlot(best);
    },
    [eligible, openSlotIndices, formation],
  );

  const handleConfirm = useCallback(async () => {
    if (!landing || !selectedPlayer || triedSlot === null) return;
    const slotRole = formation.roleSlots[triedSlot];
    await onPick({
      player: selectedPlayer,
      wheelLanding: landing,
      slotIndex: triedSlot,
      assignedRole: slotRole,
      rolePenalty: rolePenalty(playerRole(selectedPlayer), slotRole),
    });
    // Hide the player list but keep landingIndex — resetting it would change
    // the wheel's animate target and auto-animate an unrequested "spin".
    setShowResults(false);
    setSeqOffset(0);
    setSelectedPlayerId(null);
    setTriedSlot(null);
  }, [landing, selectedPlayer, triedSlot, formation, onPick]);

  const openRoleSummary = openSlotIndices.map((i) => formation.roleSlots[i]).join(', ');

  return (
    <div className="space-y-3">
      <Wheel slots={allSlots} landingIndex={landingIndex ?? 0} spinToken={spinToken} onSpinEnd={handleSpinEnd} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-400 max-w-[60%]">
          Need: {openRoleSummary || 'Squad complete!'}
        </div>
        <Button size="lg" onClick={handleSpin} disabled={showResults}>
          <Sparkles size={16} className="inline-block mr-2" />
          Spin
        </Button>
      </div>

      <AnimatePresence>
        {showResults && landing && (
          <motion.div
            key={`${landing.club}-${landing.season}-${draft.length}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">Landed on</div>
                  <div className="font-display text-2xl">
                    {landing.club} <span className="text-slate-400">·</span> {landing.season}
                  </div>
                </div>
                {eligible.length === 0 && (
                  <Button variant="ghost" onClick={handleRespin}>
                    <RotateCw size={16} className="inline-block mr-2" />
                    Re-spin
                  </Button>
                )}
              </div>

              {eligible.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No available players from this club-season. Re-spin to move on.
                </p>
              ) : !selectedPlayer ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  {eligible.map((p) => (
                    <PlayerCard key={p.id} player={p} onClick={() => handleSelectPlayer(p.id)} />
                  ))}
                </div>
              ) : (
                <MatchSlotTryout
                  player={selectedPlayer}
                  roleSlots={formation.roleSlots}
                  openSlotIndices={openSlotIndices}
                  triedSlot={triedSlot}
                  onTrySlot={setTriedSlot}
                  onConfirm={() => void handleConfirm()}
                  onBack={() => {
                    setSelectedPlayerId(null);
                    setTriedSlot(null);
                  }}
                />
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchSlotTryout({
  player,
  roleSlots,
  openSlotIndices,
  triedSlot,
  onTrySlot,
  onConfirm,
  onBack,
}: {
  player: Player;
  roleSlots: Role[];
  openSlotIndices: number[];
  triedSlot: number | null;
  onTrySlot: (i: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const natural = playerRole(player);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm">
          <strong>{player.name}</strong>{' '}
          <span className="text-slate-400">
            · natural {natural} · base {player.rating}
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft size={14} className="inline-block mr-1.5" />
          Choose a different player
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {openSlotIndices.map((i) => {
          const role = roleSlots[i];
          const pen = rolePenalty(natural, role);
          const eff = effectiveRating(player.rating, pen);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onTrySlot(i)}
              className={[
                'px-3 py-2 rounded-xl border text-center min-w-[72px]',
                triedSlot === i
                  ? 'border-neon-cyan bg-neon-cyan/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              ].join(' ')}
            >
              <div className="text-xs font-bold">{role}</div>
              <div
                className={[
                  'font-display text-xl tabular-nums',
                  pen === 0 ? 'text-correct' : pen <= 4 ? 'text-amber-300' : 'text-wrong',
                ].join(' ')}
              >
                {eff}
              </div>
              <div className="text-[10px] text-slate-500">{pen === 0 ? 'natural' : `-${pen}`}</div>
            </button>
          );
        })}
      </div>
      {triedSlot !== null && (
        <Button onClick={onConfirm} fullWidth>
          Confirm {player.name} at {roleSlots[triedSlot]}
        </Button>
      )}
    </div>
  );
}

function ResultPanel({
  name,
  result,
  highlight,
  picks,
  formation,
}: {
  name: string;
  result?: { wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number; perfect: boolean };
  highlight: boolean;
  picks: DraftPick[];
  formation: (typeof FORMATIONS)[keyof typeof FORMATIONS];
}) {
  if (!result) {
    return (
      <Card className="p-5 text-center text-slate-400 text-sm">{name}: no result.</Card>
    );
  }
  const gd = result.goalsFor - result.goalsAgainst;
  return (
    <Card className={['p-5 space-y-3', highlight ? 'ring-2 ring-neon-amber/60' : ''].join(' ')} glow={highlight}>
      <div className="flex items-center justify-between">
        <div className="font-display text-xl truncate">{name}</div>
        {result.perfect && <span className="text-neon-amber text-xs font-bold uppercase">38-0</span>}
      </div>
      <div className="font-display text-4xl tabular-nums">
        {result.wins}-{result.draws}-{result.losses}
      </div>
      <div className="text-sm text-slate-400">
        {result.points} pts · {result.goalsFor}-{result.goalsAgainst} ({gd >= 0 ? '+' : ''}{gd})
      </div>
      <details>
        <summary className="text-xs uppercase tracking-wider text-slate-500 cursor-pointer">View XI</summary>
        <div className="pt-2">
          <SquadView picks={picks} formation={formation} />
        </div>
      </details>
    </Card>
  );
}
