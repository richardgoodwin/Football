export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export type Category =
  | 'premier-league'
  | 'champions-league'
  | 'world-cup'
  | 'euros'
  | 'managers'
  | 'transfers'
  | 'legends'
  | 'stadiums'
  | 'kits'
  | 'records'
  | 'controversies'
  | 'culture';

export type QuestionFormat =
  | 'multiple-choice'
  | 'true-false'
  | 'guess-the-player'
  | 'career-path'
  | 'timeline';

export interface BaseQuestion {
  id: string;
  format: QuestionFormat;
  category: Category;
  difficulty: Difficulty;
  yearStart: number;
  yearEnd: number;
  tags: string[];
  explanation: string;
  funFact?: string;
  source?: string;
  popularity?: number;
}

export interface MultipleChoiceQ extends BaseQuestion {
  format: 'multiple-choice';
  prompt: string;
  correct: string;
  distractors: [string, string, string];
}

export interface TrueFalseQ extends BaseQuestion {
  format: 'true-false';
  prompt: string;
  correct: boolean;
}

export interface GuessThePlayerQ extends BaseQuestion {
  format: 'guess-the-player';
  clues: string[];
  correct: string;
  acceptedAnswers: string[];
}

export interface CareerPathQ extends BaseQuestion {
  format: 'career-path';
  timeline: Array<{ years: string; club: string }>;
  correct: string;
  acceptedAnswers: string[];
}

export interface TimelineQ extends BaseQuestion {
  format: 'timeline';
  prompt: string;
  items: Array<{ label: string; sortKey: number }>;
}

export type Question =
  | MultipleChoiceQ
  | TrueFalseQ
  | GuessThePlayerQ
  | CareerPathQ
  | TimelineQ;

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.3,
  hard: 1.7,
  legendary: 2.5,
};

export const CATEGORY_LABEL: Record<Category, string> = {
  'premier-league': 'Premier League',
  'champions-league': 'Champions League',
  'world-cup': 'World Cup',
  euros: 'Euros',
  managers: 'Managers',
  transfers: 'Transfers',
  legends: 'Legends',
  stadiums: 'Stadiums',
  kits: 'Kits & Badges',
  records: 'Records',
  controversies: 'Controversies',
  culture: 'Football Culture',
};
