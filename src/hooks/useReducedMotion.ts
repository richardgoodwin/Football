import { useEffect, useState } from 'react';
import { useSettings } from '@/store/settingsStore';

/**
 * Returns true if the user has reduced motion preferred at the OS level OR
 * has enabled the in-app override.
 */
export function useReducedMotion(): boolean {
  const override = useSettings((s) => s.reducedMotion);
  const [systemPrefers, setSystemPrefers] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemPrefers(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return override || systemPrefers;
}
