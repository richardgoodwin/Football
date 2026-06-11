import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import {
  fetchTopScores,
  SCOREBOARD_MODES,
  type LeaderboardEntry,
  type ScoreboardMode,
} from '@/lib/leaderboard';
import { FIREBASE_CONFIGURED } from '@/lib/firebase';
import { useAuth } from '@/store/authStore';

export function Leaderboard() {
  const [mode, setMode] = useState<ScoreboardMode>('quick-play');
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentUid = useAuth((s) => s.user?.uid);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    let cancelled = false;
    setEntries(null);
    setError(null);
    fetchTopScores(mode, 50)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load leaderboard');
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (!FIREBASE_CONFIGURED) {
    return (
      <Screen title="Leaderboards">
        <section className="py-12 text-center text-slate-300 space-y-2">
          <Trophy size={48} className="mx-auto text-slate-500" />
          <p>Leaderboards need Firebase to be configured.</p>
          <p className="text-sm text-slate-400">See the README for setup steps.</p>
        </section>
      </Screen>
    );
  }

  return (
    <Screen title="Leaderboards">
      <section className="py-6 space-y-6">
        <h2 className="font-display text-4xl tracking-wide">Leaderboards</h2>

        <div className="flex flex-wrap gap-2">
          {SCOREBOARD_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-semibold border',
                mode === m.id
                  ? 'bg-neon-cyan/90 text-stadium-950 border-neon-cyan'
                  : 'bg-white/5 border-white/10 hover:bg-white/10',
              ].join(' ')}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Card className="p-2 sm:p-4">
          {error && <div className="p-4 text-wrong text-sm">{error}</div>}
          {entries === null && !error && (
            <div className="p-8 text-center text-slate-400">Loading…</div>
          )}
          {entries && entries.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No scores submitted for this mode yet. Be the first!
            </div>
          )}
          {entries && entries.length > 0 && (
            <ol className="divide-y divide-white/5">
              {entries.map((e, i) => {
                const isMe = e.uid === currentUid;
                const value = mode === 'survival' ? e.bestStreak : e.score;
                return (
                  <li
                    key={e.uid}
                    className={[
                      'flex items-center justify-between gap-3 px-3 py-3',
                      isMe ? 'bg-neon-cyan/10 rounded-lg' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={[
                          'w-8 text-right font-display text-lg tabular-nums',
                          i === 0 ? 'text-neon-amber' : '',
                          i === 1 ? 'text-slate-300' : '',
                          i === 2 ? 'text-amber-700' : '',
                        ].join(' ')}
                      >
                        {i + 1}
                      </span>
                      <span className="font-semibold truncate">
                        {e.displayName}
                        {isMe && (
                          <span className="ml-2 text-xs text-neon-cyan">YOU</span>
                        )}
                      </span>
                    </div>
                    <span className="font-display text-xl tabular-nums text-neon-cyan">
                      {value.toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </section>
    </Screen>
  );
}
