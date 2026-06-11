import { useMemo, useState } from 'react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuizRunner, type QuizFinishPayload } from '@/components/quiz/QuizRunner';
import { ALL_QUESTIONS } from '@/data/questions';
import { aiScoreProbability, buildPenaltyShootout, PENALTY_ROUNDS } from '@/game/modes/penaltyShootout';
import { useNavigate } from 'react-router-dom';

type Outcome = 'goal' | 'miss' | 'saved' | 'post';

const MISS_OUTCOMES: Outcome[] = ['miss', 'saved', 'post'];

export function PenaltyShootout() {
  const [started, setStarted] = useState(false);
  const config = useMemo(() => (started ? buildPenaltyShootout(ALL_QUESTIONS) : null), [started]);
  const navigate = useNavigate();

  function finish(payload: QuizFinishPayload) {
    // Convert each answered question into a penalty outcome.
    const playerSlots: Outcome[] = payload.summary.perQuestion.map((q) =>
      q.correct ? 'goal' : MISS_OUTCOMES[Math.floor(Math.random() * 3)],
    );
    // Simulate CPU per round.
    const aiSlots: Outcome[] = [];
    for (let r = 0; r < playerSlots.length; r++) {
      const playerGoals = playerSlots.slice(0, r + 1).filter((s) => s === 'goal').length;
      const aiGoals = aiSlots.filter((s) => s === 'goal').length;
      const prob = aiScoreProbability(r, playerGoals, aiGoals);
      aiSlots.push(Math.random() < prob ? 'goal' : MISS_OUTCOMES[Math.floor(Math.random() * 3)]);
    }
    navigate('/trivia/results', {
      state: {
        ...payload,
        modeLabel: 'Penalty Shootout',
        penalty: { playerSlots, aiSlots },
      },
    });
  }

  if (!started || !config) {
    return (
      <Screen title="Penalty Shootout">
        <section className="py-6 space-y-6">
          <h2 className="font-display text-4xl tracking-wide">Penalty Shootout</h2>
          <p className="text-slate-300">
            5 rounds of pressure. Each correct answer is a goal. Wrong answers are misses, saves or
            the post. The CPU shoots after you — outscore them.
          </p>
          <Card className="p-5">
            <p className="text-sm text-slate-400 mb-4">{PENALTY_ROUNDS} rounds · 10 seconds each</p>
            <Button size="lg" onClick={() => setStarted(true)}>
              Start the shootout
            </Button>
          </Card>
        </section>
      </Screen>
    );
  }

  return (
    <Screen title="Penalty Shootout">
      <div className="py-4">
        <QuizRunner config={config} modeId="penalty" modeLabel="Penalty Shootout" onFinish={finish} />
      </div>
    </Screen>
  );
}
