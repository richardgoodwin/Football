import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { StadiumBackground } from './StadiumBackground';
import { TopBar } from './TopBar';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ScreenProps {
  children: ReactNode;
  title?: string;
  showTopBar?: boolean;
}

export function Screen({ children, title, showTopBar = true }: ScreenProps) {
  const reduce = useReducedMotion();
  return (
    <div className="min-h-screen flex flex-col">
      <StadiumBackground />
      {showTopBar && <TopBar title={title} />}
      <motion.main
        className="flex-1 px-4 sm:px-6 pb-10 max-w-5xl mx-auto w-full"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {children}
      </motion.main>
    </div>
  );
}
