"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { Exercise } from "@/lib/types";
import { uid } from "@/lib/storage";
import { vibrate } from "@/lib/haptics";
import ModalShell from "@/components/ui/ModalShell";
import { Field } from "@/components/ui/Field";
import MuscleSelect from "@/components/ui/MuscleSelect";

export default function ExerciseBuilderModal({
  initial,
  exercises,
  onClose,
  onSave,
}: {
  initial: Exercise | null;
  exercises: Exercise[];
  onClose: () => void;
  onSave: (ex: Exercise) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [primary, setPrimary] = useState(initial?.primaryMuscle ?? "Chest");
  const [secondary, setSecondary] = useState(initial?.secondaryMuscle ?? "");
  const [contribution, setContribution] = useState(initial?.secondaryContribution ?? 0.5);
  const [justSaved, setJustSaved] = useState(false);

  // Same exercise name (case/whitespace-insensitive), excluding the one
  // currently being edited — so renaming-to-itself while editing isn't
  // flagged as a collision with itself.
  const isDuplicate = useMemo(() => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return false;
    return exercises.some((e) => e.id !== initial?.id && e.name.trim().toLowerCase() === trimmed);
  }, [name, exercises, initial]);

  const canSave = name.trim().length > 0 && !isDuplicate;

  const submit = () => {
    if (!canSave) return;
    const ex: Exercise = {
      id: initial?.id ?? uid(),
      name: name.trim(),
      primaryMuscle: primary,
      secondaryMuscle: secondary || null,
      secondaryContribution: secondary ? Number(contribution) : null,
      createdAt: initial?.createdAt ?? Date.now(),
    };
    // Brief success feedback before the modal closes — this only ever
    // saves a reusable Exercise definition, it never logs a workout entry,
    // so the confirmation is deliberately amber/"Saved" rather than the
    // green "Logged" checkmark used for actually logging a workout.
    vibrate("success");
    setJustSaved(true);
    setTimeout(() => onSave(ex), 550);
  };

  return (
    <ModalShell title={initial ? "Edit Exercise" : "New Saved Exercise"} onClose={onClose}>
      <AnimatePresence>
        {justSaved && (
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
              Saved to Exercises
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <Field label="Exercise name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Machine Shoulder Press"
            className={`w-full bg-zinc-800 rounded-xl px-3 py-3 text-sm outline-none focus:ring-1 ${
              isDuplicate
                ? "text-red-400 ring-1 ring-red-500 focus:ring-red-500"
                : "focus:ring-amber-400"
            }`}
          />
          {isDuplicate && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
              <AlertCircle size={13} className="shrink-0" />
              You already have an exercise named &ldquo;{name.trim()}&rdquo;.
            </div>
          )}
        </Field>
        <Field label="Primary muscle">
          <MuscleSelect value={primary} onChange={setPrimary} />
        </Field>
        <Field label="Secondary muscle (optional)">
          <MuscleSelect value={secondary} onChange={setSecondary} allowNone />
        </Field>
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
        <p className="text-xs text-zinc-600 leading-relaxed">
          Changing this later won&apos;t alter workouts you&apos;ve already logged — past entries keep the muscle
          configuration they were logged with.
        </p>
        <button
          onClick={submit}
          disabled={!canSave}
          className="w-full bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold rounded-2xl py-3.5"
        >
          Save Exercise
        </button>
      </div>
    </ModalShell>
  );
}
