"use client";

import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { WorkoutEntry } from "@/lib/types";
import { vibrate } from "@/lib/haptics";

export default function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: WorkoutEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);

  const confirmDelete = () => {
    vibrate("light");
    onDelete();
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
      <button className="text-left flex-1" onClick={onEdit}>
        <div className="font-medium text-zinc-100">{entry.exerciseName}</div>
        <div className="text-zinc-500 text-sm mt-0.5">
          {entry.primaryMuscle}
          {entry.secondaryMuscle ? ` · ${entry.secondaryMuscle} secondary` : ""}
        </div>
      </button>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-lg font-semibold tabular-nums">{entry.sets}</div>
          <div className="text-[11px] text-zinc-500 -mt-1">sets</div>
        </div>
        {confirm ? (
          <div className="flex gap-1">
            <button onClick={confirmDelete} className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <Check size={16} />
            </button>
            <button onClick={() => setConfirm(false)} className="p-2 rounded-xl bg-zinc-800 text-zinc-400">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="p-2 rounded-xl text-zinc-600 active:text-red-400">
            <Trash2 size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
