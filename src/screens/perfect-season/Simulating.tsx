import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useDraft, deriveDraftState } from '@/store/draftStore';
import { useProfile } from '@/store/profileStore';
import { useAuth } from '@/store/authStore';
import { predictSeason, simulateSeason } from '@/game/draft/simulation';
import { agePicksToSeason } from '@/game/draft/aging';
import { mulberry32 } from '@/utils/rng';
import { submitScore } from '@/lib/leaderboard';
import type { SeasonResult } from '@/types/draft';

const TICK_MS = 320;

export function Simulating() {
  const navigate = useNavigate();
  const draftStore = useDraft();
  const profile = useProfile();
  const auth = useAuth();
  const state = useMemo(() => deriveDraftState(draftStore), [draftStore]);
  const finishedRef = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(0);

  // Compute the full season up-front; the ticker then replays it matchday by
  // matchday so the player watches the scores come in.
  const [result] = useState<SeasonResult | null>(() => {
    const s = deriveDraftState(useDraft.getState());
    if (!s || s.picks.length < 11) return null;
    const store = useDraft.getState();
    const seasonNumber = store.dynastySeason;
    const squad = agePicksToSeason(s.picks, seasonNumber);
    const seed = Math.floor(Math.random() * 1_000_000);
    const prediction = predictSeason(squad, store.difficulty);
    return {
      ...simulateSeason(squad, s.formation, mulberry32(seed), store.difficulty),
      seasonNumber,
      predictedPosition: prediction.position,
    };
  });

  useEffect(() => {
    if (!state || !result) {
      navigate('/perfect-season', { replace: true });
    }
  }, [state, result, navigate]);

  // Ticker: reveal one matchday at a time.
  useEffect(() => {
    if (!result) return;
    if (shown >= result.matches.length) {
      const t = window.setTimeout(() => finish(), 900);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setShown((n) => n + 1), TICK_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, result]);

  // Keep the latest result in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  function finish() {
    if (!result || finishedRef.current) return;
    finishedRef.current = true;
    draftStore.recordAttempt(result);
    if (auth.status === 'signed-in' && auth.user) {
      submitScore(auth.user, 'perfect-season', profile.displayName, result.points, result.wins).catch(
        () => undefined,
      );
    }
    navigate('/perfect-season/result', { replace: true });
  }

  if (!result) return null;

  const played = result.matches.slice(0, shown);
  const wins = played.filter((m) => m.result === 'W').length;
  const draws = played.filter((m) => m.result === 'D').length;
  const losses = played.filter((m) => m.result === 'L').length;
  const points = wins * 3 + draws;

  return (
    <Screen title="Season in progress">
      <section className="py-6 max-w-lg mx-auto space-y-4">
        <Card className="p-4" glow>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Matchday</div>
              <div className="font-display text-4xl tabular-nums text-neon-cyan">
                {shown} <span className="text-slate-500 text-xl">/ 38</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">W-D-L · Pts</div>
              <div className="font-display text-3xl tabular-nums">
                {wins}-{draws}-{losses}{' '}
                <span className="text-neon-amber">{points}</span>
              </div>
            </div>
          </div>
          <div className="h-1.5 mt-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-cyan via-neon-lime to-neon-amber transition-all"
              style={{ width: `${(shown / 38) * 100}%` }}
            />
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div ref={listRef} className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {played.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span className="text-slate-400 w-14 shrink-0 tabular-nums">MD {i + 1}</span>
                <span className="flex-1 truncate">vs {m.opponent}</span>
                <span className="tabular-nums font-semibold mx-3">
                  {m.goalsFor}–{m.goalsAgainst}
                </span>
                <span
                  className={[
                    'w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0',
                    m.result === 'W' ? 'bg-correct/25 text-correct' : '',
                    m.result === 'D' ? 'bg-white/10 text-slate-200' : '',
                    m.result === 'L' ? 'bg-wrong/25 text-wrong' : '',
                  ].join(' ')}
                >
                  {m.result}
                </span>
              </motion.div>
            ))}
            {played.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                The whistle blows on matchday 1…
              </div>
            )}
          </div>
        </Card>

        <button
          type="button"
          onClick={() => setShown(result.matches.length)}
          className="block mx-auto text-xs text-slate-500 hover:text-slate-300"
        >
          Skip to full time
        </button>
      </section>
    </Screen>
  );
}
