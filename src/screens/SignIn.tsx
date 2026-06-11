import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/auth';
import { FIREBASE_CONFIGURED } from '@/lib/firebase';

type Mode = 'sign-in' | 'sign-up';

export function SignIn() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (auth.status === 'signed-in') return <Navigate to="/" replace />;

  if (!FIREBASE_CONFIGURED) {
    return (
      <Screen title="Sign in" showTopBar={false}>
        <section className="py-20 max-w-md mx-auto text-center space-y-4">
          <h1 className="font-display text-4xl text-neon-cyan">Firebase not set up</h1>
          <p className="text-slate-300">
            The app is running in local-only mode. Add Firebase config in <code className="text-neon-amber">.env.local</code>{' '}
            to enable sign-in and cloud features. See the README for setup steps.
          </p>
          <Button onClick={() => navigate('/')}>Continue offline</Button>
        </section>
      </Screen>
    );
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'sign-in') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name || undefined);
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Sign in" showTopBar={false}>
      <section className="py-12 max-w-md mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display text-4xl text-neon-cyan">Dickie's Big Football Quiz</h1>
          <p className="text-slate-300 mt-2">
            {mode === 'sign-in' ? 'Sign in to play' : 'Create an account to play'}
          </p>
        </motion.div>

        <Card className="p-6 space-y-4" glow>
          <Button onClick={handleGoogle} disabled={busy} fullWidth>
            <LogIn size={16} className="inline-block mr-2" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
            <span className="flex-1 h-px bg-white/10" />
            or
            <span className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'sign-up' && (
              <Field label="Display name (optional)">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stadium-900/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stadium-900/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stadium-900/70 border border-white/10 focus:outline-none focus:border-neon-cyan/60"
              />
            </Field>

            {error && (
              <p className="text-sm text-wrong bg-wrong/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" disabled={busy} fullWidth>
              <Mail size={16} className="inline-block mr-2" />
              {mode === 'sign-in' ? 'Sign in with email' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            {mode === 'sign-in' ? 'No account? ' : 'Already registered? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
                setError(null);
              }}
              className="text-neon-cyan hover:underline"
            >
              {mode === 'sign-in' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </Card>
      </section>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-slate-400 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    // Firebase error codes are like "auth/invalid-credential".
    const code = (err as { code?: string }).code ?? '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'An account already exists with that email.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in cancelled.';
      case 'auth/popup-blocked':
        return 'Browser blocked the sign-in popup. Allow popups for this site.';
      default:
        return err.message || 'Sign-in failed. Try again.';
    }
  }
  return 'Sign-in failed. Try again.';
}
