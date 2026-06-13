import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Check, X } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import { useProfile } from '@/store/profileStore';
import {
  acceptLeagueInvite,
  createLeague,
  declineLeagueInvite,
  loadLeagueInvites,
  loadMyLeagues,
  type LeagueDoc,
} from '@/lib/leagues';
import { FIREBASE_CONFIGURED } from '@/lib/firebase';

export function Leagues() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const displayName = useProfile((s) => s.displayName);
  const [mine, setMine] = useState<LeagueDoc[]>([]);
  const [invites, setInvites] = useState<LeagueDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [m, i] = await Promise.all([loadMyLeagues(user.uid), loadLeagueInvites(user.uid)]);
      setMine(m);
      setInvites(i);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!FIREBASE_CONFIGURED) {
    return (
      <Screen title="Friends League">
        <div className="py-12 text-center text-slate-300">
          Leagues need Firebase. See the README for setup.
        </div>
      </Screen>
    );
  }
  if (!user) {
    return (
      <Screen title="Friends League">
        <div className="py-12 text-center text-slate-300">Sign in to use leagues.</div>
      </Screen>
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createLeague(user, displayName, name);
      navigate(`/league/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Screen title="Friends League">
      <section className="py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="text-neon-amber" />
          <h2 className="font-display text-4xl tracking-wide">Friends League</h2>
        </div>
        <p className="text-slate-300 text-sm">
          Invite friends, everyone enters their drafted XI, AI teams fill the rest, and a full
          home-and-away season decides the champion.
        </p>

        {/* Create */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">Create a league</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${displayName}'s League`}
              className="w-full px-4 py-2.5 rounded-xl bg-stadium-900/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60"
            />
            <p className="text-xs text-slate-400">
              A 38-team division — invite as many friends as you like, AI teams fill the rest.
              Two games a week (Wed &amp; Sat, 3pm) across a full 38-game season.
            </p>
            {error && <p className="text-sm text-wrong">{error}</p>}
            <Button type="submit" disabled={busy}>
              <Plus size={16} className="inline-block mr-2" />
              Create league
            </Button>
          </form>
        </Card>

        {/* Invites */}
        {invites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-400">League invites</h3>
            {invites.map((l) => (
              <Card key={l.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong>{l.name}</strong>
                  <div className="text-xs text-slate-400">
                    {l.memberUids.length}/{l.size} joined · created by{' '}
                    {l.members[l.createdBy]?.displayName ?? 'a friend'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      acceptLeagueInvite(l, user, displayName).then(() => navigate(`/league/${l.id}`))
                    }
                  >
                    <Check size={14} className="inline-block mr-1" />
                    Join
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => declineLeagueInvite(l.id, user.uid).then(reload)}>
                    <X size={14} className="inline-block mr-1" />
                    Decline
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* My leagues */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">
            My leagues ({mine.length})
          </h3>
          {loading && mine.length === 0 ? (
            <Card className="p-4 text-sm text-slate-400">Loading…</Card>
          ) : mine.length === 0 ? (
            <Card className="p-4 text-sm text-slate-400">
              No leagues yet — create one above and invite your friends.
            </Card>
          ) : (
            mine.map((l) => (
              <Card key={l.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong>{l.name}</strong>
                  <div className="text-xs text-slate-400">
                    {l.memberUids.length}/{l.size} joined ·{' '}
                    {l.status === 'completed' ? 'season complete' : 'waiting in lobby'}
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate(`/league/${l.id}`)}>
                  {l.status === 'completed' ? 'View table' : 'Open'}
                </Button>
              </Card>
            ))
          )}
        </div>
      </section>
    </Screen>
  );
}
