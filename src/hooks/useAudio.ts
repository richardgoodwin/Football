import { useCallback, useEffect, useRef } from 'react';
import { useSettings } from '@/store/settingsStore';

type SoundId = 'correct' | 'wrong' | 'tick' | 'whistle' | 'level-up';

/**
 * Lightweight audio bridge. Uses WebAudio synthesised tones rather than asset files
 * so the MVP works with zero binary assets. Honors mute + master volume.
 *
 * Howler is wired into the dependency list and ready to be swapped in by replacing
 * the synth body when real sfx assets land.
 */
export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const muted = useSettings((s) => s.muted);
  const master = useSettings((s) => s.masterVolume);
  const sfx = useSettings((s) => s.sfxVolume);

  const getCtx = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      try {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new Ctor();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
    };
  }, []);

  const play = useCallback(
    (id: SoundId) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);

      const volume = Math.max(0, Math.min(1, master * sfx));
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);

      switch (id) {
        case 'correct':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(660, now);
          osc.frequency.exponentialRampToValueAtTime(990, now + 0.18);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.25 * volume, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'wrong':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2 * volume, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        case 'tick':
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08 * volume, now + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'whistle':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1320, now);
          osc.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.18 * volume, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        case 'level-up':
          [523.25, 659.25, 783.99].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g).connect(ctx.destination);
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq, now + i * 0.08);
            g.gain.setValueAtTime(0, now + i * 0.08);
            g.gain.linearRampToValueAtTime(0.18 * volume, now + i * 0.08 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.3);
            o.start(now + i * 0.08);
            o.stop(now + i * 0.08 + 0.32);
          });
          break;
      }
    },
    [muted, master, sfx, getCtx],
  );

  return { play };
}
