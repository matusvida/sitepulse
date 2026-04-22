"use client";

import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { useId, useState } from "react";

interface HelpTooltipProps {
  content: string;
  className?: string;
  panelClassName?: string;
}

export function HelpTooltip({ content, className, panelClassName }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More information"
        aria-describedby={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-white/88 text-muted shadow-sm transition-[border-color,color,background-color,box-shadow] hover:border-primary/30 hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <span
          id={panelId}
          role="tooltip"
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-2xl border border-white/80 bg-slate-950 px-3.5 py-3 text-xs leading-5 text-white shadow-[0_22px_48px_-28px_rgba(15,23,42,0.7)]",
            panelClassName,
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
