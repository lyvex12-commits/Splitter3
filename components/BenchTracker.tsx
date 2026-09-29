"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, Dumbbell, Trash2, Trophy } from "lucide-react";
import { BenchLog } from "@/lib/types";
import { fromKey, formatShortDate, startOfDay, toKey } from "@/lib/dates";
import { vibrate } from "@/lib/haptics";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import CalendarPicker from "@/components/ui/CalendarPicker";

export default function BenchTracker({
  logs,
  onAdd,
  onDelete,
}: {
  logs: BenchLog[];
  onAdd: (log: Omit<BenchLog, "id" | "createdAt">) => void;
  onDelete: (id: string) => void;
}) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setCalendarOpen(false));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const canSubmit = weight.trim() !== "" && reps.trim() !== "" && Number(weight) > 0 && Number(reps) > 0;

  const sorted = useMemo(() => [...logs].sort((a, b) => b.createdAt - a.createdAt), [logs]);

  // PR = heaviest weight logged; ties broken by more reps at that weight.
  const pr = useMemo(() => {
    if (logs.length === 0) return null;
    return logs.reduce<BenchLog | null>((best, l) => {
      if (!best) return l;
      if (l.weight > best.weight) return l;
      if (l.weight === best.weight && l.reps > best.reps) return l;
      return best;
    }, null);
  }, [logs]);

  const todayKey = toKey(new Date());
  const dateLabel = toKey(date) === todayKey ? "Today" : formatShortDate(date);

  const submit = () => {
    if (!canSubmit) return;
    onAdd({
      weight: Number(weight),
      reps: Number(reps),
      date: toKey(date),
      notes: notes.trim() ? notes.trim() : null,
    });
    vibrate("success");
    setJustLogged(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setJustLogged(false), 900);
    setWeight("");
    setReps("");
    setNotes("");
    setDate(startOfDay(new Date()));
  };

  return (
    <section className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <AnimatePresence>
        {justLogged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-900/95 backdrop-blur-sm rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/40 flex items-center justify-center"
            >
              <Check size={30} className="text-amber-400" strokeWidth={2.6} />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-medium text-zinc-300 font-display"
            >
              Bench logged
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-amber-400" />
          <div className="text-xs uppercase tracking-wider text-zinc-500">Bench Press Tracker</div>
        </div>
        {pr && (
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-sm font-semibold text-amber-400 tabular-nums">
              <Trophy size={12} />
              {pr.weight} lb × {pr.reps}
            </div>
            <div className="text-[10px] text-zinc-500 -mt-0.5">your PR</div>
          </div>
        )}
      </div>
      <p className="text-zinc-500 text-xs mb-3 leading-relaxed">
        Just weight and reps — no sets, no goal, just a quick log of what you benched.
      </p>

      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <div>
          <div className="text-xs text-zinc-500 mb-1.5">Weight (lb)</div>
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="135"
            className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 tabular-nums"
          />
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1.5">Reps</div>
          <input
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="8"
            className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 tabular-nums"
          />
        </div>
      </div>

      <div className="mb-2.5">
        <div className="text-xs text-zinc-500 mb-1.5">Notes (optional)</div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. felt heavy, paused reps…"
          className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setCalendarOpen((v) => !v)}
            className="flex items-center gap-1.5 bg-zinc-800 rounded-xl px-3 py-2.5 text-sm active:scale-95 transition-transform"
          >
            <CalendarDays size={14} className="text-zinc-500" />
            <span className="text-zinc-200 font-medium">{dateLabel}</span>
          </button>
          <AnimatePresence>
            {calendarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-1.5 z-20"
              >
                <CalendarPicker
                  selected={date}
                  onSelect={(d) => {
                    setDate(startOfDay(d));
                    setCalendarOpen(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="text-xs text-zinc-500">Date trained</span>
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="w-full bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold rounded-xl py-2.5 text-sm active:scale-[0.98] transition-transform"
      >
        Log Bench
      </button>

      {sorted.length > 0 && (
        <div className="space-y-1.5 mt-4 pt-4 border-t border-zinc-800/60">
          <AnimatePresence initial={false}>
            {sorted.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, x: -10, transition: { duration: 0.2 } }}
                transition={{ delay: Math.min(i, 6) * 0.03, duration: 0.25 }}
                layout
                className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium tabular-nums">
                    {log.weight} lb × {log.reps}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {formatShortDate(fromKey(log.date))}
                    {log.notes ? ` · ${log.notes}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => {
                    vibrate("light");
                    onDelete(log.id);
                  }}
                  className="p-1.5 rounded-lg text-zinc-600 active:text-red-400 shrink-0 active:scale-90 transition-transform"
                  aria-label="Delete log"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
