import { useEffect, useRef, useState } from 'react';

/**
 * Countdown timer in ms. Calls onExpire when it reaches 0. Pausing freezes the clock.
 * The timer resets when `totalMs` or `resetKey` changes.
 */
export function useTimer(
  totalMs: number,
  paused: boolean,
  onExpire: () => void,
  resetKey?: string | number,
) {
  const [remaining, setRemaining] = useState(totalMs);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(totalMs);
    expiredRef.current = false;
  }, [totalMs, resetKey]);

  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const startingRemaining = remaining;

    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const next = Math.max(0, startingRemaining - elapsed);
      setRemaining(next);
      if (next <= 0) {
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, totalMs, resetKey]);

  return remaining;
}
