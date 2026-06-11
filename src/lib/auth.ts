import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

function requireAuth() {
  if (!auth) throw new Error('Firebase auth is not configured.');
  return auth;
}

export async function signInWithGoogle(): Promise<User> {
  const a = requireAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(a, provider);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const a = requireAuth();
  const result = await signInWithEmailAndPassword(a, email, password);
  return result.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<User> {
  const a = requireAuth();
  const result = await createUserWithEmailAndPassword(a, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function signOutCurrent(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
