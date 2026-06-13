import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCw, Check, ArrowLeft } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wheel } from '@/components/perfect-season/Wheel';
import { PlayerCard } from '@/components/perfect-season/PlayerCard';
import { SquadView } from '@/components/perfect-season/SquadView';
import { deriveDraftState, useDraft, BENCH_SIZE } from '@/store/draftStore';
import { BenchManager } from '@/components/perfect-season/BenchManager';
import { ALL_PLAYERS, uniqueClubSeasons, WHEEL_MIN_PLAYERS } from '@/data/players';
import type { WheelLanding } from '@/game/draft/wheel';
import { MAX_PICKS_PER_CLUB } from '@/game/draft/constraints';
import { buildPick, eligiblePlayers, openSlots } from '@/game/draft/draftState';
import { effectiveRating, playerRole, rolePenalty, ROLE_LABEL } from '@/game/draft/roles';
import { useAudio } from '@/hooks/useAudio';

export function Draft() {
  const navigate = useNavigate();
  const audio = useAudio();
  const draftStore = useDraft();
  const { picks, bench, formationId, addPick, addBenchPick, swapWithBench } = draftStore;

  const state = useMemo(() => deriveDraftState(draftStore), [draftStore]);
  const slots = useMemo(() => uniqueClubSeasons(ALL_PLAYERS, WHEEL_MIN_PLAYERS), []);
  const [landingIndex, setLandingIndex] = useState<number | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Try-before-you-pick state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [triedSlot, setTriedSlot] = useState<number | null>(null);

  useEffect(() => {
    if (!formationId) navigate('/perfect-season', { replace: true });
  }, [formationId, navigate]);

  const landing: WheelLanding | null =
    landingIndex !== null && slots[landingIndex] ? slots[landingIndex] : null;

  const eligible = useMemo(
    () => (state && landing && showResults ? eligiblePlayers(state, landing, ALL_PLAYERS) : []),
    [state, landing, showResults],
  );

  const selectedPlayer = useMemo(
    () => eligible.find((p) => p.id === selectedPlayerId) ?? null,
    [eligible, selectedPlayerId],
  );

  const openSlotIndices = useMemo(() => (state ? openSlots(state) : []), [state]);

  const handleSpin = useCallback(() => {
    if (!state) return;
    // Only land on club-seasons you can actually use right now: club not at its
    // pick cap, and at least one player from that season still unpicked. This
    // guarantees a spin can never strand you on an unusable club.
    const usable = slots.filter((s) => {
      if ((state.picksByClub[s.club] ?? 0) >= MAX_PICKS_PER_CLUB) return false;
      return ALL_PLAYERS.some(
        (p) => p.club === s.club && p.season === s.season && !state.pickedPlayerIds.has(p.id),
      );
    });
    const pool = usable.length > 0 ? usable : slots;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    const idx = slots.findIndex((s) => s.club === choice.club && s.season === choice.season);
    setLandingIndex(idx >= 0 ? idx : 0);
    setSpinToken((t) => t + 1);
    setSpinning(true);
    setShowResults(false);
    setSelectedPlayerId(null);
    setTriedSlot(null);
  }, [state, slots]);

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    setShowResults(true);
    audio.play('whistle');
  }, [audio]);

  const handleSelectPlayer = useCallback(
    (playerId: string) => {
      if (!state) return;
      setSelectedPlayerId(playerId);
      // Auto-suggest the best-fitting open slot for this player.
      const player = eligible.find((p) => p.id === playerId);
      if (!player) return;
      let best: number | null = null;
      let bestPenalty = Infinity;
      for (const i of openSlotIndices) {
        const pen = rolePenalty(playerRole(player), state.formation.roleSlots[i]);
        if (pen < bestPenalty) {
          bestPenalty = pen;
          best = i;
        }
      }
      setTriedSlot(best);
    },
    [state, eligible, openSlotIndices],
  );

  const handleConfirm = useCallback(() => {
    if (!state || !landing || !selectedPlayer || triedSlot === null) return;
    audio.play('correct');
    addPick(buildPick(state.formation, selectedPlayer, landing, triedSlot));
    // Hide the player list but leave landingIndex where it is — resetting it
    // would change the wheel's animate target and trigger an unwanted spin.
    setShowResults(false);
    setSelectedPlayerId(null);
    setTriedSlot(null);
  }, [state, landing, selectedPlayer, triedSlot, addPick, audio]);

  const handleBenchPick = useCallback(
    (playerId: string) => {
      if (!landing) return;
      const player = eligible.find((p) => p.id === playerId);
      if (!player) return;
      audio.play('correct');
      addBenchPick({ player, wheelLanding: landing });
      setShowResults(false);
      setSelectedPlayerId(null);
      setTriedSlot(null);
    },
    [landing, eligible, addBenchPick, audio],
  );

  if (!state) return null;

  const xiComplete = openSlotIndices.length === 0;
  const benchComplete = bench.length >= BENCH_SIZE;
  const noEligible = showResults && eligible.length === 0;
  const openRoleSummary = openSlotIndices.map((i) => state.formation.roleSlots[i]).join(', ');

  return (
    <Screen title="Draft">
      <section className="py-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">
              {xiComplete ? 'Bench' : 'Pick'}
            </div>
            <div className="font-display text-4xl">
              {xiComplete ? (
                <>
                  {bench.length} <span className="text-slate-500">/ {BENCH_SIZE}</span>
                </>
              ) : (
                <>
                  {Math.min(picks.length + 1, 11)} <span className="text-slate-500">/ 11</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 max-w-[60%]">
            {xiComplete ? (
              <div>Pick up to {BENCH_SIZE} subs — any position. Bench is optional.</div>
            ) : (
              <div>Need: {openRoleSummary || 'Squad complete!'}</div>
            )}
          </div>
        </div>

        {/* Wheel */}
        <Wheel
          slots={slots}
          landingIndex={landingIndex ?? 0}
          spinToken={spinToken}
          onSpinEnd={handleSpinEnd}
        />

        <div className="flex flex-wrap gap-2 justify-center">
          {!xiComplete && (
            <Button size="lg" onClick={handleSpin} disabled={spinning || showResults}>
              <Sparkles size={18} className="inline-block mr-2" />
              {spinToken === 0 ? 'Spin the wheel' : 'Spin again'}
            </Button>
          )}
          {xiComplete && !benchComplete && (
            <Button
              size="lg"
              variant="secondary"
              onClick={handleSpin}
              disabled={spinning || showResults}
            >
              <Sparkles size={18} className="inline-block mr-2" />
              Spin for a sub ({bench.length}/{BENCH_SIZE})
            </Button>
          )}
          {xiComplete && (
            <Button size="lg" onClick={() => navigate('/perfect-season/simulating')}>
              Simulate the season
            </Button>
          )}
        </div>

        {/* Landed: player list, then slot try-out */}
        <AnimatePresence>
          {showResults && landing && (
            <motion.div
              key={`${landing.club}-${landing.season}`}
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
                  {noEligible && (
                    <Button variant="ghost" onClick={handleSpin} disabled={spinning}>
                      <RotateCw size={16} className="inline-block mr-2" />
                      Spin again
                    </Button>
                  )}
                </div>

                {noEligible ? (
                  <p className="text-sm text-slate-400">
                    No available players from this club-season (all picked or club cap reached).
                    Spin again — it's free, and the wheel will land somewhere you can use.
                  </p>
                ) : xiComplete ? (
                  <>
                    <p className="text-xs text-slate-400">
                      Tap a player to add them to your bench — any position.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {eligible.map((p) => (
                        <PlayerCard key={p.id} player={p} onClick={() => handleBenchPick(p.id)} />
                      ))}
                    </div>
                  </>
                ) : !selectedPlayer ? (
                  <>
                    <p className="text-xs text-slate-400">
                      Tap a player to try them in your open positions — nothing is final until you
                      confirm.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {eligible.map((p) => (
                        <PlayerCard key={p.id} player={p} onClick={() => handleSelectPlayer(p.id)} />
                      ))}
                    </div>
                  </>
                ) : (
                  <SlotTryout
                    player={selectedPlayer}
                    formationRoleSlots={state.formation.roleSlots}
                    openSlotIndices={openSlotIndices}
                    triedSlot={triedSlot}
                    onTrySlot={setTriedSlot}
                    onConfirm={handleConfirm}
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

        {/* Current squad */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">
            Your XI · {state.formation.label}
          </h3>
          <SquadView picks={picks} formation={state.formation} />
        </Card>

        {/* Bench + swap (once the XI is complete and you have subs) */}
        {xiComplete && bench.length > 0 && (
          <Card className="p-4">
            <BenchManager picks={picks} bench={bench} onSwap={swapWithBench} />
          </Card>
        )}
      </section>
    </Screen>
  );
}

function SlotTryout({
  player,
  formationRoleSlots,
  openSlotIndices,
  triedSlot,
  onTrySlot,
  onConfirm,
  onBack,
}: {
  player: import('@/types/draft').Player;
  formationRoleSlots: import('@/types/draft').Role[];
  openSlotIndices: number[];
  triedSlot: number | null;
  onTrySlot: (i: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const natural = playerRole(player);
  const triedRole = triedSlot !== null ? formationRoleSlots[triedSlot] : null;
  const triedPenalty = triedRole ? rolePenalty(natural, triedRole) : 0;
  const triedRating = triedRole ? effectiveRating(player.rating, triedPenalty) : player.rating;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-semibold">{player.name}</div>
          <div className="text-xs text-slate-400">
            Natural role: {ROLE_LABEL[natural]} ({natural}) · base rating {player.rating}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft size={14} className="inline-block mr-1.5" />
          Choose a different player
        </Button>
      </div>

      <p className="text-xs text-slate-400">Try a position — the rating shows how they'd fit:</p>
      <div className="flex flex-wrap gap-2">
        {openSlotIndices.map((i) => {
          const role = formationRoleSlots[i];
          const pen = rolePenalty(natural, role);
          const eff = effectiveRating(player.rating, pen);
          const isTried = triedSlot === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onTrySlot(i)}
              className={[
                'px-3 py-2 rounded-xl border text-center min-w-[72px]',
                isTried
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

      {triedRole && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-stadium-900/70 border border-white/10 px-4 py-3">
          <div className="text-sm">
            <strong>{player.name}</strong> as <strong>{ROLE_LABEL[triedRole]}</strong> —{' '}
            <span className={triedPenalty === 0 ? 'text-correct' : 'text-amber-300'}>
              rating {triedRating}
            </span>
            {triedPenalty > 0 && <span className="text-slate-400"> (−{triedPenalty} out of position)</span>}
          </div>
          <Button onClick={onConfirm}>
            <Check size={16} className="inline-block mr-2" />
            Confirm pick
          </Button>
        </div>
      )}
    </div>
  );
}
