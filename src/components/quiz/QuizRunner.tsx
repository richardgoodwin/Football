import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EngineConfig, EngineState } from '@/game/engine';
import { createEngineState, currentQuestion, startEngine, submitAnswer } from '@/game/engine';
import { useProfile, type RunSummary } from '@/store/profileStore';
import { useAuth } from '@/store/authStore';
import { submitScore, type ScoreboardMode } from '@/lib/leaderboard';
import { checkAchievements } from '@/game/achievementsEngine';
import { useAudio } from '@/hooks/useAudio';
import { useTimer } from '@/hooks/useTimer';
import { Card } from '@/components/ui/Card';
import { QuestionCard, type AnswerEvent } from './QuestionCard';
import { Timer } from './Timer';
import { ScoreDisplay } from './ScoreDisplay';
import { StreakBadge } from './StreakBadge';
import { ProgressDots } from './ProgressDots';
import { FeedbackOverlay } from './FeedbackOverlay';
import type { Question } from '@/types/question';

/** Map our richer modeId values onto leaderboard buckets. */
function toScoreboardMode(modeId: string): ScoreboardMode | null {
  if (modeId === 'quick-play') return 'quick-play';
  if (modeId === 'survival') return 'survival';
  if (modeId === 'daily') return 'daily';
  if (modeId === 'penalty') return 'penalty';
  if (modeId.startsWith('career-')) return 'career';
  if (modeId.startsWith('party-')) return 'party';
  return null;
}

export interface QuizFinishPayload {
  summary: RunSummary;
  fired: string[];
  xpGained: number;
  newLevel: number;
  levelUps: number;
}

interface QuizRunnerProps {
  config: EngineConfig;
  modeId: string;
  modeLabel: string;
  /** Where to send the user when the run ends. Defaults to /results. */
  onFinish?: (payload: QuizFinishPayload) => void;
  /** Render an extra HUD slot above the question card (e.g. lives, penalty score). */
  hudSlot?: React.ReactNode;
}

interface FeedbackState {
  open: boolean;
  correct: boolean;
  points: number;
  /** The question that was just answered (so the explanation matches it). */
  question: Question | null;
}

export function QuizRunner({ config, modeId, modeLabel, onFinish, hudSlot }: QuizRunnerProps) {
  const navigate = useNavigate();
  const audio = useAudio();
  const applyRun = useProfile((s) => s.applyRun);
  const unlockAchievement = useProfile((s) => s.unlockAchievement);

  const [engine, setEngine] = useState<EngineState>(() => startEngine(createEngineState(config)));
  const [feedback, setFeedback] = useState<FeedbackState>({
    open: false,
    correct: false,
    points: 0,
    question: null,
  });
  const [flash, setFlash] = useState<'none' | 'correct' | 'wrong'>('none');

  const question = useMemo(() => currentQuestion(engine), [engine]);
  const finishedRef = useRef(false);
  const submittingRef = useRef(false);

  const handleAnswer = useCallback(
    (event: AnswerEvent) => {
      if (engine.status !== 'running' || feedback.open || submittingRef.current) return;
      submittingRef.current = true;
      // Capture the question BEFORE the engine advances, so the feedback overlay
      // explains the question the user just answered, not the next one.
      const answeredQuestion = currentQuestion(engine);
      const outcome = submitAnswer(engine, config, event.correct, event.timeRemainingMs);
      const points = outcome.score?.total ?? 0;
      audio.play(event.correct ? 'correct' : 'wrong');
      setFlash(event.correct ? 'correct' : 'wrong');
      window.setTimeout(() => setFlash('none'), 600);
      setEngine(outcome.state);
      setFeedback({ open: true, correct: event.correct, points, question: answeredQuestion });
    },
    [engine, config, audio, feedback.open],
  );

  const handleTimeout = useCallback(() => {
    handleAnswer({ correct: false, timeRemainingMs: 0 });
  }, [handleAnswer]);

  const remaining = useTimer(
    config.perQuestionMs,
    engine.status !== 'running' || feedback.open,
    handleTimeout,
    question?.id,
  );

  const finalize = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const correct = engine.answered.filter((a) => a.correct).length;
    const total = engine.answered.length;
    const perQuestion = engine.answered.map((a) => {
      const q = engine.questions.find((qq) => qq.id === a.questionId);
      return {
        category: q?.category ?? 'culture',
        difficulty: q?.difficulty ?? 'easy',
        correct: a.correct,
      };
    });
    const summary: RunSummary = {
      modeId,
      score: engine.score,
      correct,
      total,
      bestStreak: engine.bestStreak,
      perQuestion,
      perfect: total > 0 && correct === total,
    };
    const xpResult = applyRun(summary);
    const profileAfter = useProfile.getState();
    const fired = checkAchievements(summary, profileAfter);
    for (const a of fired) unlockAchievement(a);
    if (xpResult.levelUps > 0) audio.play('level-up');

    // Submit to leaderboard (fire-and-forget; failures don't block the UI).
    const authState = useAuth.getState();
    if (authState.status === 'signed-in' && authState.user) {
      const scoreboardMode = toScoreboardMode(modeId);
      if (scoreboardMode) {
        submitScore(
          authState.user,
          scoreboardMode,
          profileAfter.displayName,
          summary.score,
          summary.bestStreak,
        ).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[leaderboard] submit failed', err);
        });
      }
    }

    const payload: QuizFinishPayload = {
      summary,
      fired,
      xpGained: xpResult.xpGained,
      newLevel: xpResult.newLevel,
      levelUps: xpResult.levelUps,
    };
    if (onFinish) {
      onFinish(payload);
    } else {
      navigate('/trivia/results', { state: { ...payload, modeLabel } });
    }
  }, [engine, modeId, modeLabel, applyRun, unlockAchievement, audio, onFinish, navigate]);

  const handleContinue = useCallback(() => {
    setFeedback((f) => ({ ...f, open: false }));
    submittingRef.current = false;
    if (engine.status === 'finished') {
      finalize();
    }
  }, [engine.status, finalize]);

  // Continue on Enter
  useEffect(() => {
    if (!feedback.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [feedback.open, handleContinue]);

  // Build progress dots
  const results = engine.answered.map((a) => (a.correct ? 'correct' : 'wrong')) as Array<'correct' | 'wrong'>;
  const totalDots = Math.min(config.questions.length, 15);
  const dotsResults: Array<'correct' | 'wrong' | 'pending'> = [
    ...results.slice(0, totalDots),
    ...Array.from({ length: Math.max(0, totalDots - results.length) }, () => 'pending' as const),
  ];

  // Edge case: empty pool at start. Different from "ran out after playing".
  if (engine.answered.length === 0 && !question) {
    return (
      <div className="py-16 text-center text-slate-300">
        <p>No questions available in this mode yet.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div
        className={[
          'pointer-events-none fixed inset-0 -z-0',
          flash === 'correct' ? 'animate-flash-correct' : '',
          flash === 'wrong' ? 'animate-flash-wrong' : '',
        ].join(' ')}
        aria-hidden
      />

      <div className="flex items-center justify-between gap-3">
        <Timer remainingMs={remaining} totalMs={config.perQuestionMs} />
        <div className="flex flex-col items-end gap-2">
          <ScoreDisplay score={engine.score} />
          <StreakBadge streak={engine.streak} />
        </div>
      </div>

      {hudSlot}

      <ProgressDots
        total={totalDots}
        current={Math.min(engine.index, totalDots - 1)}
        results={dotsResults}
      />

      {question ? (
        <Card className="p-5 sm:p-6">
          <QuestionCard
            question={question}
            totalTimeMs={config.perQuestionMs}
            remainingMs={remaining}
            onAnswer={handleAnswer}
            feedbackOpen={feedback.open}
          />
        </Card>
      ) : (
        // Run is over; the feedback overlay is showing the last question's explanation,
        // and clicking continue will finalize → navigate to results.
        <Card className="p-8 text-center">
          <p className="font-display text-3xl text-neon-cyan">Full time!</p>
          <p className="text-slate-300 mt-2">Tap continue to see your results.</p>
        </Card>
      )}

      <FeedbackOverlay
        open={feedback.open}
        correct={feedback.correct}
        pointsAwarded={feedback.points}
        question={feedback.question}
        onContinue={handleContinue}
        continueLabel={engine.status === 'finished' ? 'See results' : 'Next question'}
      />
    </div>
  );
}
