import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
}

export function Card({ children, glow, className = '', ...rest }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-white/10 bg-stadium-800/60 backdrop-blur-md shadow-xl',
        glow ? 'shadow-neon-cyan/10 ring-1 ring-neon-cyan/20' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
