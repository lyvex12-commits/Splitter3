"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

export default function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  // Track the *visual* viewport so that when the on-screen keyboard opens
  // (after tapping a text field) the sheet shrinks to the space above the
  // keyboard instead of being partly hidden behind it.
  const [vv, setVv] = useState<{ h: number; top: number } | null>(null);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const update = () => setVv({ h: v.height, top: v.offsetTop });
    update();
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => {
      v.removeEventListener("resize", update);
      v.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      className="fixed left-0 right-0 z-50 flex items-end sm:items-center justify-center"
      style={vv ? { top: vv.top, height: vv.h } : { top: 0, bottom: 0 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto p-5 pb-8"
        style={vv ? { maxHeight: vv.h * 0.94 } : undefined}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-500 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
