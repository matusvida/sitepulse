"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function Toggle({ label, checked, onChange, className }: ToggleProps) {
  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-transparent shadow-inner transition-[background-color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
          checked ? "bg-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-[0_6px_14px_-8px_rgba(15,23,42,0.55)] transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}
