import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { FIREBASE_CONFIGURED } from '@/lib/firebase';

export function LocalModeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (FIREBASE_CONFIGURED || dismissed) return null;

  return (
    <div className="bg-neon-amber/15 border-b border-neon-amber/30 text-amber-100 text-sm">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3">
        <Info size={16} className="shrink-0 text-neon-amber" />
        <span className="flex-1">
          Local-only mode — sign-in and leaderboards are disabled. Add Firebase config in{' '}
          <code className="text-neon-amber">.env.local</code> to enable cloud features.
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/10 rounded"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
