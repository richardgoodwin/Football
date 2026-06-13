# Backlog

Ideas captured for later — not yet started.

## Scheduled league simulation (true 3pm kick-offs)

**Why:** Today, friends-league matchdays simulate *when a member next opens the
league* after the 3pm Wed/Sat kickoff has passed. Results are correct and
deterministic, but they only materialise on view — there's no server to run
them at the exact time, and no notification if nobody opens the app.

**What to build:**
- A scheduled **Firebase Cloud Function** (Cloud Scheduler / pub-sub cron) that
  runs at 15:00 on Wednesdays and Saturdays.
- It loads running leagues, simulates any due matchday using the same
  deterministic seed (`seed + matchday * 7919`) and current team squads, and
  writes the locked results — identical to the client-side `catchUpLeague`.
- Optional: **Web Push notifications** ("Matchday 12 is in — you finished 3rd")
  to members after each matchday is recorded.

**Notes:**
- Requires the Firebase **Blaze** (pay-as-you-go) plan for Cloud Functions.
- Keep the client-side catch-up as a fallback so the app still works without
  the function (and offline-first).
- Logic already exists in `src/lib/leagues.ts` (`catchUpLeague`) — the function
  would port that server-side.
