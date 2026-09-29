"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Plus, Pencil, Trash2, Check } from "lucide-react";
import { vibrate } from "@/lib/haptics";
import { Exercise } from "@/lib/types";
import ModalShell from "@/components/ui/ModalShell";

export default function ManageExercisesModal({
  exercises,
  onClose,
  onEdit,
  onDelete,
  onNew,
}: {
  exercises: Exercise[];
  onClose: () => void;
  onEdit: (ex: Exercise) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ModalShell title="Saved Exercises" onClose={onClose}>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full bg-zinc-800 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onNew}
        className="w-full flex items-center justify-center gap-2 bg-zinc-800 rounded-xl py-3 mb-4 text-sm font-medium"
      >
        <Plus size={16} /> New Exercise
      </motion.button>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence initial={false}>
          {filtered.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, x: -10, transition: { duration: 0.2 } }}
              transition={{ delay: i * 0.025, duration: 0.25 }}
              layout
              className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{ex.name}</div>
                <div className="text-xs text-zinc-500 truncate">
                  {ex.primaryMuscle}
                  {ex.secondaryMuscle ? ` · ${ex.secondaryMuscle} (${ex.secondaryContribution})` : ""}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onEdit(ex)} className="p-2 text-zinc-400 active:scale-90 transition-transform" aria-label={`Edit ${ex.name}`}>
                  <Pencil size={15} />
                </button>
                {confirmId === ex.id ? (
                  <button
                    onClick={() => onDelete(ex.id)}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium"
                  >
                    <Check size={14} /> Confirm
                  </button>
                ) : (
                  <button onClick={() => setConfirmId(ex.id)} className="p-2 text-zinc-500" aria-label={`Delete ${ex.name}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && <div className="text-center text-zinc-600 text-sm py-6">No saved exercises yet.</div>}
      </div>
    </ModalShell>
  );
}
