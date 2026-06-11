import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ModeTileProps {
  to: string;
  icon: ReactNode;
  title: string;
  blurb: string;
  accent?: 'cyan' | 'lime' | 'pink' | 'amber';
  disabled?: boolean;
  badge?: string;
}

const accentMap = {
  cyan: 'from-neon-cyan/20 to-transparent ring-neon-cyan/30',
  lime: 'from-neon-lime/20 to-transparent ring-neon-lime/30',
  pink: 'from-neon-pink/20 to-transparent ring-neon-pink/30',
  amber: 'from-neon-amber/20 to-transparent ring-neon-amber/30',
};

export function ModeTile({ to, icon, title, blurb, accent = 'cyan', disabled, badge }: ModeTileProps) {
  const content = (
    <motion.div
      whileHover={disabled ? undefined : { y: -3 }}
      className={[
        'relative h-full p-5 rounded-2xl border border-white/10 ring-1 bg-gradient-to-br',
        accentMap[accent],
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/20',
      ].join(' ')}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold bg-white/10 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-white/10 text-neon-cyan">{icon}</div>
        <div className="min-w-0">
          <h3 className="font-display text-2xl tracking-wide">{title}</h3>
          <p className="text-sm text-slate-300 mt-1">{blurb}</p>
        </div>
      </div>
    </motion.div>
  );

  if (disabled) return content;
  return <Link to={to}>{content}</Link>;
}
