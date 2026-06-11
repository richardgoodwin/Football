import { useMemo, useState } from 'react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { ALL_QUESTIONS } from '@/data/questions';
import { buildQuickPlay } from '@/game/modes/quickPlay';
import { CATEGORY_LABEL, type Category, type Difficulty } from '@/types/question';

const DIFFICULTIES: Array<Difficulty | 'mixed'> = ['mixed', 'easy', 'medium', 'hard', 'legendary'];

export function QuickPlay() {
  const [difficulty, setDifficulty] = useState<Difficulty | 'mixed'>('mixed');
  const [categories, setCategories] = useState<Category[] | 'all'>('all');
  const [started, setStarted] = useState(false);

  const allCategories = useMemo(() => Object.keys(CATEGORY_LABEL) as Category[], []);

  const config = useMemo(() => {
    if (!started) return null;
    return buildQuickPlay(ALL_QUESTIONS, { difficulty, categories });
  }, [started, difficulty, categories]);

  if (started && config) {
    if (config.questions.length === 0) {
      return (
        <Screen title="Quick Play">
          <div className="py-10 text-center space-y-4">
            <p className="text-slate-300">
              No questions match those filters. Try widening the categories or difficulty.
            </p>
            <Button onClick={() => setStarted(false)}>Back to settings</Button>
          </div>
        </Screen>
      );
    }
    return (
      <Screen title="Quick Play">
        <div className="py-4">
          <QuizRunner config={config} modeId="quick-play" modeLabel="Quick Play" />
        </div>
      </Screen>
    );
  }

  function toggleCategory(c: Category) {
    setCategories((cur) => {
      if (cur === 'all') return [c];
      const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
      return next.length === 0 ? 'all' : next;
    });
  }

  return (
    <Screen title="Quick Play">
      <section className="py-6 space-y-6">
        <h2 className="font-display text-4xl tracking-wide">Quick Play</h2>
        <p className="text-slate-300">10 random questions. Pick your difficulty and categories.</p>

        <Card className="p-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Difficulty</div>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={[
                    'px-4 py-2 rounded-full text-sm font-semibold border transition-colors',
                    difficulty === d
                      ? 'bg-neon-cyan/90 text-stadium-950 border-neon-cyan'
                      : 'bg-white/5 border-white/10 hover:bg-white/10',
                  ].join(' ')}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Categories</span>
              <button
                type="button"
                onClick={() => setCategories('all')}
                className="text-slate-400 hover:text-slate-200"
              >
                All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((c) => {
                const active = categories === 'all' || categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                      active
                        ? 'bg-white/15 border-white/20'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10',
                    ].join(' ')}
                  >
                    {CATEGORY_LABEL[c]}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Button size="lg" onClick={() => setStarted(true)}>
          Start Quick Play
        </Button>
      </section>
    </Screen>
  );
}
