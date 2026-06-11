import { useMemo, useState } from 'react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { ALL_QUESTIONS } from '@/data/questions';
import { buildSurvival } from '@/game/modes/survival';
import { useProfile } from '@/store/profileStore';

export function Survival() {
  const [started, setStarted] = useState(false);
  const bestStreak = useProfile((s) => s.stats.bestSurvivalStreak);
  const config = useMemo(() => (started ? buildSurvival(ALL_QUESTIONS) : null), [started]);

  if (started && config) {
    return (
      <Screen title="Survival">
        <div className="py-4">
          <QuizRunner config={config} modeId="survival" modeLabel="Survival" />
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Survival">
      <section className="py-6 space-y-6">
        <h2 className="font-display text-4xl tracking-wide">Survival</h2>
        <p className="text-slate-300">
          One wrong answer ends the run. The difficulty ramps every 5 correct answers, climbing from
          Easy through to Legendary.
        </p>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Personal Best</div>
            <div className="font-display text-4xl text-neon-amber">{bestStreak}</div>
          </div>
          <Button size="lg" onClick={() => setStarted(true)}>
            Start Survival
          </Button>
        </Card>
      </section>
    </Screen>
  );
}
