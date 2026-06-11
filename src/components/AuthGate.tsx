import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/store/authStore';
import { Screen } from './layout/Screen';

interface AuthGateProps {
  children: ReactNode;
}

/**
 * Wraps routes that require an authenticated user when Firebase is configured.
 * When Firebase isn't configured, the gate is a no-op (local-only mode).
 */
export function AuthGate({ children }: AuthGateProps) {
  const status = useAuth((s) => s.status);
  const location = useLocation();

  if (status === 'unconfigured') return <>{children}</>;

  if (status === 'loading') {
    return (
      <Screen showTopBar={false}>
        <div className="py-32 text-center text-slate-400">Loading…</div>
      </Screen>
    );
  }

  if (status === 'signed-out') {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
