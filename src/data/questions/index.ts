import type { Question } from '@/types/question';
import premierLeague from './premier-league.json';
import championsLeague from './champions-league.json';
import worldCup from './world-cup.json';
import euros from './euros.json';
import managers from './managers.json';
import transfers from './transfers.json';
import legends from './legends.json';
import obscure from './obscure.json';
import stadiums from './stadiums.json';
import records from './records.json';
import culture from './culture.json';
import controversies from './controversies.json';
import kits from './kits.json';
import flavour from './flavour.json';
import { generateAll } from '../generators';

const HAND_WRITTEN: Question[] = [
  ...(premierLeague as Question[]),
  ...(championsLeague as Question[]),
  ...(worldCup as Question[]),
  ...(euros as Question[]),
  ...(managers as Question[]),
  ...(transfers as Question[]),
  ...(legends as Question[]),
  ...(obscure as Question[]),
  ...(stadiums as Question[]),
  ...(records as Question[]),
  ...(culture as Question[]),
  ...(controversies as Question[]),
  ...(kits as Question[]),
  ...(flavour as Question[]),
];

const GENERATED: Question[] = generateAll();

// Merge with hand-written taking precedence on id collision.
const handWrittenIds = new Set(HAND_WRITTEN.map((q) => q.id));
const dedupedGenerated = GENERATED.filter((q) => !handWrittenIds.has(q.id));

export const ALL_QUESTIONS: Question[] = [...HAND_WRITTEN, ...dedupedGenerated];

// Dev-only sanity check: warn on duplicate IDs.
if (import.meta.env?.DEV) {
  const ids = new Set<string>();
  for (const q of ALL_QUESTIONS) {
    if (ids.has(q.id)) {
      // eslint-disable-next-line no-console
      console.warn(`[questions] Duplicate question id: ${q.id}`);
    }
    ids.add(q.id);
  }
  // eslint-disable-next-line no-console
  console.info(
    `[questions] Loaded ${ALL_QUESTIONS.length} questions (${HAND_WRITTEN.length} hand-written + ${dedupedGenerated.length} generated)`,
  );
}
