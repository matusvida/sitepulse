"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "flex h-11 w-full rounded-2xl border border-border/80 bg-white/80 px-3.5 py-2 text-sm text-foreground shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)] transition-[border-color,box-shadow,background-color] placeholder:text-muted focus-visible:border-primary/40 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
    );
  }
);

Input.displayName = "Input";
