import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swords, Crown, Users, User, Trophy, Sparkles, Library, Shield } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDraft } from '@/store/draftStore';
import { useProfile } from '@/store/profileStore';
import { FORMATION_LIST } from '@/game/draft/constraints';
import type { FormationId, SeasonDifficulty } from '@/types/draft';

const DIFFICULTIES: { id: SeasonDifficulty; label: string; blurb: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Gentle opposition' },
  { id: 'normal', label: 'Normal', blurb: 'A real title race' },
  { id: 'hard', label: 'Hard', blurb: 'Elite opponents' },
  { id: 'legendary', label: 'Legendary', blurb: '38-0 is near-mythical' },
];

export function Lobby() {
  const navigate = useNavigate();
  const [chosen, setChosen] = useState<FormationId>('4-3-3');
  const {
    formationId,
    picks,
    lastResult,
    totalAttempts,
    bestPoints,
    perfectSeasons,
    startDraft,
    clearDraft,
    difficulty,
    setDifficulty,
  } = useDraft();
  const displayName = useProfile((s) => s.displayName);

  const inProgress = formationId !== null && picks.length > 0 && picks.length < 11;

  function startNewDraft() {
    startDraft(chosen);
    navigate('/perfect-season/draft');
  }

  return (
    <Screen>
      <section className="py-6 sm:py-10 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl tracking-wide text-neon-cyan">
              Dickie's Perfect Season
            </h1>
            <p className="text-slate-300 mt-1">
              Welcome back, <span className="font-semibold">{displayName}</span>. Draft an XI from
              English top-flight history and chase the perfect 38-0 season.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Attempts" value={totalAttempts} />
          <Stat label="Best points" value={bestPoints} accent="cyan" />
          <Stat label="Perfect seasons" value={perfectSeasons} accent="amber" />
        </div>

        {/* Resume draft */}
        {inProgress && (
          <Card className="p-5 flex flex-wrap items-center justify-between gap-3" glow>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">Draft in progress</div>
              <div className="font-display text-2xl">
                {picks.length}/11 picked · {formationId}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/perfect-season/draft')}>
                <Sparkles size={16} className="inline-block mr-2" />
                Resume
              </Button>
              <Button variant="ghost" onClick={clearDraft}>
                Discard
              </Button>
            </div>
          </Card>
        )}

        {/* Formation picker + start */}
        <Card className="p-5 space-y-4" glow={!inProgress}>
          <h3 className="text-xs uppercase tracking-wider text-slate-400">Pick a formation</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FORMATION_LIST.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setChosen(f.id)}
                disabled={inProgress}
                className={[
                  'rounded-xl border px-3 py-3 text-center transition-colors',
                  chosen === f.id
                    ? 'border-neon-cyan bg-neon-cyan/15 text-slate-100'
                    : 'border-white/10 bg-white/5 hover:bg-white/10',
                  inProgress ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <div className="font-display text-2xl tracking-wide">{f.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {f.slots.GK}-{f.slots.DEF}-{f.slots.MID}-{f.slots.FWD}
                </div>
              </button>
            ))}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Difficulty</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={[
                    'rounded-xl border px-3 py-2.5 text-center transition-colors',
                    difficulty === d.id
                      ? 'border-neon-amber bg-neon-amber/15 text-slate-100'
                      : 'border-white/10 bg-white/5 hover:bg-white/10',
                  ].join(' ')}
                >
                  <div className="font-semibold">{d.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{d.blurb}</div>
                </button>
              ))}
            </div>
          </div>
          <Button size="lg" onClick={startNewDraft} disabled={inProgress}>
            <Swords size={18} className="inline-block mr-2" />
            Start a new draft
          </Button>
        </Card>

        {/* Last result */}
        {lastResult && (
          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-slate-400">Last season</h3>
              {lastResult.perfect && (
                <span className="text-neon-amber text-xs font-bold uppercase">38-0 perfect</span>
              )}
            </div>
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display text-4xl tabular-nums">
                  {lastResult.wins}-{lastResult.draws}-{lastResult.losses}
                </div>
                <div className="text-sm text-slate-400">
                  {lastResult.points} pts · {lastResult.goalsFor}-{lastResult.goalsAgainst} GD ·
                  position {lastResult.position}
                </div>
              </div>
              <Button variant="secondary" onClick={() => navigate('/perfect-season/result')}>
                See details
              </Button>
            </div>
          </Card>
        )}

        {/* Secondary tiles */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <Tile to="/leagues" icon={<Shield size={18} />} title="Friends League" subtitle="Your XIs, one season" accent="amber" />
          <Tile to="/friends" icon={<Users size={18} />} title="Versus a Friend" subtitle="Multiplayer matches" accent="pink" />
          <Tile to="/leaderboard" icon={<Crown size={18} />} title="Leaderboards" subtitle="Global rankings" accent="amber" />
          <Tile to="/profile" icon={<User size={18} />} title="Profile & Stats" subtitle="Your career" accent="cyan" />
          <Tile to="/trivia" icon={<Library size={18} />} title="Classic Trivia" subtitle="The original quiz" accent="lime" />
        </div>

        <div className="text-center">
          <Link to="/achievements" className="text-xs text-slate-500 hover:text-slate-300">
            <Trophy size={12} className="inline-block mr-1" />
            Achievements
          </Link>
          <span className="text-slate-700 mx-2">·</span>
          <Link to="/cosmetics" className="text-xs text-slate-500 hover:text-slate-300">
            Cosmetics
          </Link>
        </div>
      </section>
    </Screen>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'cyan' | 'amber' }) {
  const colour = accent === 'amber' ? 'text-neon-amber' : accent === 'cyan' ? 'text-neon-cyan' : 'text-slate-100';
  return (
    <Card className="p-4 text-center">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className={['font-display text-3xl tabular-nums mt-1', colour].join(' ')}>{value}</div>
    </Card>
  );
}

function Tile({ to, icon, title, subtitle, accent }: { to: string; icon: React.ReactNode; title: string; subtitle: string; accent: 'pink' | 'amber' | 'cyan' | 'lime' }) {
  const map = {
    pink: 'text-neon-pink',
    amber: 'text-neon-amber',
    cyan: 'text-neon-cyan',
    lime: 'text-neon-lime',
  } as const;
  return (
    <Link to={to} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3">
      <span className={map[accent]}>{icon}</span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
    </Link>
  );
}
