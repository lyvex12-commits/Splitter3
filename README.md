# Splitter

A fast, personal, upper-body training tracker. Log an exercise and its set
count in seconds, see your actual 7-day training history, and get a weekly
**Splitter Score** that grades the balance and quality of your training
distribution — all stored locally in your browser, with no accounts and no
cloud database.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — no database
setup, no environment variables required for the core app.

## Optional: AI Insights

The Data tab has an "Analyze my training" button that asks Google's
**Gemini API (free tier)** to summarize patterns in your logged training.
This is entirely optional and free:

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card required.
2. Copy `.env.local.example` to `.env.local`.
3. Set `GEMINI_API_KEY=...` in `.env.local`.
4. Restart `npm run dev`.

Without a key, the rest of the app works exactly the same — you'll just see
a setup message if you tap "Analyze my training".

The key is only ever used server-side (`app/api/insights/route.ts`); it's
never sent to the browser. The route calls `gemini-2.5-flash`, which is on
Gemini's free tier (generous daily request quota as of this writing — see
[ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits)
for current limits). Only a small summarized block of your effective-set
numbers is sent per request — never your raw workout log.

## Data storage

All exercises, workout entries, and goals are stored in the browser's
`localStorage`, scoped to this app, on this device, under three keys:
`splitter:exercises`, `splitter:entries`, and `splitter:goals`. There is no
sign-in, no sync, and no server-side database. Clearing your browser's site
data for this app will erase your logged history — there's currently no
export feature, so keep that in mind if you clear site data or switch
browsers/devices.

Historical entries always keep the muscle configuration (primary muscle,
secondary muscle, secondary contribution) that existed at the moment they
were logged — editing or deleting a saved exercise later never rewrites
past entries.

Goals (your personal weekly effective-set targets, set on the Goals tab)
live in their own storage key, entirely separate from workout history.
They persist across weeks until you change them — deleting or editing a
goal never touches your logged workouts, and vice versa.

## Installing as a PWA (add to home screen)

1. Run a production build so the service worker is active:
   ```bash
   npm run build
   npm run start
   ```
2. Open the app in your phone's browser (Chrome on Android, Safari on iOS)
   at your machine's local network address, e.g. `http://192.168.1.x:3000`.
3. Use "Add to Home Screen" (iOS Safari) or the install prompt / "Install
   app" menu item (Android Chrome).

The service worker (`public/sw.js`) only registers in production builds, to
avoid interfering with `next dev`'s hot reload.

## Project structure

```
app/
  layout.tsx          — root layout, fonts, PWA metadata, viewport, SW registration
  page.tsx            — renders the Splitter app
  globals.css         — Tailwind base + small global tweaks
  api/insights/route.ts — server-side proxy to Gemini API (AI Insights)
components/
  Splitter.tsx         — top-level app state (tabs, entries, exercises, goals, modals)
  BottomNav.tsx         — floating pill nav with animated active indicator
  TrackTab.tsx
  SplitTab.tsx
  GoalsTab.tsx          — weekly per-muscle goals, progress, "Recommended Next"
  DataTab.tsx
  AIInsights.tsx
  modals/
    AddExerciseModal.tsx
    ExerciseBuilderModal.tsx
    ManageExercisesModal.tsx
  ui/
    ModalShell.tsx, Field.tsx, MuscleSelect.tsx, SetStepper.tsx,
    EntryCard.tsx, RankList.tsx, GoalBarChart.tsx, ScoreRing.tsx,
    AnimatedNumber.tsx
lib/
  types.ts             — Exercise / WorkoutEntry / MuscleStat / Goals types
  muscles.ts            — upper-body muscle group config (no legs)
  dates.ts              — date/week helpers
  storage.ts             — localStorage read/write helpers
  calculations.ts        — effective-set math + Splitter Score algorithm + goal progress
public/
  manifest.json, sw.js, icons/
```

Typefaces (Space Grotesk for headings/big numbers, Manrope for body text)
are self-hosted via the `@fontsource-variable/*` npm packages rather than
Google's font CDN — no external network request at build or runtime, and
the app works fully offline once installed. Animations (tab transitions,
count-up numbers, the floating nav's sliding indicator, chart bar fills,
the "Logged" confirmation) use `framer-motion`.

## What Splitter is / isn't

Splitter is a fast exercise + set logger and a muscle-volume/balance
analyzer. It intentionally does **not** track reps, weight, RPE, rest
timers, or lower-body/leg training, and it does not assign or prescribe
workouts — it only reflects your own logged data back to you.
