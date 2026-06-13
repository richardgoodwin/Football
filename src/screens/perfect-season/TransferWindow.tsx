import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, ArrowLeftRight, SkipForward, Play } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wheel } from '@/components/perfect-season/Wheel';
import { PlayerCard } from '@/components/perfect-season/PlayerCard';
import { PitchView } from '@/components/perfect-season/PitchView';
import { OverallRating } from '@/components/perfect-season/OverallRating';
import { PredictionBanner } from '@/components/perfect-season/PredictionBanner';
import { deriveDraftState, useDraft } from '@/store/draftStore';
import { ALL_PLAYERS, uniqueClubSeasons, WHEEL_MIN_PLAYERS } from '@/data/players';
import { MAX_PICKS_PER_CLUB } from '@/game/draft/constraints';
import { eligiblePlayers, openSlots } from '@/game/draft/draftState';
import { effectiveRating, pickEffectiveRating, playerRole, rolePenalty } from '@/game/draft/roles';
import { predictSeason } from '@/game/draft/simulation';
import type { Player } from '@/types/draft';
import type { WheelLanding } from '@/game/draft/wheel';
import { useAudio } from '@/hooks/useAudio';

export function TransferWindow() {
  const navigate = useNavigate();
  const audio = useAudio();
  const draftStore = useDraft();
  const { picks, formationId, difficulty, transferSpinsRemaining, assignToSlot, useTransferSpin } =
    draftStore;

  const state = useMemo(() => deriveDraftState(draftStore), [draftStore]);
  const slots = useMemo(() => uniqueClubSeasons(ALL_PLAYERS, WHEEL_MIN_PLAYERS), []);

  const [landingIndex, setLandingIndex] = useState<number | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);

  useEffect(() => {
    if (!formationId) navigate('/perfect-season', { replace: true });
  }, [formationId, navigate]);

  const vacancies = state ? openSlots(state) : [];
  const fillingRetirees = vacancies.length > 0;

  const landing: WheelLanding | null =
    landingIndex !== null && slots[landingIndex] ? slots[landingIndex] : null;

  const eligible = useMemo(
    () => (state && landing && showResults ? eligiblePlayers(state, landing, ALL_PLAYERS) : []),
    [state, landing, showResults],
  );

  const handleSpin = useCallback(() => {
    if (!state) return;
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
    setSelected(null);
  }, [state, slots]);

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    setShowResults(true);
    audio.play('whistle');
  }, [audio]);

  // Fill a retirement vacancy: assign the chosen player to a vacant slot.
  const fillVacancy = useCallback(
    (player: Player, slotIndex: number, lnd: WheelLanding) => {
      audio.play('correct');
      assignToSlot(slotIndex, { player, wheelLanding: lnd });
      setShowResults(false);
      setSelected(null);
    },
    [assignToSlot, audio],
  );

  // Make a transfer: swap the chosen player into an existing XI slot, using a spin.
  const makeTransfer = useCallback(
    (player: Player, slotIndex: number, lnd: WheelLanding) => {
      audio.play('correct');
      assignToSlot(slotIndex, { player, wheelLanding: lnd });
      useTransferSpin();
      setShowResults(false);
      setSelected(null);
      setLandingIndex(null);
    },
    [assignToSlot, useTransferSpin, audio],
  );

  const skipSigning = useCallback(() => {
    useTransferSpin();
    setShowResults(false);
    setSelected(null);
    setLandingIndex(null);
  }, [useTransferSpin]);

  if (!state) return null;

  const xiComplete = vacancies.length === 0;
  const noEligible = showResults && eligible.length === 0;
  const prediction = xiComplete ? predictSeason(picks, difficulty) : null;
  const canStart = xiComplete;

  return (
    <Screen title="Transfer window">
      <section className="py-4 space-y-5">
        {prediction && <PredictionBanner predictedPosition={prediction.position} />}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">
              {fillingRetirees ? 'Replace retirees' : 'Transfer window'}
            </div>
            <div className="font-display text-3xl">
              {fillingRetirees
                ? `${vacancies.length} to fill`
                : `${transferSpinsRemaining} signing${transferSpinsRemaining === 1 ? '' : 's'} left`}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 max-w-[55%]">
            {fillingRetirees
              ? 'Players retired — draft replacements to complete your XI.'
              : 'Spin to sign a player and swap them for a starter, or skip the signing.'}
          </div>
        </div>

        <Wheel slots={slots} landingIndex={landingIndex ?? 0} spinToken={spinToken} onSpinEnd={handleSpinEnd} />

        <div className="flex flex-wrap gap-2 justify-center">
          {fillingRetirees ? (
            <Button size="lg" onClick={handleSpin} disabled={spinning || showResults}>
              <Sparkles size={18} className="inline-block mr-2" />
              Spin to replace
            </Button>
          ) : (
            <>
              {transferSpinsRemaining > 0 && (
                <Button size="lg" onClick={handleSpin} disabled={spinning || showResults}>
                  <Sparkles size={18} className="inline-block mr-2" />
                  Spin ({transferSpinsRemaining} left)
                </Button>
              )}
              {canStart && (
                <Button size="lg" onClick={() => navigate('/perfect-season/simulating')}>
                  <Play size={18} className="inline-block mr-2" />
                  Start the season
                </Button>
              )}
            </>
          )}
        </div>

        {/* Landed selection */}
        <AnimatePresence>
          {showResults && landing && (
            <motion.div
              key={`${landing.club}-${landing.season}-${spinToken}`}
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
                  {!fillingRetirees && (
                    <Button variant="ghost" onClick={skipSigning}>
                      <SkipForward size={16} className="inline-block mr-2" />
                      Skip signing
                    </Button>
                  )}
                  {fillingRetirees && noEligible && (
                    <Button variant="ghost" onClick={handleSpin} disabled={spinning}>
                      Spin again
                    </Button>
                  )}
                </div>

                {noEligible ? (
                  <p className="text-sm text-slate-400">
                    No available players from this club-season. Spin again.
                  </p>
                ) : !selected ? (
                  <>
                    <p className="text-xs text-slate-400">
                      {fillingRetirees
                        ? 'Tap a player to sign them into an empty slot.'
                        : 'Tap a player to sign — then choose who they replace.'}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {eligible.map((p) => (
                        <PlayerCard key={p.id} player={p} onClick={() => setSelected(p)} />
                      ))}
                    </div>
                  </>
                ) : (
                  <SwapChooser
                    player={selected}
                    picks={picks}
                    formationRoleSlots={state.formation.roleSlots}
                    vacancies={fillingRetirees ? vacancies : null}
                    onBack={() => setSelected(null)}
                    onChoose={(slotIndex) =>
                      fillingRetirees
                        ? fillVacancy(selected, slotIndex, landing)
                        : makeTransfer(selected, slotIndex, landing)
                    }
                  />
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overall team rating, once the XI is complete */}
        {xiComplete && <OverallRating picks={picks} />}

        {/* Current squad on the pitch */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">
            Your XI · {state.formation.label}
          </h3>
          <PitchView picks={picks} formation={state.formation} />
        </Card>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/perfect-season/result')}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            <ArrowLeft size={12} className="inline-block mr-1" />
            Back to last result
          </button>
        </div>
      </section>
    </Screen>
  );
}

/**
 * After signing a player, choose which slot they go into. When filling
 * retirees only the vacant slots are offered; for transfers, any XI slot
 * (you swap the incoming player for the current holder).
 */
function SwapChooser({
  player,
  picks,
  formationRoleSlots,
  vacancies,
  onBack,
  onChoose,
}: {
  player: Player;
  picks: import('@/types/draft').DraftPick[];
  formationRoleSlots: import('@/types/draft').Role[];
  vacancies: number[] | null;
  onBack: () => void;
  onChoose: (slotIndex: number) => void;
}) {
  const natural = playerRole(player);
  const slotIndices = vacancies ?? formationRoleSlots.map((_, i) => i);
  const bySlot = new Map(picks.map((p) => [p.slotIndex, p] as const));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm">
          <strong>{player.name}</strong>{' '}
          <span className="text-slate-400">· natural {natural} · base {player.rating}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft size={14} className="inline-block mr-1.5" />
          Choose a different player
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        {vacancies ? 'Pick an empty position:' : 'Pick the starter to swap out:'}
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {slotIndices.map((i) => {
          const role = formationRoleSlots[i];
          const pen = rolePenalty(natural, role);
          const incoming = effectiveRating(player.rating, pen);
          const current = bySlot.get(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChoose(i)}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left"
            >
              <span className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {role}
                </span>
                {current ? (
                  <span className="block text-sm truncate">
                    out: {current.player.name} ({pickEffectiveRating(current)})
                  </span>
                ) : (
                  <span className="block text-sm text-slate-500">empty slot</span>
                )}
              </span>
              <span className="text-right shrink-0">
                <span
                  className={[
                    'font-display tabular-nums',
                    pen === 0 ? 'text-correct' : pen <= 4 ? 'text-amber-300' : 'text-wrong',
                  ].join(' ')}
                >
                  {incoming}
                </span>
                <span className="block text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                  <ArrowLeftRight size={9} /> in
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
