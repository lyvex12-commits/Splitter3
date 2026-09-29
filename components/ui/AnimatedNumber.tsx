"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/** Animates a number counting up/down to its new value whenever it changes,
 * instead of the digit just snapping — used for the Splitter Score and the
 * headline stats so updates feel alive rather than a static re-render. */
export default function AnimatedNumber({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 140, damping: 20, mass: 0.6 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      motionValue.set(value);
      first.current = false;
      return;
    }
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
