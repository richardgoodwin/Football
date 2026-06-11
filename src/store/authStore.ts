import { create } from 'zustand';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, FIREBASE_CONFIGURED } from '@/lib/firebase';

export type AuthStatus = 'unconfigured' | 'loading' | 'signed-out' | 'signed-in';

interface AuthState {
  status: AuthStatus;
  user: User | null;
}

export const useAuth = create<AuthState>(() => ({
  status: FIREBASE_CONFIGURED ? 'loading' : 'unconfigured',
  user: null,
}));

if (FIREBASE_CONFIGURED && auth) {
  onAuthStateChanged(auth, (user) => {
    useAuth.setState({
      status: user ? 'signed-in' : 'signed-out',
      user,
    });
  });
}
