"use client";

import { motion } from "framer-motion";
import { Dumbbell, TrendingUp, Target, BarChart3 } from "lucide-react";

export type TabId = "track" | "split" | "goals" | "data";

const items: { id: TabId; label: string; icon: typeof Dumbbell }[] = [
  { id: "track", label: "Track", icon: Dumbbell },
  { id: "split", label: "Split", icon: TrendingUp },
  { id: "goals", label: "Goals", icon: Target },
  { id: "data", label: "Data", icon: BarChart3 },
];

export default function BottomNav({
  tab,
  setTab,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4 pb-4 safe-bottom pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.45)] px-1.5 py-1.5">
        {items.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <motion.button
              key={id}
              onClick={() => setTab(id)}
              whileTap={{ scale: 0.9 }}
              className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-amber-400"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 ${active ? "text-zinc-950" : "text-zinc-400"}`}>
                <Icon size={18} strokeWidth={active ? 2.6 : 2} />
                {active && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    className="text-[12px] font-semibold whitespace-nowrap overflow-hidden font-display"
                  >
                    {label}
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
