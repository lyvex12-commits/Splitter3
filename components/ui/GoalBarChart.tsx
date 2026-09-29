"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

/**
 * A swipeable bar "row" for muscle effective-sets vs personal goal.
 *
 * Deliberately NOT a single SVG squeezed to 100% width — with 11 muscle
 * groups that makes every label and bar illegible. Instead each bar gets a
 * fixed real pixel width inside a horizontally-scrollable, snap-scrolling
 * row, so the chart is always readable and you swipe to see the rest —
 * same idea as a horizontally paged carousel.
 */

export interface GoalBarDatum {
  name: string;
  value: number; // actual effective sets this week
  goal: number; // 0 = no goal set
  color: string;
}

const BAR_AREA_HEIGHT = 150; // px, the plotted region bars/ticks live in
const COLUMN_WIDTH = 56; // px, fixed width per muscle column

export default function GoalBarChart({ data }: { data: GoalBarDatum[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll(el.scrollWidth > el.clientWidth + 4);
  }, [data]);

  const maxRaw = Math.max(1, ...data.map((d) => Math.max(d.value, d.goal)));
  const maxValue = maxRaw * 1.15;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        data-no-swipe
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
      >
        {data.map((d, i) => {
          const barPct = Math.max(0.02, d.value / maxValue);
          const goalPct = d.goal > 0 ? d.goal / maxValue : null;
          const met = d.goal > 0 && d.value >= d.goal;

          return (
            <div
              key={d.name}
              className="shrink-0 snap-start flex flex-col items-center"
              style={{ width: COLUMN_WIDTH }}
            >
              <div className="text-[10px] text-zinc-400 tabular-nums mb-1 h-3">
                {d.goal > 0 ? `${round1(d.value)}/${d.goal}` : round1(d.value)}
              </div>

              <div className="relative flex items-end justify-center" style={{ height: BAR_AREA_HEIGHT, width: "100%" }}>
                {/* gridline baseline */}
                <div className="absolute bottom-0 inset-x-2 h-px bg-zinc-800" />

                {/* goal tick */}
                {goalPct !== null && (
                  <div
                    className="absolute h-[2px] rounded-full bg-zinc-200/90"
                    style={{
                      bottom: `${goalPct * 100}%`,
                      left: 4,
                      right: 4,
                    }}
                  />
                )}

                {/* animated actual bar */}
                <motion.div
                  className="rounded-t-md"
                  style={{ width: 26, background: d.color, opacity: met ? 1 : 0.9 }}
                  initial={{ height: 0 }}
                  animate={{ height: `${barPct * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <div className="text-[9px] text-zinc-500 text-center leading-tight mt-1.5 px-0.5">{d.name}</div>
            </div>
          );
        })}
      </div>

      {canScroll && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-10 bg-gradient-to-l from-zinc-900 to-transparent flex items-center justify-end">
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="text-zinc-600"
          >
            <ChevronRight size={14} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}
