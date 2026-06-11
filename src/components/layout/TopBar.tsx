import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Trophy, Settings as SettingsIcon, User } from 'lucide-react';
import { useProfile } from '@/store/profileStore';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const level = useProfile((s) => s.level);
  const xp = useProfile((s) => s.xp);

  const atHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-stadium-950/60 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {!atHome && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-300"
              aria-label="Back"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <Link
            to="/"
            className="font-display text-xl tracking-wide text-neon-cyan"
            title="Dickie's Perfect Season"
          >
            <span className="hidden sm:inline">Dickie's Perfect Season</span>
            <span className="sm:hidden">Perfect Season</span>
          </Link>
          {title && (
            <span className="hidden sm:inline text-slate-400 text-sm truncate">
              · {title}
            </span>
          )}
        </div>
        <nav className="flex items-center gap-1 sm:gap-2 text-slate-300">
          <span
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs"
            title={`${xp.toLocaleString()} XP`}
          >
            <Trophy size={14} className="text-neon-amber" />
            Lv {level}
          </span>
          <Link to="/profile" className="p-1.5 rounded-lg hover:bg-white/5" aria-label="Profile">
            <User size={18} />
          </Link>
          <Link to="/settings" className="p-1.5 rounded-lg hover:bg-white/5" aria-label="Settings">
            <SettingsIcon size={18} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
