"use client";

import { motion } from "framer-motion";

/** A small circular progress ring, in the spirit of "Impact on Targets"-style
 * rings — used for the Splitter Score's four category scores so they read
 * at a glance instead of as a flat number in a row. */
export default function ScoreRing({
  value, // 0-100
  color,
  size = 64,
  strokeWidth = 6,
  label,
}: {
  value: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#27272a" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-semibold text-sm tabular-nums">{Math.round(clamped)}</span>
        </div>
      </div>
      <span className="text-[10px] text-zinc-500 leading-tight text-center">{label}</span>
    </div>
  );
}
