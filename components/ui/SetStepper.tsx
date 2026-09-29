"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

export default function SetStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  // A quick pop on the number itself gives the +/- taps visible feedback,
  // separate from typing directly into the field (which shouldn't pop on
  // every keystroke).
  const [pop, setPop] = useState(0);
  const bump = (next: number) => {
    onChange(next);
    setPop((p) => p + 1);
  };

  return (
    <div className="flex items-center gap-4">
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => bump(Math.max(1, Number(value) - 1))}
        className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center active:bg-zinc-700"
      >
        <Minus size={18} />
      </motion.button>
      <div className="relative w-14 h-9 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.input
            key={pop}
            initial={{ scale: 1.25, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
            value={value}
            onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
            inputMode="numeric"
            className="absolute inset-0 w-full text-center bg-transparent text-2xl font-semibold outline-none tabular-nums"
          />
        </AnimatePresence>
      </div>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => bump(Number(value) + 1)}
        className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center active:bg-zinc-700"
      >
        <Plus size={18} />
      </motion.button>
    </div>
  );
}
