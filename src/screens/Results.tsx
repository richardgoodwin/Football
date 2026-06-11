import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, RotateCw } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { QuizFinishPayload } from '@/components/quiz/QuizRunner';
import { findAchievement } from '@/data/achievements';

interface ResultsState extends QuizFinishPayload {
  modeLabel: string;
  penalty?: { playerSlots: string[]; aiSlots: string[] };
}

export function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState | null;

  if (!state) {
    return (
      <Screen title="Results">
        <div className="py-12 text-center space-y-4">
          <p className="text-slate-300">No run to show.</p>
          <Link to="/" className="text-neon-cyan underline">
            Back to menu
          </Link>
        </div>
      </Screen>
    );
  }

  const { summary, fired, xpGained, levelUps, newLevel, modeLabel, penalty } = state;
  const acc = summary.total === 0 ? 0 : Math.round((summary.correct / summary.total) * 100);

  return (
    <Screen title="Results">
      <section className="py-8 space-y-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="text-center"
        >
          <Trophy className="mx-auto text-neon-amber" size={56} />
          <h2 className="font-display text-5xl mt-2">Full Time</h2>
          <p className="text-slate-300">{modeLabel}</p>
        </motion.div>

        <Card className="p-6 text-center" glow>
          <div className="text-xs uppercase tracking-wider text-slate-400">Final Score</div>
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="font-display text-6xl text-neon-cyan tabular-nums my-2"
          >
            {summary.score.toLocaleString()}
          </motion.div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <div>
              <div className="text-slate-400 text-xs">Correct</div>
              <div className="font-semibold">{summary.correct}/{summary.total}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Accuracy</div>
              <div className="font-semibold">{acc}%</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Best Streak</div>
              <div className="font-semibold">{summary.bestStreak}</div>
            </div>
          </div>
          {xpGained > 0 && (
            <div className="mt-4 text-sm">
              <span className="text-slate-400">+</span>
              <span className="text-neon-lime font-semibold">{xpGained.toLocaleString()} XP</span>
              {levelUps > 0 && (
                <span className="ml-2 text-neon-amber font-semibold">· Level up! Now Lv {newLevel}</span>
              )}
            </div>
          )}
        </Card>

        {penalty && (
          <Card className="p-5">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">Penalty Shootout</h3>
            <PenaltyRow label="You" slots={penalty.playerSlots} />
            <div className="h-2" />
            <PenaltyRow label="CPU" slots={penalty.aiSlots} />
            <div className="mt-4 text-center text-sm">
              <PenaltyResult playerSlots={penalty.playerSlots} aiSlots={penalty.aiSlots} />
            </div>
          </Card>
        )}

        {fired.length > 0 && (
          <Card className="p-5">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">Achievements unlocked</h3>
            <ul className="space-y-2">
              {fired.map((id) => {
                const a = findAchievement(id);
                if (!a) return null;
                return (
                  <li key={id} className="flex items-center gap-3">
                    <Trophy className="text-neon-amber" size={18} />
                    <div>
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-xs text-slate-400">{a.description}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => navigate(-1)} variant="secondary">
            <RotateCw size={16} className="inline-block mr-2" />
            Play again
          </Button>
          <Button onClick={() => navigate('/trivia')} variant="ghost">
            <ArrowLeft size={16} className="inline-block mr-2" />
            Back to menu
          </Button>
        </div>
      </section>
    </Screen>
  );
}

function PenaltyRow({ label, slots }: { label: string; slots: string[] }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 text-xs uppercase text-slate-400">{label}</div>
      <div className="flex gap-1.5">
        {slots.map((s, i) => {
          const sym = s === 'goal' ? '⚽' : s === 'miss' ? '✕' : s === 'saved' ? '🧤' : '◐';
          const cls = s === 'goal' ? 'text-correct border-correct/40' : 'text-wrong border-wrong/40';
          return (
            <div
              key={i}
              className={['h-9 w-9 rounded-md flex items-center justify-center border', cls].join(' ')}
            >
              {sym}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PenaltyResult({ playerSlots, aiSlots }: { playerSlots: string[]; aiSlots: string[] }) {
  const p = playerSlots.filter((s) => s === 'goal').length;
  const a = aiSlots.filter((s) => s === 'goal').length;
  if (p > a) return <span className="text-correct font-display text-2xl">You won {p}-{a}!</span>;
  if (a > p) return <span className="text-wrong font-display text-2xl">CPU won {a}-{p}</span>;
  return <span className="text-slate-300 font-display text-2xl">Draw {p}-{a}</span>;
}
