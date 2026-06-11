import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Flag, Trophy } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import {
  acceptMatch,
  cancelMatch,
  canClaimForfeit,
  claimForfeit,
  declineMatch,
  questionForTurn,
  submitMatchAnswer,
  subscribeMatch,
  type MatchDoc,
} from '@/lib/matches';
import { PerfectSeasonMatchView } from './PerfectSeasonMatch';
import { buildOptions } from '@/game/questionFormats/multipleChoice';
import { AnswerButton } from '@/components/quiz/AnswerButton';
import { formatScore } from '@/utils/format';
import { CategoryPill } from '@/components/quiz/CategoryPill';
import { useAudio } from '@/hooks/useAudio';

export function Match() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [match, setMatch] = useState<MatchDoc | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [lastAnswerIndex, setLastAnswerIndex] = useState<number | null>(null);
  const audio = useAudio();

  // Live match subscription
  useEffect(() => {
    if (!id) return;
    return subscribeMatch(id, (m) => setMatch(m));
  }, [id]);

  // Show recap of the last answered question for ~3.5s. Only relevant for
  // trivia matches — perfect-season matches have their own view.
  useEffect(() => {
    if (!match || match.mode !== 'trivia' || match.turnIndex === 0) {
      setLastAnswerIndex(null);
      return;
    }
    setLastAnswerIndex(match.turnIndex - 1);
    const t = window.setTimeout(() => setLastAnswerIndex(null), 3500);
    return () => window.clearTimeout(t);
  }, [match]);

  if (match === undefined) {
    return (
      <Screen title="Match">
        <div className="py-12 text-center text-slate-400">Loading…</div>
      </Screen>
    );
  }
  if (match === null) {
    return (
      <Screen title="Match">
        <div className="py-12 text-center space-y-3">
          <p className="text-slate-300">Match not found.</p>
          <Link to="/friends" className="text-neon-cyan underline">Back to friends</Link>
        </div>
      </Screen>
    );
  }
  if (!user) {
    return (
      <Screen title="Match">
        <div className="py-12 text-center text-slate-300">Sign in to view this match.</div>
      </Screen>
    );
  }

  // Mode dispatch — Perfect Season matches have their own view.
  if (match.mode === 'perfect-season') {
    return <PerfectSeasonMatchView match={match} />;
  }

  // Below here, TypeScript narrows `match` to TriviaMatchDoc.
  const me = user.uid;
  const opp = match.players.find((p) => p !== me) ?? match.players[0];
  const myName = match.playerInfo[me]?.displayName ?? 'You';
  const oppName = match.playerInfo[opp]?.displayName ?? 'Opponent';
  const myScore = match.scores[me] ?? 0;
  const oppScore = match.scores[opp] ?? 0;

  // PENDING (waiting for opponent to accept)
  if (match.status === 'pending') {
    const iAmRecipient = match.createdBy !== me;
    return (
      <Screen title="Match">
        <section className="py-8 max-w-md mx-auto space-y-5 text-center">
          <h2 className="font-display text-3xl">vs {oppName}</h2>
          <Card className="p-5 space-y-3">
            <p className="text-slate-300">
              {iAmRecipient ? oppName : 'You'} sent a challenge —{' '}
              <strong>{match.questionsPerPlayer} questions each</strong>, no timer.
            </p>
            {iAmRecipient ? (
              <div className="flex gap-2 justify-center">
                <Button onClick={() => acceptMatch(match.id)}>Accept</Button>
                <Button variant="ghost" onClick={() => declineMatch(match.id).then(() => navigate('/friends'))}>
                  Decline
                </Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => cancelMatch(match.id).then(() => navigate('/friends'))}>
                Cancel challenge
              </Button>
            )}
          </Card>
          <Link to="/friends" className="text-slate-400 hover:text-neon-cyan text-sm">
            <ArrowLeft size={14} className="inline-block mr-1" />
            Back to friends
          </Link>
        </section>
      </Screen>
    );
  }

  // COMPLETED / DECLINED / CANCELLED
  if (match.status === 'completed' || match.status === 'declined' || match.status === 'cancelled') {
    const outcome =
      match.status === 'declined'
        ? `${oppName} declined the challenge.`
        : match.status === 'cancelled'
          ? 'Match was cancelled.'
          : match.winnerUid === 'tie'
            ? "It's a tie!"
            : match.winnerUid === me
              ? `You beat ${oppName}!`
              : `${oppName} beat you.`;

    return (
      <Screen title="Match">
        <section className="py-8 max-w-md mx-auto space-y-5">
          <div className="text-center">
            <Trophy className="mx-auto text-neon-amber" size={48} />
            <h2 className="font-display text-3xl mt-2">Full time</h2>
            <p className="text-slate-300">{outcome}</p>
          </div>
          <Card className="p-5 text-center" glow>
            <div className="grid grid-cols-2 gap-4">
              <PlayerScore name={myName} score={myScore} isWinner={match.winnerUid === me} />
              <PlayerScore name={oppName} score={oppScore} isWinner={match.winnerUid === opp} />
            </div>
          </Card>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/friends')}>Back to friends</Button>
          </div>
        </section>
      </Screen>
    );
  }

  // IN-PROGRESS
  const { question, isMyTurn } = questionForTurn(match, me);
  const totalQuestions = match.questions.length;
  const progressLabel = `Q${Math.min(match.turnIndex + 1, totalQuestions)} / ${totalQuestions}`;

  const lastAnswer = lastAnswerIndex !== null ? match.answers[String(lastAnswerIndex)] : null;
  const lastQuestion = lastAnswerIndex !== null ? match.questions[lastAnswerIndex] : null;

  async function handleAnswer(label: string) {
    if (!isMyTurn || submitting || !match) return;
    if (match.mode !== 'trivia') return;
    setSubmitting(true);
    const q = match.questions[match.turnIndex];
    const correct = q?.correct === label;
    audio.play(correct ? 'correct' : 'wrong');
    try {
      await submitMatchAnswer(match, me, label);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title={`vs ${oppName}`}>
      <section className="py-4 space-y-4 max-w-2xl mx-auto">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <PlayerScore name={myName} score={myScore} small isMe />
            <span className="text-slate-400 text-sm font-display">{progressLabel}</span>
            <PlayerScore name={oppName} score={oppScore} small align="right" />
          </div>
        </Card>

        {lastAnswer && lastQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={[
              'rounded-xl px-4 py-3 text-sm border',
              lastAnswer.correct
                ? 'border-correct/40 bg-correct/10 text-correct'
                : 'border-wrong/40 bg-wrong/10 text-wrong',
            ].join(' ')}
          >
            <strong>{lastAnswer.uid === me ? 'You' : oppName}</strong>{' '}
            {lastAnswer.correct ? 'got it right' : 'got it wrong'} on Q{lastAnswerIndex! + 1}
            {lastAnswer.correct && ` (+${lastAnswer.points})`} — answer was{' '}
            <em className="text-slate-200">{lastQuestion.correct}</em>.
          </motion.div>
        )}

        {isMyTurn && question && question.format === 'multiple-choice' && (
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <CategoryPill category={question.category} difficulty={question.difficulty} />
              <span className="text-xs text-slate-400">Your turn</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">{question.prompt}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buildOptions(question).map((opt) => (
                <AnswerButton
                  key={opt.label}
                  label={opt.label}
                  state={submitting ? 'disabled' : 'idle'}
                  onClick={() => handleAnswer(opt.label)}
                />
              ))}
            </div>
          </Card>
        )}

        {!isMyTurn && (
          <Card className="p-8 text-center space-y-3">
            <Clock className="mx-auto text-slate-400" size={36} />
            <p className="font-display text-2xl">Waiting on {oppName}…</p>
            <p className="text-sm text-slate-400">
              You'll be notified when it's your turn. Safe to close the tab — the match saves automatically.
            </p>
            {canClaimForfeit(match, me) && (
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Claim a forfeit win? ${oppName} hasn't taken their turn in over 7 days.`)) {
                    claimForfeit(match, me).catch((err) => alert((err as Error).message));
                  }
                }}
              >
                <Flag size={14} className="inline-block mr-2" />
                Claim forfeit win
              </Button>
            )}
          </Card>
        )}

        <div className="text-center">
          <Link to="/friends" className="text-sm text-slate-400 hover:text-neon-cyan">
            <ArrowLeft size={14} className="inline-block mr-1" />
            Back to friends
          </Link>
        </div>
      </section>
    </Screen>
  );
}

function PlayerScore({
  name,
  score,
  small,
  isMe,
  isWinner,
  align,
}: {
  name: string;
  score: number;
  small?: boolean;
  isMe?: boolean;
  isWinner?: boolean;
  align?: 'right';
}) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className={['text-xs uppercase tracking-wider', isWinner ? 'text-neon-amber' : 'text-slate-400'].join(' ')}>
        {name}
        {isMe ? ' (you)' : ''}
      </div>
      <div
        className={[
          'font-display tabular-nums',
          small ? 'text-2xl' : 'text-4xl',
          isWinner ? 'text-neon-amber' : 'text-neon-cyan',
        ].join(' ')}
      >
        {formatScore(score)}
      </div>
    </div>
  );
}
