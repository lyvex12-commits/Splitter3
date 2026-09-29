"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { MUSCLE_NAMES, MUSCLE_COLORS } from "@/lib/muscles";
import { useOnClickOutside } from "@/lib/useOnClickOutside";

export default function MuscleSelect({
  value,
  onChange,
  allowNone,
}: {
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useOnClickOutside(wrapRef, () => setOpen(false));

  const options = allowNone ? ["", ...MUSCLE_NAMES] : MUSCLE_NAMES;

  const toggle = () => {
    if (!open && btnRef.current) {
      // Flip the menu upward if there isn't comfortably enough room below
      // (e.g. this field sits low in a scrollable modal) so it's never
      // rendered somewhere the user can't reach or see.
      const rect = btnRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(options.length, 6) * 38 + 16;
      const viewH = window.visualViewport?.height ?? window.innerHeight;
      setOpenUp(viewH - rect.bottom < estimatedHeight);
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-2 bg-zinc-800 rounded-xl px-3 py-3 text-sm text-left transition-shadow ${
          open ? "ring-1 ring-amber-400" : ""
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {value ? (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MUSCLE_COLORS[value] }} />
          ) : (
            <span className="w-2 h-2 rounded-full shrink-0 border border-zinc-600" />
          )}
          <span className={`truncate ${value ? "text-zinc-100" : "text-zinc-500"}`}>{value || "None"}</span>
        </span>
        <ChevronDown
          size={15}
          className={`text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openUp ? 6 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUp ? 6 : -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 right-0 z-30 bg-zinc-800 border border-zinc-700 rounded-xl p-1 shadow-2xl max-h-56 overflow-y-auto ${
              openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            {options.map((m) => {
              const selected = m === value;
              return (
                <button
                  key={m || "none"}
                  type="button"
                  onClick={() => {
                    onChange(m);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 text-left text-sm px-2.5 py-2 rounded-lg transition-colors ${
                    selected ? "bg-amber-400/15 text-amber-300" : "text-zinc-300 active:bg-zinc-700"
                  }`}
                >
                  {m ? (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MUSCLE_COLORS[m] }} />
                  ) : (
                    <span className="w-2 h-2 rounded-full shrink-0 border border-zinc-600" />
                  )}
                  <span className="flex-1 truncate">{m || "None"}</span>
                  {selected && <Check size={14} className="text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
