"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BenchLog, Exercise, Goals, WorkoutEntry } from "@/lib/types";
import {
  loadExercises,
  loadEntries,
  loadGoals,
  loadBenchLogs,
  saveExercises,
  saveEntries,
  saveGoals,
  saveBenchLogs,
  uid,
} from "@/lib/storage";
import { toKey, startOfDay, getMonday } from "@/lib/dates";

import BottomNav, { TabId } from "@/components/BottomNav";
import TrackTab from "@/components/TrackTab";
import SplitTab from "@/components/SplitTab";
import GoalsTab from "@/components/GoalsTab";
import DataTab from "@/components/DataTab";
import AddExerciseModal, { EntryPayload } from "@/components/modals/AddExerciseModal";
import ExerciseBuilderModal from "@/components/modals/ExerciseBuilderModal";
import ManageExercisesModal from "@/components/modals/ManageExercisesModal";

// Order the four tabs are arranged in for left/right swipe navigation —
// kept in sync with BottomNav's left-to-right order so a swipe always
// moves to the visually adjacent tab.
const SWIPE_ORDER: TabId[] = ["track", "split", "goals", "data"];

export default function Splitter() {
  const [tab, setTab] = useState<TabId>("track");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [goals, setGoals] = useState<Goals>({});
  const [benchLogs, setBenchLogs] = useState<BenchLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Two DELIBERATELY separate pieces of date state:
  // - selectedDate: the one specific day (the dot/highlight on Split's
  //   calendar) that the Track tab shows. Only changes when you tap a
  //   specific day — never when you just page through weeks.
  // - viewedWeekStart: the Monday of whichever week Split/Goals/Data are
  //   currently showing. Paging weeks on ANY of those three updates this
  //   one shared value, so all three always agree on the same week —
  //   independent of which day is selected for Track.
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [viewedWeekStart, setViewedWeekStart] = useState<Date>(getMonday(new Date()));

  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<WorkoutEntry | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  // Load from localStorage on mount (client-only — this is why Splitter is
  // rendered from a "use client" tree instead of the server component).
  // loadExercises/loadEntries only ever read splitter:exercises /
  // splitter:entries — never write, clear, or reset them here.
  useEffect(() => {
    setExercises(loadExercises());
    setEntries(loadEntries());
    setGoals(loadGoals());
    setBenchLogs(loadBenchLogs());
    setLoaded(true);
  }, []);

  const persistEntries = useCallback((next: WorkoutEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);
  const persistExercises = useCallback((next: Exercise[]) => {
    setExercises(next);
    saveExercises(next);
  }, []);
  // Goals live under their own storage key (splitter:goals) and are set
  // directly by the user on the Goals tab — never derived from or writing
  // back to workout history.
  const persistGoals = useCallback((next: Goals) => {
    setGoals(next);
    saveGoals(next);
  }, []);
  // Bench Press logs — own key, independent of everything else.
  const persistBenchLogs = useCallback((next: BenchLog[]) => {
    setBenchLogs(next);
    saveBenchLogs(next);
  }, []);
  const addBenchLog = (log: Omit<BenchLog, "id" | "createdAt">) => {
    persistBenchLogs([...benchLogs, { ...log, id: uid(), createdAt: Date.now() }]);
  };
  const deleteBenchLog = (id: string) => {
    persistBenchLogs(benchLogs.filter((l) => l.id !== id));
  };

  const addEntry = (payload: EntryPayload) => {
    const entry: WorkoutEntry = {
      id: uid(),
      date: toKey(selectedDate),
      createdAt: Date.now(),
      ...payload,
    };
    persistEntries([...entries, entry]);
  };

  const updateEntryFn = (id: string, patch: EntryPayload) => {
    persistEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const deleteEntryFn = (id: string) => {
    persistEntries(entries.filter((e) => e.id !== id));
  };

  // Editing or deleting a saved exercise NEVER touches past workout entries —
  // entries always carry their own copy of the muscle configuration.
  const upsertExercise = (ex: Exercise) => {
    const exists = exercises.some((e) => e.id === ex.id);
    persistExercises(exists ? exercises.map((e) => (e.id === ex.id ? ex : e)) : [...exercises, ex]);
  };
  const deleteExerciseFn = (id: string) => {
    persistExercises(exercises.filter((e) => e.id !== id));
  };

  const entriesForDate = (dateKey: string) =>
    entries.filter((e) => e.date === dateKey).sort((a, b) => a.createdAt - b.createdAt);

  // Swipe-to-switch-tabs. Deliberately hand-rolled with raw touch events
  // instead of framer-motion's drag="x" so vertical scrolling inside each
  // tab (Data's charts, long exercise lists, etc.) is never hijacked — we
  // only ever read touch positions passively (no preventDefault), and only
  // commit to "this is a horizontal swipe" once the gesture is clearly more
  // horizontal than vertical.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeAxis = useRef<"x" | "y" | null>(null);
  const modalOpen = addOpen || !!editEntry || builderOpen || manageOpen;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (modalOpen) return;
    // Horizontally scrollable areas (e.g. the Data bar chart) own their own
    // sideways swipes — don't treat those as tab changes.
    if ((e.target as HTMLElement).closest("[data-no-swipe]")) return;
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    swipeAxis.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (!swipeAxis.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      swipeAxis.current = Math.abs(dx) > Math.abs(dy) * 1.3 ? "x" : "y";
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    const isHorizontal = swipeAxis.current === "x";
    touchStart.current = null;
    swipeAxis.current = null;
    if (!start || !isHorizontal) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    if (Math.abs(dx) < 60) return;
    const idx = SWIPE_ORDER.indexOf(tab);
    if (dx < 0 && idx < SWIPE_ORDER.length - 1) setTab(SWIPE_ORDER[idx + 1]);
    else if (dx > 0 && idx > 0) setTab(SWIPE_ORDER[idx - 1]);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div
        className="flex-1 overflow-y-auto pb-28"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Enter-only fade (no AnimatePresence/exit here on purpose — an
            exit transition combined with the Split calendar's shared-layout
            day-highlight animation could occasionally jam mid-transition
            and leave the next tab stuck invisible). Mount animations don't
            need AnimatePresence, so this stays smooth without that risk. */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {tab === "track" && (
            <TrackTab
              selectedDate={selectedDate}
              entries={entriesForDate(toKey(selectedDate))}
              onAdd={() => setAddOpen(true)}
              onEdit={(e) => setEditEntry(e)}
              onDelete={deleteEntryFn}
            />
          )}
          {tab === "split" && (
            <SplitTab
              selectedDate={selectedDate}
              viewedWeekStart={viewedWeekStart}
              onSelectDay={setSelectedDate}
              onNavigateWeek={setViewedWeekStart}
              entries={entries}
              onManage={() => setManageOpen(true)}
            />
          )}
          {tab === "goals" && (
            <GoalsTab
              entries={entries}
              goals={goals}
              onGoalsChange={persistGoals}
              viewedWeekStart={viewedWeekStart}
              onNavigateWeek={setViewedWeekStart}
              benchLogs={benchLogs}
              onAddBenchLog={addBenchLog}
              onDeleteBenchLog={deleteBenchLog}
            />
          )}
          {tab === "data" && (
            <DataTab
              entries={entries}
              viewedWeekStart={viewedWeekStart}
              onNavigateWeek={setViewedWeekStart}
              goals={goals}
            />
          )}
        </motion.div>
      </div>

      <BottomNav tab={tab} setTab={setTab} />

      {(addOpen || editEntry) && (
        <AddExerciseModal
          exercises={exercises}
          initial={editEntry}
          onClose={() => {
            setAddOpen(false);
            setEditEntry(null);
          }}
          onLog={(payload) => {
            if (editEntry) updateEntryFn(editEntry.id, payload);
            else addEntry(payload);
            setAddOpen(false);
            setEditEntry(null);
          }}
          onSaveExercise={upsertExercise}
          onManage={() => {
            setAddOpen(false);
            setEditEntry(null);
            setManageOpen(true);
          }}
        />
      )}

      {builderOpen && (
        <ExerciseBuilderModal
          initial={editExercise}
          exercises={exercises}
          onClose={() => {
            setBuilderOpen(false);
            setEditExercise(null);
          }}
          onSave={(ex) => {
            upsertExercise(ex);
            setBuilderOpen(false);
            setEditExercise(null);
          }}
        />
      )}

      {manageOpen && (
        <ManageExercisesModal
          exercises={exercises}
          onClose={() => setManageOpen(false)}
          onEdit={(ex) => {
            setEditExercise(ex);
            setManageOpen(false);
            setBuilderOpen(true);
          }}
          onDelete={deleteExerciseFn}
          onNew={() => {
            setManageOpen(false);
            setEditExercise(null);
            setBuilderOpen(true);
          }}
        />
      )}
    </div>
  );
}
