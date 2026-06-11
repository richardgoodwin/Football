/**
 * Question generators. Consume the structured fact base and produce
 * Question objects in the same schema as the hand-written JSON files.
 *
 * Design notes:
 * - Every generated question gets a stable id (deterministic slug from inputs)
 *   so they're consistent across reloads.
 * - Distractors are pulled from the SAME fact group (other UCL winners,
 *   other WC hosts, etc.) so they're always plausible.
 * - Difficulty is auto-assigned by recency: recent = easier, older = harder.
 */

import type {
  Question,
  MultipleChoiceQ,
  TrueFalseQ,
  Difficulty,
} from '@/types/question';
import {
  UCL_FINALS,
  UEL_FINALS,
  PL_CHAMPIONS,
  LALIGA_CHAMPIONS,
  BUNDESLIGA_CHAMPIONS,
  SERIEA_CHAMPIONS,
  LIGUE1_CHAMPIONS,
  WORLD_CUPS,
  EUROS,
  BALLON_DOR,
  TRANSFERS,
  MANAGER_APPOINTMENTS,
  PL_TOP_SCORERS,
  type LeagueTitle,
  type MajorTournament,
} from './factBase';

// ─── helpers ────────────────────────────────────────────────────────────────

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function pickDistractors<T>(pool: T[], correct: T, n: number, eq: (a: T, b: T) => boolean = (a, b) => a === b): T[] {
  const filtered = uniq(pool.filter((x) => !eq(x, correct)));
  // Simple stable selection — take the first n after shuffle by stable index
  const seed = String(correct).length + filtered.length;
  const shuffled = [...filtered].sort((a, b) => {
    const ha = (String(a).length * 31 + seed) % 97;
    const hb = (String(b).length * 31 + seed) % 97;
    return ha - hb;
  });
  return shuffled.slice(0, n);
}

function difficultyFromYear(year: number): Difficulty {
  if (year >= 2020) return 'easy';
  if (year >= 2014) return 'medium';
  if (year >= 2005) return 'medium';
  return 'hard';
}

function mc(
  id: string,
  prompt: string,
  correct: string,
  distractors: string[],
  meta: {
    category: Question['category'];
    difficulty: Difficulty;
    yearStart: number;
    yearEnd: number;
    tags: string[];
    explanation: string;
    funFact?: string;
  },
): MultipleChoiceQ | null {
  if (distractors.length < 3) return null;
  return {
    id,
    format: 'multiple-choice',
    category: meta.category,
    difficulty: meta.difficulty,
    yearStart: meta.yearStart,
    yearEnd: meta.yearEnd,
    tags: meta.tags,
    explanation: meta.explanation,
    funFact: meta.funFact,
    prompt,
    correct,
    distractors: distractors.slice(0, 3) as [string, string, string],
  };
}

function tf(
  id: string,
  prompt: string,
  correct: boolean,
  meta: {
    category: Question['category'];
    difficulty: Difficulty;
    yearStart: number;
    yearEnd: number;
    tags: string[];
    explanation: string;
    funFact?: string;
  },
): TrueFalseQ {
  return {
    id,
    format: 'true-false',
    category: meta.category,
    difficulty: meta.difficulty,
    yearStart: meta.yearStart,
    yearEnd: meta.yearEnd,
    tags: meta.tags,
    explanation: meta.explanation,
    funFact: meta.funFact,
    prompt,
    correct,
  };
}

function seasonStartYear(season: string): number {
  return parseInt(season.split('-')[0], 10);
}

function seasonEndYear(season: string): number {
  const parts = season.split('-');
  if (parts.length === 1) return parseInt(parts[0], 10);
  const start = parseInt(parts[0], 10);
  const endPart = parts[1];
  if (endPart.length === 4) return parseInt(endPart, 10);
  // "03" → 2003, "99" → 1999
  const startCentury = Math.floor(start / 100) * 100;
  const endVal = parseInt(endPart, 10);
  if (endVal < (start % 100)) return startCentury + 100 + endVal;
  return startCentury + endVal;
}

// ─── UCL generator ──────────────────────────────────────────────────────────

function generateUCL(): Question[] {
  const winners = UCL_FINALS.map((f) => f.winner);
  const out: Question[] = [];

  for (const f of UCL_FINALS) {
    const yearTag = `ucl-${f.year}`;
    const diff = difficultyFromYear(f.year);
    const meta = {
      category: 'champions-league' as const,
      difficulty: diff,
      yearStart: f.year,
      yearEnd: f.year,
      tags: ['champions-league', yearTag, f.winner.toLowerCase().replace(/\s+/g, '-')],
      explanation: `${f.winner} beat ${f.runnerUp} ${f.score} in the ${f.year} Champions League Final.`,
    };

    // Q1: who won?
    const q1 = mc(
      `gen-ucl-winner-${f.year}`,
      `Who won the ${f.year} UEFA Champions League?`,
      f.winner,
      pickDistractors(winners, f.winner, 3),
      meta,
    );
    if (q1) out.push(q1);

    // Q2: who did winner beat?
    const q2 = mc(
      `gen-ucl-runnerup-${f.year}`,
      `Who did ${f.winner} beat in the ${f.year} Champions League Final?`,
      f.runnerUp,
      pickDistractors(UCL_FINALS.map((x) => x.runnerUp), f.runnerUp, 3),
      { ...meta, difficulty: bump(diff, 1) },
    );
    if (q2) out.push(q2);

    // Q3: T/F winner correct
    out.push(
      tf(
        `gen-ucl-tf-${f.year}`,
        `${f.winner} won the ${f.year} UEFA Champions League.`,
        true,
        meta,
      ),
    );

    // Q4: T/F false (one of the other winners)
    const otherWinner = pickDistractors(winners, f.winner, 1)[0];
    if (otherWinner) {
      out.push(
        tf(
          `gen-ucl-tf-false-${f.year}-${otherWinner.replace(/\s+/g, '-').toLowerCase()}`,
          `${otherWinner} won the ${f.year} UEFA Champions League.`,
          false,
          {
            ...meta,
            difficulty: bump(diff, 1),
            explanation: `The ${f.year} UCL was won by ${f.winner}, not ${otherWinner}.`,
          },
        ),
      );
    }

    // Q5: what year did winner beat runner-up?
    const matchingYears = UCL_FINALS.filter((x) => x.winner === f.winner).map((x) => String(x.year));
    if (matchingYears.length === 1) {
      const otherYears = uniq(UCL_FINALS.map((x) => String(x.year)).filter((y) => y !== String(f.year)));
      const q5 = mc(
        `gen-ucl-year-${f.year}`,
        `In which year did ${f.winner} beat ${f.runnerUp} in the Champions League Final?`,
        String(f.year),
        pickDistractors(otherYears, String(f.year), 3),
        { ...meta, difficulty: bump(diff, 1) },
      );
      if (q5) out.push(q5);
    }
  }

  return out;
}

// ─── Europa League generator ────────────────────────────────────────────────

function generateUEL(): Question[] {
  const winners = UEL_FINALS.map((f) => f.winner);
  const out: Question[] = [];

  for (const f of UEL_FINALS) {
    const diff = bump(difficultyFromYear(f.year), 1); // UEL is generally harder trivia
    const meta = {
      category: 'champions-league' as const,
      difficulty: diff,
      yearStart: f.year,
      yearEnd: f.year,
      tags: ['europa-league', `uel-${f.year}`, f.winner.toLowerCase().replace(/\s+/g, '-')],
      explanation: `${f.winner} beat ${f.runnerUp} ${f.score} in the ${f.year} UEFA Cup / Europa League Final.`,
    };

    const q1 = mc(
      `gen-uel-winner-${f.year}`,
      `Who won the ${f.year} ${f.year < 2010 ? 'UEFA Cup' : 'UEFA Europa League'}?`,
      f.winner,
      pickDistractors(winners, f.winner, 3),
      meta,
    );
    if (q1) out.push(q1);

    out.push(
      tf(
        `gen-uel-tf-${f.year}`,
        `${f.winner} won the ${f.year < 2010 ? 'UEFA Cup' : 'UEFA Europa League'} in ${f.year}.`,
        true,
        meta,
      ),
    );
  }

  return out;
}

// ─── League champion generators ─────────────────────────────────────────────

function generateLeagueChampions(
  champions: LeagueTitle[],
  leagueName: string,
  tagSlug: string,
  category: Question['category'],
): Question[] {
  const out: Question[] = [];
  const allChampions = uniq(champions.map((c) => c.champion));

  for (const c of champions) {
    const yStart = seasonStartYear(c.season);
    const yEnd = seasonEndYear(c.season);
    const diff = difficultyFromYear(yEnd);
    const meta = {
      category,
      difficulty: diff,
      yearStart: yStart,
      yearEnd: yEnd,
      tags: [tagSlug, `${tagSlug}-${c.season.replace('-', '')}`, c.champion.toLowerCase().replace(/\s+/g, '-')],
      explanation: `${c.champion} won the ${c.season} ${leagueName} title${c.manager ? ` under ${c.manager}` : ''}.`,
    };

    // Q1: who won?
    const q1 = mc(
      `gen-${tagSlug}-winner-${c.season}`,
      `Who won the ${c.season} ${leagueName} title?`,
      c.champion,
      pickDistractors(allChampions, c.champion, 3),
      meta,
    );
    if (q1) out.push(q1);

    // Q2: T/F correct
    out.push(
      tf(
        `gen-${tagSlug}-tf-${c.season}`,
        `${c.champion} won the ${c.season} ${leagueName} title.`,
        true,
        meta,
      ),
    );

    // Q3: manager (if known)
    if (c.manager) {
      const otherManagers = uniq(champions.map((x) => x.manager).filter((m): m is string => Boolean(m)));
      const q3 = mc(
        `gen-${tagSlug}-manager-${c.season}`,
        `Who managed ${c.champion} when they won the ${c.season} ${leagueName} title?`,
        c.manager,
        pickDistractors(otherManagers, c.manager, 3),
        { ...meta, difficulty: bump(diff, 1), category: 'managers' },
      );
      if (q3) out.push(q3);
    }
  }
  return out;
}

// ─── Major tournament generator (WC + Euros) ───────────────────────────────

function generateTournament(t: MajorTournament, kind: 'world-cup' | 'euros'): Question[] {
  const out: Question[] = [];
  const winners = (kind === 'world-cup' ? WORLD_CUPS : EUROS).map((x) => x.winner);
  const hosts = (kind === 'world-cup' ? WORLD_CUPS : EUROS).map((x) => x.host);
  const diff = difficultyFromYear(t.year);
  const competitionName = kind === 'world-cup' ? 'FIFA World Cup' : 'UEFA European Championship';

  const meta = {
    category: kind as Question['category'],
    difficulty: diff,
    yearStart: t.year,
    yearEnd: t.year,
    tags: [kind, `${kind}-${t.year}`, t.winner.toLowerCase().replace(/\s+/g, '-')],
    explanation: `${t.winner} beat ${t.runnerUp} ${t.finalScore} in the ${t.year} ${competitionName} Final.`,
  };

  // Winner
  const q1 = mc(
    `gen-${kind}-winner-${t.year}`,
    `Who won the ${t.year} ${competitionName}?`,
    t.winner,
    pickDistractors(winners, t.winner, 3),
    meta,
  );
  if (q1) out.push(q1);

  // Host
  const q2 = mc(
    `gen-${kind}-host-${t.year}`,
    `Which country hosted the ${t.year} ${competitionName}?`,
    t.host,
    pickDistractors(hosts, t.host, 3),
    { ...meta, difficulty: bump(diff, 1) },
  );
  if (q2) out.push(q2);

  // Runner-up
  const q3 = mc(
    `gen-${kind}-runnerup-${t.year}`,
    `Who did ${t.winner} beat in the ${t.year} ${competitionName} Final?`,
    t.runnerUp,
    pickDistractors(
      (kind === 'world-cup' ? WORLD_CUPS : EUROS).map((x) => x.runnerUp),
      t.runnerUp,
      3,
    ),
    { ...meta, difficulty: bump(diff, 1) },
  );
  if (q3) out.push(q3);

  // Final score
  const allScores = uniq((kind === 'world-cup' ? WORLD_CUPS : EUROS).map((x) => x.finalScore));
  const q4 = mc(
    `gen-${kind}-score-${t.year}`,
    `What was the score in the ${t.year} ${competitionName} Final?`,
    t.finalScore,
    pickDistractors(allScores, t.finalScore, 3),
    { ...meta, difficulty: bump(diff, 2) },
  );
  if (q4) out.push(q4);

  // Golden Boot (if known)
  if (t.goldenBoot) {
    const otherBoots = uniq(
      (kind === 'world-cup' ? WORLD_CUPS : EUROS)
        .map((x) => x.goldenBoot?.name)
        .filter((n): n is string => Boolean(n)),
    );
    const q5 = mc(
      `gen-${kind}-boot-${t.year}`,
      `Who won the Golden Boot at the ${t.year} ${competitionName}?`,
      t.goldenBoot.name,
      pickDistractors(otherBoots, t.goldenBoot.name, 3),
      { ...meta, difficulty: bump(diff, 1) },
    );
    if (q5) out.push(q5);
  }

  // T/F winner
  out.push(
    tf(
      `gen-${kind}-tf-${t.year}`,
      `${t.winner} won the ${t.year} ${competitionName}.`,
      true,
      meta,
    ),
  );

  return out;
}

// ─── Ballon d'Or generator ──────────────────────────────────────────────────

function generateBallonDor(): Question[] {
  const out: Question[] = [];
  const winners = uniq(BALLON_DOR.map((b) => b.winner));

  for (const b of BALLON_DOR) {
    const diff = difficultyFromYear(b.year);
    const meta = {
      category: 'legends' as const,
      difficulty: diff,
      yearStart: b.year,
      yearEnd: b.year,
      tags: ['ballon-dor', `bdo-${b.year}`, b.winner.toLowerCase().replace(/\s+/g, '-')],
      explanation: `${b.winner} (${b.club}) won the ${b.year} Ballon d'Or.`,
    };

    const q1 = mc(
      `gen-bdo-winner-${b.year}`,
      `Who won the ${b.year} Ballon d'Or?`,
      b.winner,
      pickDistractors(winners, b.winner, 3),
      meta,
    );
    if (q1) out.push(q1);

    const allClubs = uniq(BALLON_DOR.map((x) => x.club));
    const q2 = mc(
      `gen-bdo-club-${b.year}`,
      `Which club was ${b.winner} playing for when they won the ${b.year} Ballon d'Or?`,
      b.club,
      pickDistractors(allClubs, b.club, 3),
      { ...meta, difficulty: bump(diff, 1) },
    );
    if (q2) out.push(q2);

    out.push(
      tf(
        `gen-bdo-tf-${b.year}`,
        `${b.winner} won the ${b.year} Ballon d'Or.`,
        true,
        meta,
      ),
    );
  }

  return out;
}

// ─── Transfer generator ─────────────────────────────────────────────────────

function generateTransfers(): Question[] {
  const out: Question[] = [];
  const allClubs = uniq([...TRANSFERS.map((t) => t.from), ...TRANSFERS.map((t) => t.to)]);

  for (const t of TRANSFERS) {
    const diff = difficultyFromYear(t.year);
    const playerSlug = t.player.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const meta = {
      category: 'transfers' as const,
      difficulty: diff,
      yearStart: t.year,
      yearEnd: t.year,
      tags: ['transfer', `transfer-${t.year}`, playerSlug],
      explanation: `In ${t.year}, ${t.player} moved from ${t.from} to ${t.to}${t.fee ? ` for ${t.fee}` : ''}.`,
    };

    // Q1: where did player go?
    const q1 = mc(
      `gen-transfer-to-${t.year}-${playerSlug}`,
      `Which club did ${t.player} join in ${t.year}?`,
      t.to,
      pickDistractors(allClubs, t.to, 3),
      meta,
    );
    if (q1) out.push(q1);

    // Q2: where did they come from?
    const q2 = mc(
      `gen-transfer-from-${t.year}-${playerSlug}`,
      `${t.player}'s ${t.year} move to ${t.to} was from which club?`,
      t.from,
      pickDistractors(allClubs, t.from, 3),
      { ...meta, difficulty: bump(diff, 1) },
    );
    if (q2) out.push(q2);

    // Q3: T/F
    out.push(
      tf(
        `gen-transfer-tf-${t.year}-${playerSlug}`,
        `${t.player} joined ${t.to} from ${t.from} in ${t.year}.`,
        true,
        meta,
      ),
    );
  }

  return out;
}

// ─── Manager appointments ───────────────────────────────────────────────────

function generateManagers(): Question[] {
  const out: Question[] = [];
  const allManagers = uniq(MANAGER_APPOINTMENTS.map((m) => m.manager));

  for (const m of MANAGER_APPOINTMENTS) {
    const diff = difficultyFromYear(m.year);
    const slug = `${m.manager}-${m.club}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const meta = {
      category: 'managers' as const,
      difficulty: diff,
      yearStart: m.year,
      yearEnd: m.year,
      tags: ['manager-appointment', `mgr-${m.year}`, m.manager.toLowerCase().replace(/\s+/g, '-')],
      explanation: `${m.manager} took charge of ${m.club} in ${m.year}.`,
    };

    const q1 = mc(
      `gen-mgr-who-${slug}`,
      `Who took charge of ${m.club} in ${m.year}?`,
      m.manager,
      pickDistractors(allManagers, m.manager, 3),
      meta,
    );
    if (q1) out.push(q1);
  }

  return out;
}

// ─── PL top scorers ─────────────────────────────────────────────────────────

function generatePLTopScorers(): Question[] {
  const out: Question[] = [];
  const allScorers = uniq(PL_TOP_SCORERS.map((s) => s.player));
  const allGoals = uniq(PL_TOP_SCORERS.map((s) => String(s.goals)));

  for (const s of PL_TOP_SCORERS) {
    const yStart = seasonStartYear(s.season);
    const yEnd = seasonEndYear(s.season);
    const diff = difficultyFromYear(yEnd);
    const seasonSlug = s.season.replace('-', '');
    const meta = {
      category: 'premier-league' as const,
      difficulty: diff,
      yearStart: yStart,
      yearEnd: yEnd,
      tags: ['golden-boot', `pl-${seasonSlug}`, s.player.toLowerCase().replace(/\s+/g, '-')],
      explanation: `${s.player} (${s.club}) won the Premier League Golden Boot in ${s.season} with ${s.goals} goals.`,
    };

    const q1 = mc(
      `gen-pl-boot-${seasonSlug}`,
      `Who won the Premier League Golden Boot in ${s.season}?`,
      s.player,
      pickDistractors(allScorers, s.player, 3),
      meta,
    );
    if (q1) out.push(q1);

    const q2 = mc(
      `gen-pl-boot-goals-${seasonSlug}`,
      `How many goals did ${s.player} score to win the ${s.season} Premier League Golden Boot?`,
      String(s.goals),
      pickDistractors(allGoals, String(s.goals), 3),
      { ...meta, difficulty: bump(diff, 2) },
    );
    if (q2) out.push(q2);
  }

  return out;
}

// ─── difficulty bump ────────────────────────────────────────────────────────

function bump(d: Difficulty, levels: number): Difficulty {
  const order: Difficulty[] = ['easy', 'medium', 'hard', 'legendary'];
  const idx = order.indexOf(d);
  return order[Math.min(order.length - 1, idx + levels)];
}

// ─── public: all generated ──────────────────────────────────────────────────

export function generateAll(): Question[] {
  const out: Question[] = [
    ...generateUCL(),
    ...generateUEL(),
    ...generateLeagueChampions(PL_CHAMPIONS, 'Premier League', 'pl', 'premier-league'),
    ...generateLeagueChampions(LALIGA_CHAMPIONS, 'La Liga', 'laliga', 'legends'),
    ...generateLeagueChampions(BUNDESLIGA_CHAMPIONS, 'Bundesliga', 'bundesliga', 'legends'),
    ...generateLeagueChampions(SERIEA_CHAMPIONS, 'Serie A', 'seriea', 'legends'),
    ...generateLeagueChampions(LIGUE1_CHAMPIONS, 'Ligue 1', 'ligue1', 'legends'),
    ...WORLD_CUPS.flatMap((t) => generateTournament(t, 'world-cup')),
    ...EUROS.flatMap((t) => generateTournament(t, 'euros')),
    ...generateBallonDor(),
    ...generateTransfers(),
    ...generateManagers(),
    ...generatePLTopScorers(),
  ];

  // Dedupe by id, just in case
  const seen = new Set<string>();
  return out.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}
