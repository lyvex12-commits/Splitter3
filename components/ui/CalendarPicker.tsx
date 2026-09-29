"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, daysInMonth, monthNames, startOfMonth, toKey } from "@/lib/dates";

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// Direction-aware slide: the month label slides in from the direction you
// navigated and exits the opposite way. Framer Motion requires this kind of
// per-call dynamic value to go through a named `variants` object (with a
// `custom` prop supplying the direction) rather than a function passed
// directly to `initial`/`exit` — the latter isn't valid at the type level.
const monthLabelVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 14 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -dir * 14 }),
};

export default function CalendarPicker({
  selected,
  onSelect,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(selected));
  const [dir, setDir] = useState(1);
  const goToMonth = (delta: number) => {
    setDir(delta);
    setViewMonth(addMonths(viewMonth, delta));
  };

  const numDays = daysInMonth(viewMonth);
  // JS getDay(): 0 = Sun … 6 = Sat. Grid is Mon-first, so shift by one.
  const leadingBlanks = (new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];

  const todayKey = toKey(new Date());
  const selectedKey = toKey(selected);

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 shadow-2xl w-64">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => goToMonth(-1)}
          className="p-1 text-zinc-400 active:text-amber-400 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </motion.button>
        <div className="relative h-5 overflow-hidden flex-1">
          <AnimatePresence initial={false} mode="popLayout" custom={dir}>
            <motion.div
              key={`${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
              custom={dir}
              variants={monthLabelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold text-amber-400 font-display text-center"
            >
              {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => goToMonth(1)}
          className="p-1 text-zinc-400 active:text-amber-400 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LETTERS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-zinc-500 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
          const key = toKey(d);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.82 }}
              onClick={() => onSelect(d)}
              className={`aspect-square rounded-lg text-xs tabular-nums flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-amber-400 text-zinc-950 font-semibold"
                  : isToday
                  ? "border border-amber-400/60 text-amber-300"
                  : "text-zinc-300 active:bg-zinc-700"
              }`}
            >
              {day}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
