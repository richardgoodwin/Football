import type { Category, Difficulty } from '@/types/question';
import { CATEGORY_LABEL } from '@/types/question';

interface CategoryPillProps {
  category: Category;
  difficulty: Difficulty;
}

const difficultyColours: Record<Difficulty, string> = {
  easy: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  medium: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
  hard: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  legendary: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30',
};

export function CategoryPill({ category, difficulty }: CategoryPillProps) {
  return (
    <span className="flex items-center gap-2">
      <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-200 text-xs font-medium">
        {CATEGORY_LABEL[category]}
      </span>
      <span
        className={[
          'px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide',
          difficultyColours[difficulty],
        ].join(' ')}
      >
        {difficulty}
      </span>
    </span>
  );
}
