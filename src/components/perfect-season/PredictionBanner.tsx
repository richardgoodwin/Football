import { TrendingUp, PartyPopper, ThumbsDown } from 'lucide-react';
import { ordinal } from '@/utils/format';

interface PredictionBannerProps {
  predictedPosition: number;
  /** When provided, shows the comparison + verdict (result screen). */
  actualPosition?: number;
}

function positionTitle(pos: number): string {
  if (pos === 1) return 'Champions';
  if (pos <= 4) return 'Top four';
  if (pos <= 6) return 'European places';
  if (pos <= 17) return 'Mid-table';
  return 'Relegation';
}

/**
 * Pre-season prediction. During the draft it shows the forecast alone; on the
 * result screen pass `actualPosition` to grade the season against it.
 */
export function PredictionBanner({ predictedPosition, actualPosition }: PredictionBannerProps) {
  if (actualPosition === undefined) {
    return (
      <div className="rounded-2xl border border-neon-lime/30 bg-gradient-to-r from-pitch-900/50 to-stadium-800/40 px-4 py-3 flex items-center gap-3">
        <TrendingUp className="text-neon-lime shrink-0" size={22} />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Pundits' prediction</div>
          <div className="font-display text-xl leading-tight">
            {ordinal(predictedPosition)} place — {positionTitle(predictedPosition)}
          </div>
        </div>
      </div>
    );
  }

  // "Better" = a numerically lower finish; matching a predicted title also counts.
  const beat =
    actualPosition < predictedPosition || (predictedPosition === 1 && actualPosition === 1);

  return (
    <div
      className={[
        'rounded-2xl border px-4 py-4 space-y-2',
        beat
          ? 'border-neon-lime/50 bg-gradient-to-r from-pitch-700/30 to-pitch-900/30'
          : 'border-amber-500/40 bg-amber-500/5',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        {beat ? (
          <PartyPopper className="text-neon-lime" size={20} />
        ) : (
          <ThumbsDown className="text-amber-300" size={20} />
        )}
        <span className="font-display text-xl">
          {beat ? 'Congratulations — you beat the prediction!' : 'Better luck next time'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-400">
          Predicted <strong className="text-slate-200">{ordinal(predictedPosition)}</strong>
        </span>
        <span className="text-slate-500">→</span>
        <span className="text-slate-400">
          Finished{' '}
          <strong className={beat ? 'text-neon-lime' : 'text-amber-300'}>
            {ordinal(actualPosition)}
          </strong>
        </span>
      </div>
    </div>
  );
}
