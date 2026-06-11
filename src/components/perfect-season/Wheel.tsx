import { motion } from 'framer-motion';
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
 * Horizontal "spin the wheel" — a strip of (club, season) cards scrolls past
 * a centre line and decelerates onto the target landing.
 *
 * Implementation notes:
 *  - At x=0, the FIRST card is centred in the parent (via left: 50% - CARD_WIDTH/2).
 *  - Each spin remounts the strip via `key={spinToken}` so x always starts at 0.
 *    That's simpler and more reliable than threading state through useAnimationControls.
 *  - We render multiple repeats of the slot list so the strip can travel many
 *    widths during the deceleration animation.
 */
export function Wheel({ slots, landingIndex, spinToken, onSpinEnd }: WheelProps) {
  const repeats = 8;
  const stride = CARD_WIDTH + CARD_GAP;
  const totalSlots = slots.length;
  const targetIndex = (repeats - 1) * totalSlots + landingIndex;
  const targetX = -(targetIndex * stride);

  // Build a long repeating strip so the wheel can spin many widths.
  const repeated: WheelLanding[] = [];
  for (let r = 0; r < repeats; r++) {
    for (const slot of slots) repeated.push(slot);
  }

  const initialTeaser = spinToken === 0;

  return (
    <div className="relative h-32 overflow-hidden rounded-2xl border border-white/10 bg-stadium-900/60">
      <motion.div
        key={spinToken}
        className="absolute top-0 flex h-full items-center gap-3 will-change-transform"
        style={{ left: `calc(50% - ${CARD_WIDTH / 2}px)` }}
        initial={{ x: 0 }}
        animate={{ x: targetX }}
        transition={spinToken === 0 ? { duration: 0 } : { duration: 3, ease: [0.22, 0.92, 0.32, 1] }}
        onAnimationComplete={() => {
          if (spinToken > 0) onSpinEnd?.();
        }}
      >
        {repeated.map((slot, i) => (
          <WheelCard key={i} slot={slot} />
        ))}
      </motion.div>

      {/* Centre indicator */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[222px] rounded-2xl ring-2 ring-neon-cyan/70 shadow-[0_0_30px_rgba(34,211,238,0.25)]" />

      {initialTeaser && (
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
