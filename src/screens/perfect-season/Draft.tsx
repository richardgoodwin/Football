import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCw } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wheel } from '@/components/perfect-season/Wheel';
import { PlayerCard } from '@/components/perfect-season/PlayerCard';
import { SquadView } from '@/components/perfect-season/SquadView';
import { deriveDraftState, useDraft } from '@/store/draftStore';
import { ALL_PLAYERS, uniqueClubSeasons } from '@/data/players';
import { spinWheel, type WheelLanding } from '@/game/draft/wheel';
import { eligiblePlayers, openPositionsFor, remaining } from '@/game/draft/draftState';
import { useAudio } from '@/hooks/useAudio';

export function Draft() {
  const navigate = useNavigate();
  const audio = useAudio();
  const draftStore = useDraft();
  const { picks, formationId, addPick, consumeRespin, respinsRemaining } = draftStore;

  const state = useMemo(() => deriveDraftState(draftStore), [draftStore]);
  const slots = useMemo(() => uniqueClubSeasons(), []);
  const [landingIndex, setLandingIndex] = useState<number | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // No formation? Bounce to lobby.
  useEffect(() => {
    if (!formationId) navigate('/perfect-season', { replace: true });
  }, [formationId, navigate]);

  const landing: WheelLanding | null =
    landingIndex !== null && slots[landingIndex] ? slots[landingIndex] : null;

  const eligible = useMemo(
    () => (state && landing && showResults ? eligiblePlayers(state, landing, ALL_PLAYERS) : []),
    [state, landing, showResults],
  );

  const handleSpin = useCallback(() => {
    if (!state) return;
    // Random landing via the engine's spinWheel — uses Math.random by default.
    const next = spinWheel(Math.random, ALL_PLAYERS);
    const idx = slots.findIndex((s) => s.club === next.club && s.season === next.season);
    setLandingIndex(idx >= 0 ? idx : 0);
    setSpinToken((t) => t + 1);
    setSpinning(true);
    setShowResults(false);
  }, [state, slots]);

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    setShowResults(true);
    audio.play('whistle');
  }, [audio]);

  const handlePick = useCallback(
    (playerId: string) => {
      if (!state || !landing) return;
      const player = eligible.find((p) => p.id === playerId);
      if (!player) return;
      audio.play('correct');
      addPick({ player, wheelLanding: landing });
      setShowResults(false);
      setLandingIndex(null);
    },
    [state, landing, eligible, addPick, audio],
  );

  const handleRespin = useCallback(() => {
    if (respinsRemaining <= 0) return;
    consumeRespin();
    handleSpin();
  }, [respinsRemaining, consumeRespin, handleSpin]);

  if (!state) return null;

  const complete = picks.length >= 11;
  const rem = remaining(state);
  const open = openPositionsFor(state);
  const noEligible = showResults && eligible.length === 0;

  return (
    <Screen title="Draft">
      <section className="py-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Pick</div>
            <div className="font-display text-4xl">
              {Math.min(picks.length + 1, 11)} <span className="text-slate-500">/ 11</span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>
              Need:{' '}
              {open
                .map((p) => `${rem[p]} ${p}`)
                .join(', ') || 'Squad complete!'}
            </div>
            <div>Respins: {respinsRemaining}</div>
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
          {!complete && (
            <Button size="lg" onClick={handleSpin} disabled={spinning || showResults}>
              <Sparkles size={18} className="inline-block mr-2" />
              {spinToken === 0 ? 'Spin the wheel' : 'Spin again'}
            </Button>
          )}
          {complete && (
            <Button size="lg" onClick={() => navigate('/perfect-season/simulating')}>
              Simulate the season
            </Button>
          )}
        </div>

        {/* Eligible players */}
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
                  {noEligible && respinsRemaining > 0 && (
                    <Button variant="ghost" onClick={handleRespin}>
                      <RotateCw size={16} className="inline-block mr-2" />
                      Respin
                    </Button>
                  )}
                </div>
                {noEligible ? (
                  <p className="text-sm text-slate-400">
                    No eligible players from this club for the positions you still need. Spin again
                    {respinsRemaining > 0 ? ' or use your respin.' : '.'}
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {eligible.map((p) => (
                      <PlayerCard key={p.id} player={p} onClick={() => handlePick(p.id)} />
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current squad */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">Your XI · {state.formation.label}</h3>
          <SquadView picks={picks} formation={state.formation} />
        </Card>
      </section>
    </Screen>
  );
}
