"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, FileSearch, Loader2 } from "lucide-react";

interface AsyncStateProps {
  type: "loading" | "error" | "empty";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const iconMap = {
  loading: Loader2,
  error: AlertTriangle,
  empty: FileSearch,
} as const;

export function AsyncState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: AsyncStateProps) {
  const Icon = iconMap[type];

  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border border-white/80 bg-white/78 px-6 py-10 text-center shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl",
          type === "error" ? "bg-red-50 text-red-700" : "bg-accent text-primary",
        )}
      >
        <Icon className={cn("h-5 w-5", type === "loading" && "animate-spin")} />
      </span>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant={type === "error" ? "primary" : "outline"} size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
