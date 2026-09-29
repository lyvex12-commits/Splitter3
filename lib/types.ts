// Core data model for Splitter.
//
// IMPORTANT: WorkoutEntry always carries its OWN copy of primaryMuscle /
// secondaryMuscle / secondaryContribution at the time it was logged.
// If a saved Exercise is edited or deleted later, past entries must NOT
// change — this is enforced simply by never re-reading the Exercise for
// historical calculations, only using what's stored on the entry itself.

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscle: string | null;
  secondaryContribution: number | null; // 0.1 - 1.0
  createdAt: number;
}

export interface WorkoutEntry {
  id: string;
  date: string; // YYYY-MM-DD (local calendar date)
  exerciseId: string | null; // present if logged from a saved exercise
  exerciseName: string;
  primaryMuscle: string;
  sets: number;
  secondaryMuscle: string | null;
  secondaryContribution: number | null;
  createdAt: number;
}

export interface MuscleStat {
  muscle: string;
  effectiveSets: number;
  days: Set<string>;
  daysTrained: number;
  timesTrained: number;
  lastTrained: string | null;
  pct: number;
}

export type MuscleStatsMap = Record<string, MuscleStat>;

export interface SplitterScoreResult {
  overall: number;
  volume: number;
  balance: number;
  frequency: number;
  undertraining: number;
  good: string[];
  improve: string[];
}

// User-defined personal weekly effective-set targets, keyed by muscle name.
// Stored separately from workout history (its own localStorage key) and
// persists across weeks — these are personal targets the user sets, not
// scientific requirements the app imposes.
export type Goals = Record<string, number>;

// A single Bench Press log entry. Deliberately separate from WorkoutEntry —
// this isn't about sets/volume, it's a lightweight weight x reps tracker
// (think "what did I bench and when"), stored under its own localStorage
// key so it never interacts with the sets-based Split/Goals/Data scoring.
export interface BenchLog {
  id: string;
  weight: number;
  reps: number;
  date: string; // YYYY-MM-DD — the calendar day this was benched, picked from a month view
  notes: string | null;
  createdAt: number;
}
