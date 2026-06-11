import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Star } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuizRunner, type QuizFinishPayload } from '@/components/quiz/QuizRunner';
import { CAREER_TIERS, buildCareerTier, type CareerTier } from '@/game/modes/career';
import { ALL_QUESTIONS } from '@/data/questions';
import { useProfile } from '@/store/profileStore';

export function CareerMode() {
  const profile = useProfile();
  const [activeTier, setActiveTier] = useState<CareerTier | null>(null);
  const navigate = useNavigate();

  const config = useMemo(
    () => (activeTier ? buildCareerTier(ALL_QUESTIONS, activeTier) : null),
    [activeTier],
  );

  function finish(payload: QuizFinishPayload) {
    if (activeTier && payload.summary.correct >= Math.ceil(activeTier.questionCount * 0.7)) {
      // Pass: unlock next tier + reward cosmetic
      useProfile.getState().unlockCareerTier(activeTier.id + 1);
      if (activeTier.reward.cosmeticId) {
        useProfile.getState().unlockCosmetic(activeTier.reward.cosmeticId);
      }
    }
    navigate('/trivia/results', {
      state: { ...payload, modeLabel: `Career: ${activeTier?.name ?? ''}` },
    });
  }

  if (activeTier && config) {
    return (
      <Screen title={`Career: ${activeTier.name}`}>
        <div className="py-4">
          <QuizRunner
            config={config}
            modeId={`career-${activeTier.id}`}
            modeLabel={activeTier.name}
            onFinish={finish}
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Career Mode">
      <section className="py-6 space-y-6">
        <h2 className="font-display text-4xl tracking-wide">Career Mode</h2>
        <p className="text-slate-300">
          Climb from amateur leagues to absolute legend status. Pass 70%+ of a tier to unlock the
          next.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {CAREER_TIERS.map((tier) => {
            const unlocked = profile.careerTierUnlocked >= tier.id && profile.level >= tier.requiredLevel;
            const completed = profile.careerTierUnlocked > tier.id;
            return (
              <Card
                key={tier.id}
                className={['p-5 space-y-3', unlocked ? '' : 'opacity-60'].join(' ')}
                glow={!completed && unlocked}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl tracking-wide">{tier.name}</h3>
                  {completed ? (
                    <Star size={18} className="text-neon-amber" fill="currentColor" />
                  ) : !unlocked ? (
                    <Lock size={16} className="text-slate-400" />
                  ) : null}
                </div>
                <p className="text-sm text-slate-300">{tier.description}</p>
                <div className="text-xs text-slate-400">
                  {tier.questionCount} questions · {Math.round(tier.perQuestionMs / 1000)}s each ·
                  reward {tier.reward.xp} XP
                </div>
                <Button
                  disabled={!unlocked}
                  onClick={() => setActiveTier(tier)}
                  variant={completed ? 'secondary' : 'primary'}
                >
                  {!unlocked
                    ? `Requires level ${tier.requiredLevel}`
                    : completed
                      ? 'Replay'
                      : 'Play tier'}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
    </Screen>
  );
}
