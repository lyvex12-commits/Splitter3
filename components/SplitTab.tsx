"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WorkoutEntry } from "@/lib/types";
import { makeSlide, useSlideDirection } from "@/lib/useSlideDirection";

const slideLabel = makeSlide(20);
const slideGrid = makeSlide(28);
import { addDays, dayNamesShort, formatLongDate, formatWeekRange, getMonday, startOfDay, toKey } from "@/lib/dates";

export default function SplitTab({
  selectedDate,
  viewedWeekStart,
  onSelectDay,
  onNavigateWeek,
  entries,
  onManage,
}: {
  selectedDate: Date;
  viewedWeekStart: Date;
  onSelectDay: (d: Date) => void;
  onNavigateWeek: (monday: Date) => void;
  entries: WorkoutEntry[];
  onManage: () => void;
}) {
  // The visible 7-day grid follows viewedWeekStart — the week shared with
  // Goals and Data — NOT selectedDate. Paging weeks here (or on Goals/Data)
  // never moves your selected day; tapping a specific day below does, and
  // that's the only thing the Track tab cares about.
  const days = Array.from({ length: 7 }, (_, i) => addDays(viewedWeekStart, i));
  const todayKey = toKey(new Date());
  const weekKey = toKey(viewedWeekStart);

  const weekDir = useSlideDirection(viewedWeekStart.getTime());

  const entriesByDate = useMemo(() => {
    const map: Record<string, WorkoutEntry[]> = {};
    entries.forEach((e) => {
      (map[e.date] ||= []).push(e);
    });
    return map;
  }, [entries]);

  const selectedKey = toKey(selectedDate);
  const isCurrentWeek = toKey(viewedWeekStart) === toKey(getMonday(new Date()));

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold font-display">Split</h1>
        <button onClick={onManage} className="text-sm text-zinc-400 border border-zinc-800 rounded-xl px-3 py-1.5 active:scale-95 transition-transform">
          Saved Exercises
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onNavigateWeek(addDays(viewedWeekStart, -7))} className="p-2 text-zinc-500 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <div className="relative h-5 overflow-hidden flex-1 text-center">
          <AnimatePresence initial={false} mode="popLayout" custom={weekDir}>
            <motion.div
              key={weekKey}
              custom={weekDir}
              variants={slideLabel}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="text-sm text-zinc-400 font-medium"
            >
              {formatWeekRange(viewedWeekStart)}
            </motion.div>
          </AnimatePresence>
        </div>
        <button onClick={() => onNavigateWeek(addDays(viewedWeekStart, 7))} className="p-2 text-zinc-500 active:scale-90 transition-transform">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="relative overflow-hidden mb-6">
      <AnimatePresence initial={false} mode="popLayout" custom={weekDir}>
      <motion.div
        key={weekKey}
        custom={weekDir}
        variants={slideGrid}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-7 gap-1.5"
      >
        {days.map((d, i) => {
          const key = toKey(d);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const count = entriesByDate[key]?.length ?? 0;
          return (
            <motion.button
              key={key}
              onClick={() => onSelectDay(d)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.92 }}
              className={`relative rounded-xl py-2.5 flex flex-col items-center gap-1 overflow-hidden ${
                isSelected ? "text-zinc-950" : "bg-zinc-900 text-zinc-300"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId={`split-day-pill-${weekKey}`}
                  className="absolute inset-0 bg-amber-400"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 text-[10px] tracking-wide opacity-70">{dayNamesShort[i]}</span>
              <span className={`relative z-10 text-base font-semibold font-display ${isToday && !isSelected ? "text-amber-400" : ""}`}>
                {d.getDate()}
              </span>
              <span
                className={`relative z-10 w-1.5 h-1.5 rounded-full ${
                  count > 0 ? (isSelected ? "bg-zinc-950" : "bg-emerald-400") : "bg-transparent"
                }`}
              />
            </motion.button>
          );
        })}
      </motion.div>
      </AnimatePresence>
      </div>

      {!isCurrentWeek && (
        <button onClick={() => onNavigateWeek(getMonday(new Date()))} className="text-xs text-zinc-500 mb-6 underline underline-offset-2">
          Back to this week
        </button>
      )}

      <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">{formatLongDate(selectedDate)}</div>
      <div className="space-y-2">
        {(entriesByDate[selectedKey] ?? []).length === 0 ? (
          <div className="text-zinc-600 text-sm py-6 text-center border border-dashed border-zinc-800 rounded-2xl">
            No training logged this day.
          </div>
        ) : (
          entriesByDate[selectedKey].map((e) => (
            <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{e.exerciseName}</div>
                <div className="text-zinc-500 text-xs">{e.primaryMuscle}</div>
              </div>
              <div className="font-semibold tabular-nums font-display">{e.sets} sets</div>
            </div>
          ))
        )}
      </div>
      <div className="text-center text-zinc-600 text-xs mt-4">Tap Track to add or edit exercises for this day.</div>
    </div>
  );
}
