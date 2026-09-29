// Thin wrapper around the Vibration API. Support is inconsistent (iOS Safari
// doesn't implement it even when the site is installed as a PWA; Android
// Chrome does), so this is best-effort — it silently no-ops anywhere it
// isn't available rather than throwing.

type HapticStyle = "light" | "medium" | "success";

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 12,
  medium: 22,
  // A tiny double-tap pulse reads as a distinct "done" confirmation rather
  // than a generic buzz.
  success: [16, 40, 16],
};

export function vibrate(style: HapticStyle = "success"): void {
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[style]);
  } catch {
    // Some browsers throw if called outside a user gesture — ignore.
  }
}
