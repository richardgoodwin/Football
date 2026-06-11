import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import tips from '@/data/tips.json';

export function NewsTicker() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i + 1) % tips.length), 5000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <Radio size={16} className="text-neon-lime shrink-0" />
      <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">LIVE</span>
      <div className="relative h-5 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.p
            key={idx}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm text-slate-200 truncate"
          >
            {tips[idx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
