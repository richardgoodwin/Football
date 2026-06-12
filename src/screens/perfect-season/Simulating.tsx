import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { SimulationProgress } from '@/components/perfect-season/SimulationProgress';
import { useDraft, deriveDraftState } from '@/store/draftStore';
import { useProfile } from '@/store/profileStore';
import { useAuth } from '@/store/authStore';
import { simulateSeason } from '@/game/draft/simulation';
import { agedPicks } from '@/game/draft/aging';
import { mulberry32 } from '@/utils/rng';
import { submitScore } from '@/lib/leaderboard';

export function Simulating() {
  const navigate = useNavigate();
  const draftStore = useDraft();
  const profile = useProfile();
  const auth = useAuth();
  const state = useMemo(() => deriveDraftState(draftStore), [draftStore]);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!state || draftStore.picks.length < 11) {
      navigate('/perfect-season', { replace: true });
    }
  }, [state, draftStore.picks.length, navigate]);

  if (!state) return null;

  function finish() {
    if (!state) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    const seed = Math.floor(Math.random() * 1_000_000);
    // Dynasty: season N means the squad has aged N-1 years since drafting.
    const seasonNumber = draftStore.dynastySeason;
    const squad = agedPicks(state.picks, seasonNumber - 1);
    const result = {
      ...simulateSeason(squad, state.formation, mulberry32(seed)),
      seasonNumber,
    };
    draftStore.recordAttempt(result);

    // Submit to leaderboard (fire-and-forget)
    if (auth.status === 'signed-in' && auth.user) {
      submitScore(
        auth.user,
        'perfect-season',
        profile.displayName,
        result.points,
        result.wins,
      ).catch(() => undefined);
    }
    navigate('/perfect-season/result', { replace: true });
  }

  return (
    <Screen title="Simulating">
      <section className="py-12 max-w-md mx-auto">
        <Card className="p-8" glow>
          <SimulationProgress totalMatches={38} durationMs={3000} onDone={finish} />
        </Card>
      </section>
    </Screen>
  );
}
