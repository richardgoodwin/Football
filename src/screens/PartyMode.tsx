import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuizRunner, type QuizFinishPayload } from '@/components/quiz/QuizRunner';
import { ALL_QUESTIONS } from '@/data/questions';
import { buildPartyTurn, type PartyScore } from '@/game/modes/party';

export function PartyMode() {
  const [players, setPlayers] = useState<string[]>(['Player 1', 'Player 2']);
  const [roundsPerPlayer, setRoundsPerPlayer] = useState(5);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'between' | 'final'>('setup');
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState<PartyScore[]>([]);
  const config = useMemo(
    () => (phase === 'playing' ? buildPartyTurn(ALL_QUESTIONS, roundsPerPlayer) : null),
    [phase, roundsPerPlayer, turn],
  );

  function startGame() {
    setScores(players.map((p) => ({ player: p, score: 0, correct: 0 })));
    setTurn(0);
    setPhase('playing');
  }

  function finishTurn(payload: QuizFinishPayload) {
    setScores((prev) => {
      const next = [...prev];
      next[turn] = {
        ...next[turn],
        score: payload.summary.score,
        correct: payload.summary.correct,
      };
      return next;
    });
    const last = turn + 1 >= players.length;
    setPhase(last ? 'final' : 'between');
  }

  function nextTurn() {
    setTurn((t) => t + 1);
    setPhase('playing');
  }

  if (phase === 'playing' && config) {
    return (
      <Screen title={`Party: ${players[turn]}'s turn`}>
        <div className="py-2 mb-2">
          <Card className="p-3 text-center">
            <p className="text-sm text-slate-300">Pass the device — it's <span className="font-bold text-neon-cyan">{players[turn]}</span>'s turn</p>
          </Card>
        </div>
        <QuizRunner
          config={config}
          modeId={`party-${turn}`}
          modeLabel={`${players[turn]}'s turn`}
          onFinish={finishTurn}
        />
      </Screen>
    );
  }

  if (phase === 'between') {
    return (
      <Screen title="Party Mode">
        <section className="py-8 space-y-5 max-w-md mx-auto text-center">
          <h2 className="font-display text-3xl">Pass the device</h2>
          <p className="text-slate-300">Next up: <span className="text-neon-cyan font-bold">{players[turn + 1]}</span></p>
          <Card className="p-5">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Standings so far</h3>
            <ul className="space-y-1.5 text-left">
              {scores.slice(0, turn + 1).map((s) => (
                <li key={s.player} className="flex justify-between text-sm">
                  <span>{s.player}</span>
                  <span className="font-semibold tabular-nums">{s.score.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Button size="lg" onClick={nextTurn} fullWidth>
            I'm {players[turn + 1]} — start my turn
          </Button>
        </section>
      </Screen>
    );
  }

  if (phase === 'final') {
    const ordered = [...scores].sort((a, b) => b.score - a.score);
    return (
      <Screen title="Party Mode">
        <section className="py-8 space-y-5 max-w-md mx-auto text-center">
          <h2 className="font-display text-4xl">Final Standings</h2>
          <Card className="p-5">
            <ol className="space-y-2 text-left">
              {ordered.map((s, i) => (
                <li
                  key={s.player}
                  className={[
                    'flex items-center justify-between px-3 py-2 rounded-lg',
                    i === 0 ? 'bg-neon-amber/15 border border-neon-amber/40' : 'bg-white/5',
                  ].join(' ')}
                >
                  <span className="font-display text-xl">
                    {i + 1}. {s.player}
                  </span>
                  <span className="font-semibold tabular-nums">{s.score.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Button size="lg" onClick={() => setPhase('setup')} fullWidth>
            New game
          </Button>
        </section>
      </Screen>
    );
  }

  return (
    <Screen title="Party Mode">
      <section className="py-6 space-y-6">
        <h2 className="font-display text-4xl tracking-wide">Party Mode</h2>
        <p className="text-slate-300">Local pass-and-play. Each player takes a turn in sequence.</p>

        <Card className="p-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Players</div>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={p}
                    onChange={(e) => {
                      const next = [...players];
                      next[i] = e.target.value;
                      setPlayers(next);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-stadium-900/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60"
                  />
                  {players.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPlayers(players.filter((_, idx) => idx !== i))}
                      className="p-2 text-slate-400 hover:text-rose-400"
                      aria-label="Remove player"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {players.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPlayers([...players, `Player ${players.length + 1}`])}
                  className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-neon-cyan"
                >
                  <Plus size={14} /> Add player
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Questions per turn</div>
            <div className="flex gap-2">
              {[3, 5, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRoundsPerPlayer(n)}
                  className={[
                    'px-4 py-2 rounded-full text-sm font-semibold border',
                    roundsPerPlayer === n
                      ? 'bg-neon-cyan/90 text-stadium-950 border-neon-cyan'
                      : 'bg-white/5 border-white/10',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Button size="lg" onClick={startGame}>
          Start party
        </Button>
      </section>
    </Screen>
  );
}
