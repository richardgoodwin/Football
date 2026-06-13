import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, RotateCw, Home, Share2, FastForward } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SquadView } from '@/components/perfect-season/SquadView';
import { useDraft } from '@/store/draftStore';
import { FORMATIONS } from '@/game/draft/constraints';
import { RETIREMENT_AGE } from '@/game/draft/aging';

export function SeasonResult() {
  const navigate = useNavigate();
  const { lastResult, clearDraft, continueDynasty, applyRetirements } = useDraft();

  const formation = useMemo(
    () => (lastResult ? FORMATIONS[lastResult.formationId] : null),
    [lastResult],
  );

  if (!lastResult || !formation) {
    return (
      <Screen title="Result">
        <div className="py-12 text-center space-y-3">
          <p className="text-slate-300">No season to show — start a new draft.</p>
          <Button onClick={() => navigate('/perfect-season')}>Back to lobby</Button>
        </div>
      </Screen>
    );
  }

  const r = lastResult;
  const gd = r.goalsFor - r.goalsAgainst;
  const positionLabel = positionToLabel(r.position);

  const seasonNumber = r.seasonNumber ?? 1;
  const yearsAged = seasonNumber - 1;
  const avgAge =
    r.squad.length > 0
      ? r.squad.reduce((sum, p) => sum + (p.player.age ?? 26), 0) / r.squad.length
      : 0;

  // Players who will turn the retirement age next season.
  const retiringNext = r.squad.filter((p) => (p.player.age ?? 0) >= RETIREMENT_AGE - 1);

  function playAgain() {
    clearDraft();
    navigate('/perfect-season');
  }

  function nextSeason() {
    continueDynasty();
    applyRetirements();
    // If retirements left holes in the XI, go re-draft replacements first.
    const st = useDraft.getState();
    if (st.picks.length < 11) {
      navigate('/perfect-season/draft');
    } else {
      navigate('/perfect-season/simulating');
    }
  }

  function shareText() {
    const summary = `${r.wins}W ${r.draws}D ${r.losses}L · ${r.points} pts · ${r.goalsFor}-${r.goalsAgainst}`;
    const headline = r.perfect ? '38-0 PERFECT SEASON!' : 'Just simulated my XI';
    return `${headline} on Dickie's Perfect Season — ${summary}`;
  }

  function doShare() {
    const text = shareText();
    if (navigator.share) {
      navigator.share({ title: "Dickie's Perfect Season", text }).catch(() => undefined);
    } else {
      navigator.clipboard?.writeText(text).then(() => alert('Result copied to clipboard.'));
    }
  }

  return (
    <Screen title="Result">
      <section className="py-6 space-y-5 max-w-3xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="text-center"
        >
          <Trophy
            className={['mx-auto', r.perfect ? 'text-neon-amber' : 'text-neon-cyan'].join(' ')}
            size={56}
          />
          <h2 className={['font-display text-5xl mt-2', r.perfect ? 'text-neon-amber' : ''].join(' ')}>
            {r.perfect ? '38-0 PERFECT' : positionLabel}
          </h2>
          <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">
            Dynasty season {seasonNumber} · {r.difficulty ?? 'normal'} difficulty
            {yearsAged > 0 && ` · squad has aged ${yearsAged} year${yearsAged === 1 ? '' : 's'}`}
          </p>
          {!r.perfect && (
            <p className="text-slate-400 text-sm">
              {r.points >= 95
                ? 'Title-winning run — a clean sheet on the trophy cabinet.'
                : r.points >= 75
                  ? 'Champions League football secured.'
                  : r.points >= 50
                    ? 'Comfortable mid-table.'
                    : 'Relegation scrap.'}
            </p>
          )}
        </motion.div>

        {/* Stat block */}
        <Card className="p-6 text-center" glow>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <ResultStat label="W" value={r.wins} accent={r.perfect ? 'amber' : 'cyan'} />
            <ResultStat label="D" value={r.draws} />
            <ResultStat label="L" value={r.losses} accent={r.losses > 10 ? 'wrong' : undefined} />
            <ResultStat label="GF" value={r.goalsFor} />
            <ResultStat label="GA" value={r.goalsAgainst} />
            <ResultStat label="Pts" value={r.points} accent="cyan" />
          </div>
          <div className="text-sm text-slate-400 mt-3">
            Goal difference {gd >= 0 ? `+${gd}` : gd} · Squad strength {r.squadStrength.toFixed(1)} · Formation {formation.label}
          </div>
        </Card>

        {/* Squad */}
        <Card className="p-5">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">
            Your XI{avgAge > 0 && ` · avg age ${avgAge.toFixed(1)}`}
          </h3>
          <SquadView picks={r.squad} formation={formation} />
        </Card>

        {/* Retirement notice */}
        {retiringNext.length > 0 && (
          <Card className="p-4 border border-neon-amber/30 bg-neon-amber/5">
            <h3 className="text-xs uppercase tracking-wider text-neon-amber mb-1">
              Retiring after this season (age {RETIREMENT_AGE})
            </h3>
            <p className="text-sm text-slate-300">
              {retiringNext.map((p) => p.player.name).join(', ')} — you'll re-spin to draft
              {retiringNext.length === 1 ? ' a replacement' : ' replacements'} when you start next
              season.
            </p>
          </Card>
        )}

        {/* Match log */}
        <Card className="p-5">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">Match log</h3>
          <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-[repeat(19,minmax(0,1fr))] gap-1">
            {r.matches.map((m, i) => (
              <div
                key={i}
                title={`Matchday ${i + 1}: ${m.result} ${m.goalsFor}-${m.goalsAgainst}`}
                className={[
                  'aspect-square rounded text-[10px] flex items-center justify-center font-bold',
                  m.result === 'W' ? 'bg-correct/30 text-correct' : '',
                  m.result === 'D' ? 'bg-white/10 text-slate-200' : '',
                  m.result === 'L' ? 'bg-wrong/30 text-wrong' : '',
                ].join(' ')}
              >
                {m.result}
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={nextSeason}>
            <FastForward size={16} className="inline-block mr-2" />
            {retiringNext.length > 0 ? 'Next season (re-spin retirees)' : 'Next season (squad ages)'}
          </Button>
          <Button variant="secondary" onClick={playAgain}>
            <RotateCw size={16} className="inline-block mr-2" />
            New draft
          </Button>
          <Button variant="secondary" onClick={doShare}>
            <Share2 size={16} className="inline-block mr-2" />
            Share
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            <Home size={16} className="inline-block mr-2" />
            Home
          </Button>
        </div>
      </section>
    </Screen>
  );
}

function ResultStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'cyan' | 'amber' | 'wrong';
}) {
  const colour =
    accent === 'amber'
      ? 'text-neon-amber'
      : accent === 'cyan'
        ? 'text-neon-cyan'
        : accent === 'wrong'
          ? 'text-wrong'
          : 'text-slate-100';
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className={['font-display text-3xl tabular-nums', colour].join(' ')}>{value}</div>
    </div>
  );
}

function positionToLabel(pos: number): string {
  if (pos === 1) return 'CHAMPIONS';
  if (pos === 2) return 'RUNNERS-UP';
  if (pos <= 4) return 'TOP FOUR';
  if (pos <= 6) return 'EUROPEAN PLACES';
  if (pos <= 12) return 'MID-TABLE';
  if (pos <= 17) return 'BATTLED CLEAR';
  return 'RELEGATED';
}
