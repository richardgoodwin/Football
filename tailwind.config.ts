import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
          900: '#14532d',
        },
        stadium: {
          950: '#050816',
          900: '#0b1220',
          800: '#111a30',
          700: '#1a2545',
        },
        neon: {
          cyan: '#22d3ee',
          lime: '#a3e635',
          pink: '#f472b6',
          amber: '#fbbf24',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-correct': 'flashCorrect 0.6s ease-out',
        'flash-wrong': 'flashWrong 0.6s ease-out',
        'streak-pop': 'streakPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spotlight': 'spotlight 8s ease-in-out infinite',
      },
      keyframes: {
        flashCorrect: {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0)' },
          '20%': { backgroundColor: 'rgba(34, 197, 94, 0.35)' },
          '100%': { backgroundColor: 'rgba(34, 197, 94, 0)' },
        },
        flashWrong: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0)' },
          '20%': { backgroundColor: 'rgba(239, 68, 68, 0.35)' },
          '100%': { backgroundColor: 'rgba(239, 68, 68, 0)' },
        },
        streakPop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        spotlight: {
          '0%, 100%': { transform: 'translateX(-15%) translateY(-10%)' },
          '50%': { transform: 'translateX(15%) translateY(10%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
