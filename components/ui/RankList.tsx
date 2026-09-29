"use client";

import { motion } from "framer-motion";
import { MuscleStat } from "@/lib/types";

export default function RankList({ items }: { items: MuscleStat[] }) {
  return (
    <div className="space-y-2">
      {items.map((m, i) => (
        <motion.div
          key={m.muscle}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          className="flex items-center gap-3"
        >
          <span className="text-zinc-600 text-xs w-4">{i + 1}</span>
          <span className="flex-1 text-sm text-zinc-300">{m.muscle}</span>
          <span className="text-sm font-medium tabular-nums text-zinc-400">{m.effectiveSets.toFixed(1)} sets</span>
        </motion.div>
      ))}
    </div>
  );
}
