import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import type { WheelLanding } from '@/game/draft/wheel';

interface WheelProps {
  slots: WheelLanding[];
  /** Index of the slot the wheel should land on. */
  landingIndex: number;
  /** Trigger animation. Changing this prop starts a spin. */
  spinToken: number;
  onSpinEnd?: () => void;
}

const CARD_WIDTH = 220; // px
const CARD_GAP = 12;

/**
 * Horizontal "spin the wheel" — a strip of club/season cards scrolls past a
 * centre line and decelerates onto the target landing.
 */
export function Wheel({ slots, landingIndex, spinToken, onSpinEnd }: WheelProps) {
  const controls = useAnimationControls();
  const [hasSpun, setHasSpun] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Build a long repeating strip so the wheel can spin many widths.
  const repeats = 8;
  const repeated: Array<{ slot: WheelLanding; copy: number }> = [];
  for (let r = 0; r < repeats; r++) {
    for (const slot of slots) repeated.push({ slot, copy: r });
  }

  const stride = CARD_WIDTH + CARD_GAP;
  const totalSlots = slots.length;
  // Target the landing inside the last copy so we travel far before settling.
  const targetIndex = (repeats - 1) * totalSlots + landingIndex;
  const targetX = -(targetIndex * stride);

  useEffect(() => {
    if (spinToken === 0) return;
    setHasSpun(true);
    // Reset position to near the start, then animate to target.
    controls.set({ x: 0 });
    controls
      .start({
        x: targetX,
        transition: { duration: 3, ease: [0.22, 0.92, 0.32, 1] },
      })
      .then(() => onSpinEnd?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken]);

  return (
    <div
      ref={containerRef}
      className="relative h-32 overflow-hidden rounded-2xl border border-white/10 bg-stadium-900/60"
    >
      <motion.div
        className="absolute top-0 flex h-full items-center gap-3 will-change-transform"
        // Position the strip so that at x=0 the FIRST card is centered in the
        // parent. Translating by -targetIndex * stride then centers card[targetIndex].
        style={{ left: `calc(50% - ${CARD_WIDTH / 2}px)` }}
        animate={controls}
        initial={{ x: 0 }}
      >
        {repeated.map((r, i) => (
          <WheelCard key={`${r.copy}-${r.slot.club}-${r.slot.season}-${i}`} slot={r.slot} />
        ))}
      </motion.div>
      {/* Centre indicator */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[222px] rounded-2xl ring-2 ring-neon-cyan/70 shadow-[0_0_30px_rgba(34,211,238,0.25)]" />
      {!hasSpun && (
        <div className="absolute inset-0 flex items-center justify-center bg-stadium-950/40 text-sm text-slate-300">
          Press <span className="mx-1 font-semibold text-neon-cyan">Spin</span> to start the draft
        </div>
      )}
    </div>
  );
}

function WheelCard({ slot }: { slot: WheelLanding }) {
  return (
    <div
      className="shrink-0 h-24 flex flex-col justify-center rounded-xl border border-white/10 bg-stadium-800/80 px-4"
      style={{ width: CARD_WIDTH }}
    >
      <div className="font-display text-lg leading-tight truncate">{slot.club}</div>
      <div className="text-xs text-slate-400">{slot.season}</div>
    </div>
  );
}
