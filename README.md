# Dickie's Perfect Season

Draft an all-time English top-flight XI and chase the perfect 38-0 season.
Spin the wheel for a club + season, pick a player from that squad, repeat
until your XI is complete, then simulate 38 games and see how close to perfect
you can get.

Includes the original "Classic Trivia" mode (formerly Dickie's Big Football
Quiz) as a secondary mode under `/trivia`.

## Requirements

- **Node.js 18+** ([nodejs.org](https://nodejs.org/) — install before running anything below)
- npm (ships with Node)

## Running locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to http://localhost:5173).

The app runs in **local-only mode** out of the box — no sign-in needed, all
progress stored in your browser. A yellow banner reminds you of this. Add
Firebase config (below) to enable cloud sync and global leaderboards.

## Firebase setup (cloud sync + leaderboards)

1. Go to <https://console.firebase.google.com/> and create a new project.
2. **Add a Web app** to it (the `</>` icon on the project overview).
3. Copy the config object Firebase shows you and put the values into
   `.env.local` (copy from `.env.example`):
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. **Enable Authentication** → Sign-in method → enable **Google** and
   **Email/Password**.
5. **Create a Firestore Database** (any location). Start in *production mode*.
6. Paste the contents of [`firestore.rules`](./firestore.rules) into
   Firestore → Rules in the console, then Publish.
7. Restart `npm run dev`. The yellow banner should disappear and you'll be
   redirected to a sign-in screen.

**Data model:**
- `/users/{uid}` — your profile (XP, level, cosmetics, achievements, stats)
- `/leaderboards/{mode}/scores/{uid}` — your best score per game mode

Profile changes auto-sync to Firestore with a 1.5s debounce. On sign-in we
pull the cloud profile and merge with local using max-of-each-axis (so your
progress is never lost across devices).

## Commands

| Command          | What it does                          |
| ---------------- | ------------------------------------- |
| `npm run dev`    | Start the Vite dev server with HMR    |
| `npm run build`  | Type-check + production build         |
| `npm run preview`| Preview the production build locally  |
| `npm run test`   | Run Vitest unit tests once            |
| `npm run lint`   | ESLint over `src/`                    |
| `npm run typecheck` | TypeScript noEmit check            |

## What's in v1

Single-player Web PWA. No backend. All persistence is via `localStorage`.

### Modes

- **Quick Play** — 10 random questions; pick difficulty + categories.
- **Daily Challenge** — 7 questions seeded by UTC date. Same for all players.
- **Survival** — One wrong answer ends the run. Difficulty ramps every 5 correct.
- **Penalty Shootout** — Best-of-5; each correct = a goal. CPU shoots too.
- **Career Mode** — Six tiers, level-gated, rewards cosmetics.
- **Party Mode** — Local pass-and-play, 2–4 players.

### Question formats

Multiple choice, true/false, guess-the-player (with progressive clues),
career-path (club timeline → guess the player), and drag-to-order timeline.

### Progression

- XP-driven levels (`100 * (level - 1) ^ 1.5`).
- Cosmetics with unlock conditions: level, achievement, career-tier, daily-streak, default.
- ~12 achievements tracked end-of-run.
- Equipped stadium-themes apply via CSS variables.

### Accessibility

- Respects OS `prefers-reduced-motion` and has an in-app override.
- Colourblind palettes (Deuteranopia / Protanopia / Tritanopia).
- Font scale (90% / 100% / 115% / 130%).
- Keyboard play: number keys for MC answers, Enter/Space to continue.

## Adding questions

Edit one of the JSON files under `src/data/questions/`. The schema in
`src/types/question.ts` is the source of truth — see `BaseQuestion` and the
five format-specific shapes (`MultipleChoiceQ`, `TrueFalseQ`,
`GuessThePlayerQ`, `CareerPathQ`, `TimelineQ`).

The dev build warns about duplicate IDs on startup.

## Architecture pointers

- `src/game/engine.ts` — pure state machine all modes share.
- `src/game/scoring.ts` — single source of truth for points / XP / levels.
- `src/game/dailySeed.ts` — `mulberry32(YYYYMMDD)` for deterministic daily picks.
- `src/game/modes/*` — each mode just builds an `EngineConfig`.
- `src/components/quiz/QuizRunner.tsx` — orchestrates engine + UI + audio + scoring.
- `src/store/*` — Zustand stores, all persisted to localStorage under `fq:v1:*`.

## Out of scope for v1

Realtime multiplayer, backend, OAuth, AI question generation, external football
data APIs, image/video questions, admin dashboard, Twitch integration, native
mobile, monetisation checkout. The data model and architecture are
forward-compatible with these but they are not implemented.
