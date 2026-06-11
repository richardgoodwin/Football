import { useMemo, useState } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuizRunner, type QuizFinishPayload } from '@/components/quiz/QuizRunner';
import { ALL_QUESTIONS } from '@/data/questions';
import { buildDailyChallenge, DAILY_QUESTION_COUNT } from '@/game/dailySeed';
import { useDaily } from '@/store/dailyStore';
import { dateKey } from '@/utils/rng';
import { useProfile } from '@/store/profileStore';

export function DailyChallenge() {
  const today = dateKey();
  const challenge = useMemo(() => buildDailyChallenge(ALL_QUESTIONS), []);
  const lastAttempt = useDaily((s) => s.lastAttempt);
  const recordAttempt = useDaily((s) => s.recordAttempt);
  const markDaily = useProfile((s) => s.markDaily);
  const dailyStreak = useProfile((s) => s.stats.dailyStreak);
  const [started, setStarted] = useState(false);
  const navigate = useNavigate();

  const alreadyPlayed = lastAttempt?.date === today;

  const config = useMemo(
    () =>
      started
        ? {
            questions: challenge.questions,
            perQuestionMs: 18_000,
            lives: DAILY_QUESTION_COUNT,
            endOnFirstWrong: false,
          }
        : null,
    [started, challenge.questions],
  );

  function finish(payload: QuizFinishPayload) {
    recordAttempt(today, payload.summary.score, payload.summary.correct);
    markDaily(today, payload.summary.correct >= Math.ceil(DAILY_QUESTION_COUNT / 2));
    navigate('/trivia/results', { state: { ...payload, modeLabel: 'Daily Challenge' } });
  }

  if (started && config) {
    return (
      <Screen title="Daily Challenge">
        <div className="py-4">
          <QuizRunner config={config} modeId="daily" modeLabel="Daily Challenge" onFinish={finish} />
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Daily Challenge">
      <section className="py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-neon-lime" />
          <h2 className="font-display text-4xl tracking-wide">Daily Challenge</h2>
        </div>
        <p className="text-slate-300">
          {DAILY_QUESTION_COUNT} questions, the same for every player today: {today}. Resets at
          midnight UTC.
        </p>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Daily Streak</div>
              <div className="font-display text-3xl text-neon-lime">{dailyStreak} day{dailyStreak === 1 ? '' : 's'}</div>
            </div>
            {alreadyPlayed ? (
              <div className="text-right space-y-1">
                <div className="inline-flex items-center gap-1 text-correct text-sm font-semibold">
                  <CheckCircle2 size={16} /> Played today
                </div>
                <div className="text-xs text-slate-400">
                  Score: {lastAttempt?.score.toLocaleString()} · Correct {lastAttempt?.correctCount}/
                  {DAILY_QUESTION_COUNT}
                </div>
              </div>
            ) : (
              <Button size="lg" onClick={() => setStarted(true)}>
                Play today's
              </Button>
            )}
          </div>
        </Card>
      </section>
    </Screen>
  );
}
