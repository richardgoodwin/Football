import { LogOut } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/store/profileStore';
import { useAuth } from '@/store/authStore';
import { signOutCurrent } from '@/lib/auth';
import { xpForLevel } from '@/game/scoring';
import { CATEGORY_LABEL, type Category } from '@/types/question';

export function Profile() {
  const profile = useProfile();
  const authStatus = useAuth((s) => s.status);
  const authUser = useAuth((s) => s.user);
  const nextLevelXp = xpForLevel(profile.level + 1);
  const curLevelXp = xpForLevel(profile.level);
  const progress = nextLevelXp - curLevelXp === 0 ? 1 : (profile.xp - curLevelXp) / (nextLevelXp - curLevelXp);

  const acc =
    profile.stats.totalAnswered === 0
      ? 0
      : Math.round((profile.stats.totalCorrect / profile.stats.totalAnswered) * 100);

  return (
    <Screen title="Profile">
      <section className="py-6 space-y-6">
        <Card className="p-5 space-y-4" glow>
          <div className="flex items-center justify-between gap-3">
            <input
              value={profile.displayName}
              onChange={(e) => profile.setDisplayName(e.target.value)}
              className="text-2xl font-display tracking-wide bg-transparent border-b border-white/10 focus:outline-none focus:border-neon-cyan flex-1"
            />
            <span className="font-display text-3xl text-neon-cyan">Lv {profile.level}</span>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 flex justify-between">
              <span>XP {profile.xp.toLocaleString()}</span>
              <span>Next: {nextLevelXp.toLocaleString()}</span>
            </div>
            <div className="h-2.5 mt-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-lime"
                style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
              />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total answered" value={profile.stats.totalAnswered} />
          <Stat label="Accuracy" value={`${acc}%`} />
          <Stat label="Best survival" value={profile.stats.bestSurvivalStreak} />
          <Stat label="Daily streak" value={profile.stats.dailyStreak} />
          <Stat label="Runs completed" value={profile.stats.runsCompleted} />
          <Stat label="Perfect runs" value={profile.stats.perfectRuns} />
          <Stat label="Achievements" value={profile.unlockedAchievements.length} />
          <Stat label="Cosmetics" value={profile.ownedCosmetics.length} />
        </div>

        <Card className="p-5">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">By category</h3>
          <ul className="space-y-1.5">
            {(Object.keys(profile.stats.perCategory) as Category[]).map((cat) => {
              const s = profile.stats.perCategory[cat]!;
              const pct = s.answered === 0 ? 0 : Math.round((s.correct / s.answered) * 100);
              return (
                <li key={cat} className="flex items-center justify-between text-sm">
                  <span>{CATEGORY_LABEL[cat]}</span>
                  <span className="tabular-nums text-slate-400">
                    {s.correct}/{s.answered} · {pct}%
                  </span>
                </li>
              );
            })}
            {Object.keys(profile.stats.perCategory).length === 0 && (
              <li className="text-sm text-slate-400">Play some questions to see your category stats.</li>
            )}
          </ul>
        </Card>

        {authStatus === 'signed-in' && authUser && (
          <Card className="p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-400">Account</h3>
            <div className="text-sm">
              <div className="text-slate-300">{authUser.email ?? authUser.displayName ?? 'Signed in'}</div>
              <div className="text-slate-500 text-xs">Profile synced to the cloud</div>
            </div>
            <Button variant="secondary" onClick={() => signOutCurrent()}>
              <LogOut size={16} className="inline-block mr-2" />
              Sign out
            </Button>
          </Card>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer text-slate-400">Danger zone</summary>
          <div className="mt-3">
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Reset profile? All XP, cosmetics and achievements will be lost.')) {
                  profile.reset();
                }
              }}
            >
              Reset profile
            </Button>
          </div>
        </details>
      </section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </Card>
  );
}
