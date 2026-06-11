import { CheckCircle2, Lock } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { ACHIEVEMENTS } from '@/data/achievements';
import { useProfile } from '@/store/profileStore';

const RARITY_STYLE = {
  common: 'border-slate-500/30',
  rare: 'border-sky-400/40 bg-sky-500/5',
  epic: 'border-fuchsia-400/40 bg-fuchsia-500/5',
  legendary: 'border-amber-400/50 bg-amber-500/5',
};

export function Achievements() {
  const unlocked = useProfile((s) => s.unlockedAchievements);

  return (
    <Screen title="Achievements">
      <section className="py-6 space-y-6">
        <h2 className="font-display text-4xl tracking-wide">Achievements</h2>
        <p className="text-slate-300">
          Unlocked {unlocked.length} of {ACHIEVEMENTS.length}.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const owned = unlocked.includes(a.id);
            return (
              <Card key={a.id} className={['p-4 border', RARITY_STYLE[a.rarity]].join(' ')}>
                <div className="flex items-start gap-3">
                  {owned ? (
                    <CheckCircle2 className="text-correct shrink-0" size={20} />
                  ) : (
                    <Lock className="text-slate-400 shrink-0" size={18} />
                  )}
                  <div>
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-sm text-slate-300">{a.description}</div>
                    <div className="text-xs uppercase tracking-wider text-slate-400 mt-1">
                      {a.rarity}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}
