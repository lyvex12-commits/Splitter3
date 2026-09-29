"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { WorkoutEntry } from "@/lib/types";
import { formatLongDate } from "@/lib/dates";
import EntryCard from "@/components/ui/EntryCard";

export default function TrackTab({
  selectedDate,
  entries,
  onAdd,
  onEdit,
  onDelete,
}: {
  selectedDate: Date;
  entries: WorkoutEntry[];
  onAdd: () => void;
  onEdit: (e: WorkoutEntry) => void;
  onDelete: (id: string) => void;
}) {
  const totalSets = entries.reduce((s, e) => s + e.sets, 0);

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="flex items-center gap-1.5 mb-1">
        <Image
          src="/icons/logo-mark.png"
          alt=""
          width={18}
          height={18}
          className="rounded-[5px]"
        />
        <div className="text-zinc-500 text-sm tracking-wide font-medium">SPLITTER</div>
      </div>
      <h1 className="text-2xl font-semibold mb-4 font-display">{formatLongDate(selectedDate)}</h1>

      {entries.length > 0 && (
        <div className="text-zinc-500 text-xs mb-3 uppercase tracking-wider">
          {entries.length} exercise{entries.length !== 1 ? "s" : ""} · {totalSets} sets logged
        </div>
      )}

      {entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 text-center"
        >
          <div className="text-zinc-300 text-lg font-medium mb-2 font-display">Nothing logged yet.</div>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Do your workout first.
            <br />
            When you&apos;re done, quickly log what you did here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2.5 mb-6">
          <AnimatePresence>
            {entries.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, x: -12, transition: { duration: 0.22 } }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                layout
              >
                <EntryCard entry={e} onEdit={() => onEdit(e)} onDelete={() => onDelete(e.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <motion.button
        onClick={onAdd}
        whileTap={{ scale: 0.96 }}
        className="w-full flex items-center justify-center gap-2 bg-amber-400 text-zinc-950 font-semibold rounded-2xl py-4 text-base shadow-lg shadow-amber-400/10 font-display"
      >
        <Plus size={20} strokeWidth={2.6} /> Add Exercise
      </motion.button>
    </div>
  );
}
