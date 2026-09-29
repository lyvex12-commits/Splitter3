// Upper-body muscle groups only — Splitter intentionally excludes legs,
// since the user tracks lower-body training in a separate program.
//
// `major` groups anchor the volume / balance / undertraining targets used
// by the Splitter Score. `minor` groups are scored with gentler targets.

export interface MuscleConfig {
  key: string;
  major: boolean;
}

export const MUSCLES: MuscleConfig[] = [
  { key: "Chest", major: true },
  { key: "Back", major: true },
  { key: "Lats", major: true },
  { key: "Front Delts", major: false },
  { key: "Side Delts", major: true },
  { key: "Rear Delts", major: false },
  { key: "Biceps", major: true },
  { key: "Triceps", major: true },
  { key: "Traps", major: false },
  { key: "Forearms", major: false },
  { key: "Abs", major: false },
];

export const MUSCLE_NAMES: string[] = MUSCLES.map((m) => m.key);

export function isMajor(name: string): boolean {
  return MUSCLES.find((m) => m.key === name)?.major ?? false;
}

// Chosen to be distinct and readable on a dark background — avoids a single
// neon accent doing all the work across eleven different bars/slices.
export const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#f0a24a",
  Back: "#5fb0e8",
  Lats: "#eab308",
  "Front Delts": "#e8d15f",
  "Side Delts": "#e87f6a",
  "Rear Delts": "#c98ae8",
  Biceps: "#6ae8b0",
  Triceps: "#8a9cf0",
  Traps: "#e85f9d",
  Forearms: "#7fd4d4",
  Abs: "#d4c07f",
};

// Default weekly effective-set targets for the Goals feature. These are
// starting points only — every value is fully user-editable on the Goals
// tab and persists independently of workout history. They are NOT claims
// about what any muscle "needs"; they're just a reasonable starting point
// so the Goals page isn't all zeros on first use.
export const DEFAULT_GOALS: Record<string, number> = {
  Chest: 12,
  Back: 12,
  Lats: 10,
  "Front Delts": 8,
  "Side Delts": 10,
  "Rear Delts": 8,
  Biceps: 10,
  Triceps: 12,
  Traps: 6,
  Forearms: 6,
  Abs: 6,
};
