"use client";

import { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

export function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 text-sm py-2.5 rounded-xl font-medium transition-colors ${
        active ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}
