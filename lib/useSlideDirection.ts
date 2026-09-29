"use client";

import { useState } from "react";

/**
 * Returns 1 when `value` increased since the last render, -1 when it
 * decreased. Derived synchronously during render (the "adjust state while
 * rendering" pattern) so the FIRST change already has the right direction —
 * computing it in an effect would lag one render behind and make the first
 * animation slide the wrong way.
 */
export function useSlideDirection(value: number): 1 | -1 {
  const [prev, setPrev] = useState(value);
  const [dir, setDir] = useState<1 | -1>(1);
  if (value !== prev) {
    setPrev(value);
    setDir(value > prev ? 1 : -1);
  }
  return dir;
}

/** Variants for a directional slide. Pair with `custom={dir}` on BOTH the
 * AnimatePresence and the motion child so the exiting element also uses the
 * current direction instead of the one it was rendered with. */
export const makeSlide = (dist: number) => ({
  enter: (d: number) => ({ opacity: 0, x: d * dist }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: -d * dist }),
});
