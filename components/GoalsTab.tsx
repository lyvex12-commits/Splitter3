"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { MUSCLES, MUSCLE_COLORS } from "@/lib/muscles";
import { addDays, formatWeekRange, getMonday, toKey } from "@/lib/dates";
import { aggregateMuscles, getGoalProgress } from "@/lib/calculations";
import { BenchLog, Goals, WorkoutEntry } from "@/lib/types";
import BenchTracker from "@/components/BenchTracker";
import { makeSlide, useSlideDirection } from "@/lib/useSlideDirection";

const slideWeek = makeSlide(24);

const goalRoll = {
  enter: (d: number) => ({ y: d * 14, opacity: 0, scale: 1.3, color: "#fbbf24" }),
  center: { y: 0, opacity: 1, scale: 1, color: "#fafafa" },
  exit: (d: number) => ({ y: -d * 14, opacity: 0 }),
};

/** The goal number rolls up when you add a set and down when you remove one,
 * with a quick amber flash, so each tap gives visible feedback. */
function GoalCount({ value }: { value: number }) {
  const dir = useSlideDirection(value);
  return (
    <span className="relative w-8 h-6 overflow-hidden flex items-center justify-center">
      <AnimatePresence initial={false} mode="popLayout" custom={dir}>
        <motion.span
          key={value}
          custom={dir}
          variants={goalRoll}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="font-semibold tabular-nums text-sm font-display"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function GoalsTab({
  entries,
  goals,
  onGoalsChange,
  viewedWeekStart,
  onNavigateWeek,
  benchLogs,
  onAddBenchLog,
  onDeleteBenchLog,
}: {
  entries: WorkoutEntry[];
  goals: Goals;
  onGoalsChange: (next: Goals) => void;
  viewedWeekStart: Date;
  onNavigateWeek: (monday: Date) => void;
  benchLogs: BenchLog[];
  onAddBenchLog: (log: Omit<BenchLog, "id" | "createdAt">) => void;
  onDeleteBenchLog: (id: string) => void;
}) {
  // Goals are compared against viewedWeekStart — the SAME week shared with
  // Split and Data (not tied to whichever day is individually selected for
  // Track). Page the week here, or on Split/Data, and all three follow.
  // The goal VALUES themselves are separate from any week; they persist
  // until changed.
  const monday = viewedWeekStart;
  const sunday = addDays(monday, 6);
  const isCurrentWeek = toKey(monday) === toKey(getMonday(new Date()));

  const weekEntries = useMemo(
    () => entries.filter((e) => e.date >= toKey(monday) && e.date <= toKey(sunday)),
    [entries, monday, sunday]
  );
  const { stats } = useMemo(() => aggregateMuscles(weekEntries), [weekEntries]);
  const progress = useMemo(() => getGoalProgress(stats, goals), [stats, goals]);

  // Direction of the last week change (derived synchronously, see hook).
  const weekDir = useSlideDirection(viewedWeekStart.getTime());

  const setGoal = (muscle: string, value: number) => {
    onGoalsChange({ ...goals, [muscle]: Math.max(0, value) });
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-display">Goals</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Your own weekly effective-set targets — not a scientific requirement, just guidance you control.
        </p>
      </div>

      {/* Week selector — drives the Progress section below */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigateWeek(addDays(viewedWeekStart, -7))}
            className="p-1.5 text-zinc-500 active:scale-90 transition-transform"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="relative flex-1 h-10 overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout" custom={weekDir}>
              <motion.div
                key={toKey(monday)}
                custom={weekDir}
                variants={slideWeek}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                  {isCurrentWeek ? "This Week" : "Week"}
                </div>
                <div className="font-medium">{formatWeekRange(monday)}</div>
              </motion.div>
            </AnimatePresence>
          </div>
          <button
            onClick={() => onNavigateWeek(addDays(viewedWeekStart, 7))}
            className="p-1.5 text-zinc-500 active:scale-90 transition-transform"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {!isCurrentWeek && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <button
                onClick={() => onNavigateWeek(getMonday(new Date()))}
                className="w-full text-center text-xs text-amber-400 underline underline-offset-2 mt-2"
              >
                Back to this week
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Weekly Goals editor */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Weekly Goals</div>
        <div className="space-y-1">
          {MUSCLES.map((m) => (
            <div key={m.key} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MUSCLE_COLORS[m.key] }} />
                <span className="text-sm text-zinc-200 truncate">{m.key}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setGoal(m.key, (goals[m.key] ?? 0) - 1)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center active:bg-zinc-700 active:scale-90 transition-transform"
                  aria-label={`Decrease ${m.key} goal`}
                >
                  <Minus size={14} />
                </button>
                <GoalCount value={goals[m.key] ?? 0} />
                <button
                  onClick={() => setGoal(m.key, (goals[m.key] ?? 0) + 1)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center active:bg-zinc-700 active:scale-90 transition-transform"
                  aria-label={`Increase ${m.key} goal`}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Progress: actual vs goal, for the viewed week */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <motion.div
          key={toKey(monday)}
          initial={{ opacity: 0, x: weekDir * 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs uppercase tracking-wider text-zinc-500 mb-3"
        >
          Progress · {isCurrentWeek ? "This Week" : formatWeekRange(monday)}
        </motion.div>
        <div className="space-y-3">
          {progress.map((p) => {
            const pct = p.pct === null ? 0 : Math.min(100, p.pct);
            const met = p.goal > 0 && p.effectiveSets >= p.goal;
            return (
              <div key={p.muscle}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-300">{p.muscle}</span>
                  <span className="text-zinc-500 tabular-nums">
                    {p.goal > 0 ? (
                      <>
                        {round1(p.effectiveSets)} / {p.goal}
                      </>
                    ) : (
                      <>{round1(p.effectiveSets)} · no goal set</>
                    )}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${p.goal > 0 ? pct : 0}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ background: met ? "#4ade80" : MUSCLE_COLORS[p.muscle] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Standalone Bench Press log — weight x reps only, not tied to sets,
          goals, or the viewed week. Lives in its own storage key. */}
      <BenchTracker logs={benchLogs} onAdd={onAddBenchLog} onDelete={onDeleteBenchLog} />
    </div>
  );
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}
