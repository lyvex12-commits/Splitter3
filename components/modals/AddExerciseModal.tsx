"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Check, AlertCircle } from "lucide-react";
import { Exercise, WorkoutEntry } from "@/lib/types";
import { uid } from "@/lib/storage";
import { vibrate } from "@/lib/haptics";
import ModalShell from "@/components/ui/ModalShell";
import { Field, SegButton } from "@/components/ui/Field";
import MuscleSelect from "@/components/ui/MuscleSelect";
import SetStepper from "@/components/ui/SetStepper";

export type EntryPayload = {
  exerciseName: string;
  primaryMuscle: string;
  sets: number;
  secondaryMuscle: string | null;
  secondaryContribution: number | null;
  exerciseId: string | null;
};

export default function AddExerciseModal({
  exercises,
  initial,
  onClose,
  onLog,
  onSaveExercise,
  onManage,
}: {
  exercises: Exercise[];
  initial: WorkoutEntry | null;
  onClose: () => void;
  onLog: (payload: EntryPayload) => void;
  onSaveExercise: (ex: Exercise) => void;
  onManage: () => void;
}) {
  const [mode, setMode] = useState<"search" | "quick">(initial ? "quick" : "search");
  const [query, setQuery] = useState(initial?.exerciseName ?? "");
  const [name, setName] = useState(initial?.exerciseName ?? "");
  const [primary, setPrimary] = useState(initial?.primaryMuscle ?? "Chest");
  const [secondary, setSecondary] = useState(initial?.secondaryMuscle ?? "");
  const [contribution, setContribution] = useState(initial?.secondaryContribution ?? 0.5);
  const [sets, setSets] = useState(initial?.sets ?? 1);
  const [rememberExercise, setRememberExercise] = useState(false);
  const [pickedExerciseId, setPickedExerciseId] = useState<string | null>(initial?.exerciseId ?? null);
  const [justLogged, setJustLogged] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return exercises;
    const q = query.toLowerCase();
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, exercises]);

  // Only matters when "Save as a reusable exercise" is checked — that's the
  // only path here that actually creates a new saved Exercise record.
  const isDuplicateExercise = useMemo(() => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return false;
    return exercises.some((e) => e.name.trim().toLowerCase() === trimmed);
  }, [name, exercises]);
  const blockedByDuplicate = rememberExercise && !initial && isDuplicateExercise;

  const pickSaved = (ex: Exercise) => {
    setName(ex.name);
    setPrimary(ex.primaryMuscle);
    setSecondary(ex.secondaryMuscle ?? "");
    setContribution(ex.secondaryContribution ?? 0.5);
    setPickedExerciseId(ex.id);
    setMode("quick");
    setQuery(ex.name);
  };

  const submit = () => {
    if (!name.trim() || blockedByDuplicate) return;
    const payload: EntryPayload = {
      exerciseName: name.trim(),
      primaryMuscle: primary,
      sets: Number(sets),
      secondaryMuscle: secondary || null,
      secondaryContribution: secondary ? Number(contribution) : null,
      exerciseId: pickedExerciseId,
    };
    if (rememberExercise && !initial) {
      onSaveExercise({
        id: uid(),
        name: name.trim(),
        primaryMuscle: primary,
        secondaryMuscle: secondary || null,
        secondaryContribution: secondary ? Number(contribution) : null,
        createdAt: Date.now(),
      });
    }
    // Brief success feedback before the modal closes. onLog both persists
    // the entry and closes this modal (see Splitter.tsx), so the checkmark
    // has to play BEFORE calling it, not after — otherwise the modal would
    // unmount instantly and the animation would never be seen.
    vibrate("success");
    setJustLogged(true);
    setTimeout(() => onLog(payload), 550);
  };

  return (
    <ModalShell onClose={onClose} title={initial ? "Edit Entry" : "Add Exercise"}>
      <AnimatePresence>
        {justLogged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-900/95 backdrop-blur-sm rounded-t-3xl sm:rounded-3xl"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-16 h-16 rounded-full bg-emerald-400/15 border border-emerald-400/40 flex items-center justify-center"
            >
              <Check size={30} className="text-emerald-400" strokeWidth={2.6} />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-medium text-zinc-300 font-display"
            >
              {initial ? "Saved" : "Logged"}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {!initial && (
        <div className="flex gap-2 mb-4">
          <SegButton active={mode === "search"} onClick={() => setMode("search")}>
            Saved Exercises
          </SegButton>
          <SegButton active={mode === "quick"} onClick={() => setMode("quick")}>
            Quick Log
          </SegButton>
        </div>
      )}

      {mode === "search" && !initial && (
        <div>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved exercises…"
              className="w-full bg-zinc-800 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {results.map((ex, i) => (
              <motion.button
                key={ex.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => pickSaved(ex)}
                className="w-full text-left bg-zinc-800/60 hover:bg-zinc-800 rounded-xl px-3 py-2.5"
              >
                <div className="text-sm font-medium">{ex.name}</div>
                <div className="text-xs text-zinc-500">
                  {ex.primaryMuscle}
                  {ex.secondaryMuscle ? ` + ${ex.secondaryMuscle}` : ""}
                </div>
              </motion.button>
            ))}
            {results.length === 0 && (
              <div className="text-center py-6">
                <p className="text-zinc-500 text-sm mb-3">No saved exercise matches &ldquo;{query}&rdquo;.</p>
                <button
                  onClick={() => {
                    setName(query);
                    setPickedExerciseId(null);
                    setMode("quick");
                  }}
                  className="text-amber-400 text-sm font-medium"
                >
                  Quick Log it instead →
                </button>
              </div>
            )}
          </div>
          <button onClick={onManage} className="mt-3 text-xs text-zinc-500 underline underline-offset-2">
            Manage saved exercises
          </button>
        </div>
      )}

      {mode === "quick" && (
        <div className="space-y-4">
          <Field label="Exercise name">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setPickedExerciseId(null);
              }}
              placeholder="e.g. Machine Shoulder Press"
              className="w-full bg-zinc-800 rounded-xl px-3 py-3 text-sm outline-none focus:ring-1 focus:ring-amber-400"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary muscle">
              <MuscleSelect value={primary} onChange={setPrimary} />
            </Field>
            <Field label="Secondary (optional)">
              <MuscleSelect value={secondary} onChange={setSecondary} allowNone />
            </Field>
          </div>

          {secondary && (
            <Field label={`Secondary contribution: ${contribution}`}>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={contribution}
                onChange={(e) => setContribution(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </Field>
          )}

          <Field label="Sets">
            <SetStepper value={sets} onChange={setSets} />
          </Field>

          {!initial && (
            <div>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberExercise}
                  onChange={(e) => setRememberExercise(e.target.checked)}
                  className="accent-amber-400"
                />
                Save as a reusable exercise
              </label>
              {blockedByDuplicate && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                  <AlertCircle size={13} className="shrink-0" />
                  You already have an exercise named &ldquo;{name.trim()}&rdquo; — uncheck this or rename it.
                </div>
              )}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!name.trim() || blockedByDuplicate}
            className="w-full bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold rounded-2xl py-3.5 active:scale-[0.98] transition-transform"
          >
            {initial ? "Save Changes" : "Log"}
          </button>
        </div>
      )}
    </ModalShell>
  );
}
