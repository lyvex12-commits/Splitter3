// All Splitter data lives entirely on this device, in the browser's
// localStorage. There is no account, no server database, and no sync.
// Clearing the browser's site data for this app will erase it — that's
// the tradeoff of a purely local, single-user tool.

import { BenchLog, Exercise, Goals, WorkoutEntry } from "./types";
import { DEFAULT_GOALS } from "./muscles";

const KEY_EXERCISES = "splitter:exercises";
const KEY_ENTRIES = "splitter:entries";
const KEY_GOALS = "splitter:goals";
const KEY_BENCH_LOGS = "splitter:benchLogs";

function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.error(`Failed to read ${key} from localStorage`, e);
    return fallback;
  }
}

function safeSave<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key} to localStorage`, e);
  }
}

export function loadExercises(): Exercise[] {
  return safeLoad<Exercise[]>(KEY_EXERCISES, []);
}
export function saveExercises(exercises: Exercise[]): void {
  safeSave(KEY_EXERCISES, exercises);
}

export function loadEntries(): WorkoutEntry[] {
  return safeLoad<WorkoutEntry[]>(KEY_ENTRIES, []);
}
export function saveEntries(entries: WorkoutEntry[]): void {
  safeSave(KEY_ENTRIES, entries);
}

// Goals live under their own key, entirely separate from workout history —
// deleting/editing goals never touches splitter:exercises or splitter:entries,
// and vice versa. Any muscle missing from stored goals (e.g. a brand-new
// muscle added in a later update, or a first-time user) falls back to a
// sensible default rather than 0/undefined — this is purely additive and
// never overwrites a value the user already chose.
export function loadGoals(): Goals {
  const stored = safeLoad<Goals>(KEY_GOALS, {});
  return { ...DEFAULT_GOALS, ...stored };
}
export function saveGoals(goals: Goals): void {
  safeSave(KEY_GOALS, goals);
}

// Bench Press tracker — its own key, separate from workout history/goals.
// Newest first isn't enforced here; callers sort by createdAt as needed.
// Defensive filter: an earlier version of this app stored a day-of-week
// (e.g. "Mon") instead of a real date. Any entry missing a valid
// YYYY-MM-DD `date` is legacy data that can't be displayed correctly, so
// it's dropped here rather than crashing the date picker/list downstream.
export function loadBenchLogs(): BenchLog[] {
  const logs = safeLoad<BenchLog[]>(KEY_BENCH_LOGS, []);
  return logs.filter((l) => typeof l.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(l.date));
}
export function saveBenchLogs(logs: BenchLog[]): void {
  safeSave(KEY_BENCH_LOGS, logs);
}

export const uid = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
