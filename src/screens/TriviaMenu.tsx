import { Zap, Skull, Trophy, Target, Users, Calendar, Briefcase, Shirt, Crown, Swords, ArrowLeft } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { ModeTile } from '@/components/menu/ModeTile';
import { NewsTicker } from '@/components/menu/NewsTicker';
import { useProfile } from '@/store/profileStore';
import { useDaily } from '@/store/dailyStore';
import { dateKey } from '@/utils/rng';
import { Link } from 'react-router-dom';

export function TriviaMenu() {
  const profile = useProfile();
  const todayKey = dateKey();
  const dailyPlayed = useDaily((s) => s.hasPlayedToday(todayKey));

  return (
    <Screen title="Classic Trivia">
      <section className="py-6 sm:py-10 space-y-6">
        <Link to="/" className="inline-flex items-center text-sm text-slate-400 hover:text-neon-cyan">
          <ArrowLeft size={14} className="inline-block mr-1" />
          Back to Perfect Season
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl tracking-wide text-neon-cyan">
              Classic Trivia
            </h1>
            <p className="text-slate-300 mt-1">
              Welcome back, <span className="font-semibold">{profile.displayName}</span> · Level {profile.level} ·{' '}
              {profile.xp.toLocaleString()} XP
            </p>
          </div>
          <NewsTicker />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModeTile
            to="/trivia/quick-play"
            icon={<Zap />}
            title="Quick Play"
            blurb="10 questions, your difficulty, your categories."
            accent="cyan"
          />
          <ModeTile
            to="/trivia/daily"
            icon={<Calendar />}
            title="Daily Challenge"
            blurb={dailyPlayed ? 'Played today — come back tomorrow!' : 'Same 7 questions for everyone, every day.'}
            accent="lime"
            badge={dailyPlayed ? 'Done' : 'New'}
          />
          <ModeTile
            to="/trivia/survival"
            icon={<Skull />}
            title="Survival"
            blurb="One wrong answer ends the run. How far can you go?"
            accent="pink"
          />
          <ModeTile
            to="/trivia/penalty"
            icon={<Target />}
            title="Penalty Shootout"
            blurb="Best of 5 — every correct answer scores a goal."
            accent="amber"
          />
          <ModeTile
            to="/trivia/career"
            icon={<Briefcase />}
            title="Career Mode"
            blurb="Climb through Amateur, Pro, International and Legendary tiers."
            accent="cyan"
          />
          <ModeTile
            to="/trivia/party"
            icon={<Users />}
            title="Party Mode"
            blurb="Local pass-and-play, 2–4 players."
            accent="lime"
          />
          <ModeTile
            to="/friends"
            icon={<Swords />}
            title="Versus a Friend"
            blurb="Online turn-based challenges. No timer — play at your pace."
            accent="pink"
            badge="Online"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <Link to="/leaderboard" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3">
            <Crown className="text-neon-amber" />
            <div>
              <div className="font-semibold">Leaderboards</div>
              <div className="text-xs text-slate-400">Global rankings</div>
            </div>
          </Link>
          <Link to="/cosmetics" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3">
            <Shirt className="text-neon-amber" />
            <div>
              <div className="font-semibold">Cosmetics</div>
              <div className="text-xs text-slate-400">{profile.ownedCosmetics.length} owned</div>
            </div>
          </Link>
          <Link to="/achievements" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3">
            <Trophy className="text-neon-cyan" />
            <div>
              <div className="font-semibold">Achievements</div>
              <div className="text-xs text-slate-400">{profile.unlockedAchievements.length} unlocked</div>
            </div>
          </Link>
          <Link to="/profile" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3">
            <Users className="text-neon-pink" />
            <div>
              <div className="font-semibold">Profile & Stats</div>
              <div className="text-xs text-slate-400">{profile.stats.totalAnswered} questions answered</div>
            </div>
          </Link>
        </div>
      </section>
    </Screen>
  );
}
