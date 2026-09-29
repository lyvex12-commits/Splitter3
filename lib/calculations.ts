import { MUSCLES, MUSCLE_NAMES, isMajor } from "./muscles";
import { Goals, MuscleStat, MuscleStatsMap, SplitterScoreResult, WorkoutEntry } from "./types";

/** Effective sets contributed by a single workout entry, split by muscle.
 *  Secondary volume is scaled by its contribution — never counted as a
 *  full extra set. e.g. 4 sets @ secondary 0.25 → 1 effective secondary set. */
export function effectiveContributions(entry: WorkoutEntry): { muscle: string; sets: number }[] {
  const out = [{ muscle: entry.primaryMuscle, sets: entry.sets * 1.0 }];
  if (entry.secondaryMuscle && entry.secondaryContribution) {
    out.push({ muscle: entry.secondaryMuscle, sets: entry.sets * entry.secondaryContribution });
  }
  return out;
}

/** Aggregate a list of entries (already filtered to whatever period matters)
 *  into per-muscle stats: effective sets, distinct days trained, times
 *  trained, and the most recent date trained. */
export function aggregateMuscles(entries: WorkoutEntry[]): { stats: MuscleStatsMap; total: number } {
  const stats: MuscleStatsMap = {};
  MUSCLE_NAMES.forEach((m) => {
    stats[m] = { muscle: m, effectiveSets: 0, days: new Set(), daysTrained: 0, timesTrained: 0, lastTrained: null, pct: 0 };
  });

  entries.forEach((e) => {
    effectiveContributions(e).forEach(({ muscle, sets }) => {
      if (!stats[muscle]) {
        stats[muscle] = { muscle, effectiveSets: 0, days: new Set(), daysTrained: 0, timesTrained: 0, lastTrained: null, pct: 0 };
      }
      const s = stats[muscle];
      s.effectiveSets += sets;
      s.days.add(e.date);
      s.timesTrained += 1;
      if (!s.lastTrained || e.date > s.lastTrained) s.lastTrained = e.date;
    });
  });

  const total = Object.values(stats).reduce((sum, m) => sum + m.effectiveSets, 0);
  Object.values(stats).forEach((m) => {
    (m as MuscleStat).daysTrained = m.days.size;
    (m as MuscleStat).pct = total > 0 ? (m.effectiveSets / total) * 100 : 0;
  });

  return { stats, total };
}

/* ------------------------- Splitter Score algorithm ------------------------
 * Modular and explainable on purpose (per spec): four components, each
 * 0-100, combined with fixed weights. No single component can dominate,
 * and every number shown to the user traces back to one of these.
 *
 *   Volume     — is weekly effective-set volume per muscle in a productive range?
 *   Balance    — are antagonist pairs (push/pull, biceps/triceps, front/rear
 *                delts) reasonably even, not raw volume across all majors?
 *   Frequency  — is each major muscle getting 2+ separate sessions/week?
 *   Coverage   — is every muscle at least above its bare-minimum floor,
 *                i.e. nothing sitting at zero for the week?
 * ---------------------------------------------------------------------- */

/** Smooth trapezoidal "adequacy" curve: ramps up to a plateau at the ideal
 * range, then eases back down for very high volume. No hard cliffs at any
 * single set count — a 9-set week scores close to a 10-set week. */
function trapezoidScore(x: number, lowFloor: number, lowIdeal: number, highIdeal: number, highCeil: number): number {
  if (x <= lowFloor) return Math.max(0, (x / lowFloor) * 40);
  if (x < lowIdeal) return 40 + ((x - lowFloor) / (lowIdeal - lowFloor)) * 60;
  if (x <= highIdeal) return 100;
  if (x < highCeil) return 100 - ((x - highIdeal) / (highCeil - highIdeal)) * 35;
  const over = x - highCeil;
  return Math.max(35, 65 - over * 1.5);
}

function volumeTargetsFor(muscle: string) {
  // Rough, deliberately generous evidence-informed weekly effective-set bands.
  return isMajor(muscle)
    ? { lowFloor: 4, lowIdeal: 10, highIdeal: 20, highCeil: 28 }
    : { lowFloor: 2, lowIdeal: 6, highIdeal: 14, highCeil: 20 };
}

export function calculateVolumeScore(stats: MuscleStatsMap): number {
  const majors = Object.values(stats).filter((m) => isMajor(m.muscle));
  const minors = Object.values(stats).filter((m) => !isMajor(m.muscle));
  const scoreFor = (m: MuscleStat) => {
    const t = volumeTargetsFor(m.muscle);
    return trapezoidScore(m.effectiveSets, t.lowFloor, t.lowIdeal, t.highIdeal, t.highCeil);
  };
  const majorAvg = majors.length ? majors.reduce((s, m) => s + scoreFor(m), 0) / majors.length : 100;
  const minorAvg = minors.length ? minors.reduce((s, m) => s + scoreFor(m), 0) / minors.length : 100;
  // Majors weigh more heavily since they drive overall training quality.
  return Math.round(majorAvg * 0.75 + minorAvg * 0.25);
}

/* ------------------------------ Balance ------------------------------------
 * Comparing every major muscle's raw volume against each other (as if Chest
 * and Traps "should" carry equal sets) isn't how muscle balance actually
 * works. What matters is antagonist pairs — the push side vs. the pull
 * side, elbow flexors vs. extensors, anterior vs. posterior delts — since
 * a lopsided ratio there is what actually drives postural and joint issues.
 * So Balance instead scores three real antagonist relationships and blends
 * them, weighted toward push/pull since that's the one with the biggest
 * real-world consequences (shoulder health, posture).
 * ---------------------------------------------------------------------- */

/** Score one antagonist pair (e.g. push vs pull sets). 100 when the two
 * sides are close to even, easing down as the ratio widens — no hard
 * cliff at any single ratio. */
function pairBalanceScore(a: number, b: number): number {
  if (a === 0 && b === 0) return 100; // neither side trained — nothing to be lopsided about
  if (a === 0 || b === 0) {
    // One side has zero sets while the other has some — a real imbalance,
    // but a light week (small numbers on the trained side) isn't punished
    // as hard as a heavy one-sided week.
    const trained = Math.max(a, b);
    return Math.max(20, 65 - trained * 2.2);
  }
  const ratio = Math.max(a, b) / Math.min(a, b);
  if (ratio <= 1.3) return 100;
  if (ratio <= 2) return 100 - ((ratio - 1.3) / 0.7) * 35; // eases to 65 at 2:1
  return Math.max(20, 65 - (ratio - 2) * 18);
}

function antagonistTotals(stats: MuscleStatsMap) {
  const es = (m: string) => stats[m]?.effectiveSets ?? 0;
  return {
    push: es("Chest") + es("Front Delts") + es("Triceps"),
    pull: es("Back") + es("Lats") + es("Rear Delts") + es("Biceps"),
    biceps: es("Biceps"),
    triceps: es("Triceps"),
    frontDelts: es("Front Delts"),
    rearDelts: es("Rear Delts"),
  };
}

export function calculateBalanceScore(stats: MuscleStatsMap): number {
  const t = antagonistTotals(stats);
  const pushPull = pairBalanceScore(t.push, t.pull);
  const armPair = pairBalanceScore(t.biceps, t.triceps);
  const deltPair = pairBalanceScore(t.frontDelts, t.rearDelts);
  // Push/pull carries the most weight — it's the antagonist relationship
  // with the clearest real-world stakes (shoulder health, posture).
  return Math.round(pushPull * 0.5 + armPair * 0.25 + deltPair * 0.25);
}

export function calculateFrequencyScore(stats: MuscleStatsMap): number {
  const majors = Object.values(stats).filter((m) => isMajor(m.muscle));
  if (!majors.length) return 100;
  // 2+ sessions/week per major muscle is treated as fully sufficient.
  const perMuscle = majors.map((m) => Math.min(100, (m.daysTrained / 2) * 100));
  return Math.round(perMuscle.reduce((a, b) => a + b, 0) / perMuscle.length);
}

export function calculateUndertrainingScore(stats: MuscleStatsMap): number {
  const penalties = MUSCLES.map(({ key, major }) => {
    const sets = stats[key]?.effectiveSets ?? 0;
    const floor = major ? 4 : 2;
    if (sets >= floor) return 0;
    const missing = (floor - sets) / floor;
    return missing * (major ? 22 : 10); // majors penalized harder when near-zero
  });
  const totalPenalty = penalties.reduce((a, b) => a + b, 0);
  return Math.round(Math.max(0, 100 - totalPenalty));
}

/* --------------------------- Comment generation -----------------------------
 * Deterministic-but-varied: which template gets used is picked from a small
 * hash of the muscle name + its actual set count, not randomized on every
 * render (that would make the card visibly flicker between reloads) and not
 * hardcoded to one fixed sentence either (that gets old fast). Same inputs
 * always produce the same sentence; different numbers naturally rotate the
 * phrasing week to week.
 * ---------------------------------------------------------------------- */
function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pick<T>(arr: T[], seed: string): T {
  return arr[seedHash(seed) % arr.length];
}
const oneDec = (n: number) => Math.round(n * 10) / 10;

const GOOD_MUSCLE_TEMPLATES: ((m: string, sets: number, times: number) => string)[] = [
  (m, s) => `${m} is having a strong week — ${oneDec(s)} effective sets, comfortably in a productive range.`,
  (m, s) => `Nice work on ${m}: ${oneDec(s)} sets is right where it should be this week.`,
  (m, s, t) => `${m} got real attention this week — ${oneDec(s)} sets across ${t} session${t === 1 ? "" : "s"}.`,
  (m, s) => `${oneDec(s)} effective sets on ${m} — solidly in the productive zone.`,
  (m, s) => `You're doing well for ${m} with ${oneDec(s)} sets this week.`,
];
const GOOD_FREQUENCY_TEMPLATES: ((m: string, times: number) => string)[] = [
  (m, t) => `${m} was trained ${t}x this week — a good, recovery-friendly spread instead of one big session.`,
  (m, t) => `Hitting ${m} ${t} separate times this week is a smart way to spread the stimulus out.`,
];

export function calculateSplitterScore(stats: MuscleStatsMap): SplitterScoreResult {
  const volume = calculateVolumeScore(stats);
  const balance = calculateBalanceScore(stats);
  const frequency = calculateFrequencyScore(stats);
  const undertraining = calculateUndertrainingScore(stats);
  const overall = Math.round(volume * 0.3 + balance * 0.3 + frequency * 0.2 + undertraining * 0.2);
  const good: string[] = [];
  const improve: string[] = [];
  const majors = Object.values(stats).filter((m) => isMajor(m.muscle));
  const t = antagonistTotals(stats);

  // Unique days trained this week, derived from the union of every muscle's
  // own day-set — no separate "entries" argument needed.
  const allDays = new Set<string>();
  Object.values(stats).forEach((m) => m.days.forEach((d) => allDays.add(d)));
  const daysLogged = allDays.size;

  const scoreFor = (m: MuscleStat) => {
    const tg = volumeTargetsFor(m.muscle);
    return trapezoidScore(m.effectiveSets, tg.lowFloor, tg.lowIdeal, tg.highIdeal, tg.highCeil);
  };

  // --- Positives: specific muscles in a productive range, called out by name ---
  const inRange = majors
    .filter((m) => scoreFor(m) >= 90 && m.effectiveSets > 0)
    .sort((a, b) => b.effectiveSets - a.effectiveSets);
  inRange.slice(0, 2).forEach((m) => {
    good.push(pick(GOOD_MUSCLE_TEMPLATES, `${m.muscle}-${m.effectiveSets}`)(m.muscle, m.effectiveSets, m.timesTrained));
  });

  // --- Positives: antagonist pairs that are actually well balanced ---
  const pushPullScore = pairBalanceScore(t.push, t.pull);
  if (pushPullScore >= 85 && t.push > 0 && t.pull > 0) {
    good.push(`Push (${oneDec(t.push)} sets) and pull (${oneDec(t.pull)} sets) are nicely balanced this week.`);
  }
  const armScore = pairBalanceScore(t.biceps, t.triceps);
  if (armScore >= 85 && t.biceps > 0 && t.triceps > 0) {
    good.push(`Biceps and triceps are staying in step — ${oneDec(t.biceps)} vs ${oneDec(t.triceps)} sets.`);
  }

  // --- Positives: a muscle trained more than once, spreading out the stimulus ---
  const wellSpread = majors
    .filter((m) => m.daysTrained >= 2)
    .sort((a, b) => b.daysTrained - a.daysTrained);
  if (wellSpread.length && good.length < 3) {
    const m = wellSpread[0];
    good.push(pick(GOOD_FREQUENCY_TEMPLATES, `${m.muscle}-${m.daysTrained}`)(m.muscle, m.daysTrained));
  }

  // --- Positives: overall consistency across the week ---
  if (daysLogged >= 5 && good.length < 4) {
    good.push(`Solid consistency — training logged on ${daysLogged} different days this week.`);
  }

  if (!good.length) {
    good.push("You logged training this week — keep it up to unlock deeper trends.");
  }

  // --- Improvements: antagonist imbalances, with the real numbers ---
  if (pushPullScore < 70) {
    if (t.push > t.pull) {
      improve.push(
        `Push volume (${oneDec(t.push)} sets) is well ahead of pull (${oneDec(t.pull)} sets) — a row or pulldown day would even things out.`
      );
    } else {
      improve.push(
        `Pull volume (${oneDec(t.pull)} sets) is well ahead of push (${oneDec(t.push)} sets) — a pressing session would balance things out.`
      );
    }
  }
  if (armScore < 70 && (t.biceps > 0 || t.triceps > 0)) {
    improve.push(
      t.biceps > t.triceps
        ? `Biceps (${oneDec(t.biceps)} sets) is well ahead of triceps (${oneDec(t.triceps)} sets) this week.`
        : `Triceps (${oneDec(t.triceps)} sets) is well ahead of biceps (${oneDec(t.biceps)} sets) this week.`
    );
  }
  const deltScore = pairBalanceScore(t.frontDelts, t.rearDelts);
  if (deltScore < 70 && (t.frontDelts > 0 || t.rearDelts > 0)) {
    improve.push(
      t.frontDelts > t.rearDelts
        ? `Front delts (${oneDec(t.frontDelts)} sets) are getting a lot more work than rear delts (${oneDec(t.rearDelts)} sets).`
        : `Rear delts (${oneDec(t.rearDelts)} sets) are getting a lot more work than front delts (${oneDec(t.frontDelts)} sets).`
    );
  }

  // --- Improvements: muscles with zero sets this week, called out by name
  // (capped so a fresh account with 11 empty muscles doesn't read as a wall
  // of near-identical sentences) ---
  const ZERO_TEMPLATES: ((m: string) => string)[] = [
    (m) => `${m} hasn't seen any work yet this week.`,
    (m) => `No sets logged for ${m} so far this week.`,
    (m) => `${m} is still at zero for the week — worth fitting in if it's in the plan.`,
  ];
  const zeroSet = MUSCLES.filter((m) => (stats[m.key]?.effectiveSets ?? 0) === 0).sort(
    (a, b) => Number(b.major) - Number(a.major)
  );
  zeroSet.slice(0, 3).forEach((m) => {
    improve.push(pick(ZERO_TEMPLATES, m.key)(m.key));
  });
  if (zeroSet.length > 3) {
    improve.push(`...and ${zeroSet.length - 3} more muscle${zeroSet.length - 3 === 1 ? "" : "s"} untouched this week.`);
  }

  // --- Improvements: majors hit only once (if there's still room) ---
  const SINGLE_SESSION_TEMPLATES: ((m: string, s: number) => string)[] = [
    (m, s) => `${m} has only been hit once this week (${oneDec(s)} sets) — a second, lighter session would help.`,
    (m, s) => `${oneDec(s)} sets on ${m}, but all in one session — spreading it across two would aid recovery.`,
  ];
  majors
    .filter((m) => m.daysTrained === 1 && m.effectiveSets > 0)
    .forEach((m) => {
      if (improve.length < 5) {
        improve.push(pick(SINGLE_SESSION_TEMPLATES, `${m.muscle}-${m.effectiveSets}`)(m.muscle, m.effectiveSets));
      }
    });

  if (!improve.length) improve.push("Nothing major stands out — this week looks solid.");

  return { overall, volume, balance, frequency, undertraining, good: good.slice(0, 4), improve: improve.slice(0, 5) };
}

/* --------------------- Score breakdown for display ------------------------
 * The 0-100 sub-scores above are useful on their own (e.g. "Volume: 8/100"),
 * but they don't visually sum to the overall score because each is scaled
 * by its own weight first. This helper exposes the actual weighted POINTS
 * each category contributes (out of its weight's share of 100), so the
 * numbers shown to the user add up directly:
 *   Volume points + Balance points + Frequency points + Coverage points
 *     = overall score
 * Every weight below (0.3/0.3/0.2/0.2) is multiplied against a 0-100
 * integer, so each product always lands on an exact one-decimal value —
 * rounding each row to 1 decimal introduces no drift versus the true sum.
 * ---------------------------------------------------------------------- */
export interface ScoreContribution {
  label: string;
  subScore: number; // 0-100 category score
  weightPct: number; // this category's weight, e.g. 30
  maxPoints: number; // weightPct, i.e. points if subScore were 100
  points: number; // subScore * weight, the actual points this category contributes
}

export function getScoreContributions(score: SplitterScoreResult): ScoreContribution[] {
  const rows: { label: string; subScore: number; weight: number }[] = [
    { label: "Volume", subScore: score.volume, weight: 0.3 },
    { label: "Balance", subScore: score.balance, weight: 0.3 },
    { label: "Frequency", subScore: score.frequency, weight: 0.2 },
    { label: "Coverage", subScore: score.undertraining, weight: 0.2 },
  ];
  return rows.map((r) => ({
    label: r.label,
    subScore: r.subScore,
    weightPct: Math.round(r.weight * 100),
    maxPoints: Math.round(r.weight * 100),
    points: Math.round(r.subScore * r.weight * 10) / 10,
  }));
}

/* ------------------------------ Goals -------------------------------------
 * Goals are personal, user-set weekly effective-set targets (a separate
 * localStorage key, lib/storage.ts). They are informational/visual only —
 * they never feed into calculateSplitterScore above, so a personal goal can
 * never silently change the objective Score. This section just compares the
 * SAME effective-set numbers the rest of the app already computes against
 * whatever target the user chose.
 * ---------------------------------------------------------------------- */

export interface GoalProgress {
  muscle: string;
  effectiveSets: number;
  goal: number;
  /** null when goal is 0/unset — never treated as an infinite deficit. */
  pct: number | null;
  /** effective sets logged TODAY specifically (independent of week/goal),
   * used only by the "Today" recommendation mode below. */
  todaySets: number;
  timesTrained: number;
}

export function getGoalProgress(stats: MuscleStatsMap, goals: Goals, todayStats?: MuscleStatsMap): GoalProgress[] {
  return MUSCLE_NAMES.map((muscle) => {
    const goal = goals[muscle] ?? 0;
    const effectiveSets = stats[muscle]?.effectiveSets ?? 0;
    const pct = goal > 0 ? (effectiveSets / goal) * 100 : null;
    const todaySets = todayStats?.[muscle]?.effectiveSets ?? 0;
    const timesTrained = stats[muscle]?.timesTrained ?? 0;
    return { muscle, effectiveSets, goal, pct, todaySets, timesTrained };
  });
}

/** Muscles furthest behind their own goal, for "Recommended Next" guidance.
 * Excludes muscles with no goal set and muscles already at/above their goal —
 * this is personal-guidance ranking, not a claim about training necessity.
 *
 * mode "week" (default): pure furthest-behind-goal ranking for the week.
 * mode "today": additionally excludes any muscle already given 2+ effective
 * sets TODAY (so it doesn't keep suggesting something you just did), and
 * ranks muscles untouched today ahead of ones you've merely started today,
 * before falling back to the same furthest-behind-goal ordering. */
export function getRecommendedNext(
  progress: GoalProgress[],
  limit = 5,
  mode: "week" | "today" = "week"
): GoalProgress[] {
  let pool = progress.filter((p) => p.goal > 0 && p.pct !== null && p.pct < 100);

  if (mode === "today") {
    pool = pool.filter((p) => p.todaySets < 2);
  }

  return pool
    .sort((a, b) => {
      if (mode === "today") {
        const aUntouched = a.todaySets === 0 ? 0 : 1;
        const bUntouched = b.todaySets === 0 ? 0 : 1;
        if (aUntouched !== bUntouched) return aUntouched - bUntouched;
      }
      return (a.pct as number) - (b.pct as number);
    })
    .slice(0, limit);
}
