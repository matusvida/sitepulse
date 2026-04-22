"use client";

import { cn } from "@/lib/utils";

type ToggleVariant = "switch" | "segmented";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
  variant?: ToggleVariant;
  checkedLabel?: string;
  uncheckedLabel?: string;
  ariaLabel?: string;
}

export function Toggle({
  checked,
  onChange,
  className,
  label,
  variant = "switch",
  checkedLabel = "On",
  uncheckedLabel = "Off",
  ariaLabel,
}: ToggleProps) {
  if (variant === "segmented") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        onClick={() => onChange(!checked)}
        className={cn(
          "group relative inline-flex h-10 items-center rounded-full border border-white/80 bg-white/85 p-1 text-xs font-semibold text-muted shadow-[0_14px_30px_-24px_rgba(15,23,42,0.38)] backdrop-blur-sm transition-[border-color,box-shadow,background-color] hover:border-primary/20 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1 w-[calc(50%-0.125rem)] rounded-full bg-slate-950 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.7)] transition-transform duration-200 ease-out",
            checked ? "translate-x-full" : "translate-x-0",
          )}
        />
        <span className="relative z-10 flex min-w-[92px] items-center">
          <span
            className={cn(
              "flex w-1/2 items-center justify-center px-3 transition-colors duration-200",
              !checked && "text-white",
            )}
          >
            {uncheckedLabel}
          </span>
          <span
            className={cn(
              "flex w-1/2 items-center justify-center px-3 transition-colors duration-200",
              checked && "text-white",
            )}
          >
            {checkedLabel}
          </span>
        </span>
      </button>
    );
  }

  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
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
      {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
    </label>
  );
}
