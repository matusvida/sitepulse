"use client";

import { cn } from "@/lib/utils";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
  bare?: boolean;
  showCloseButton?: boolean;
}

const focusableSelectors =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  hideHeader = false,
  bare = false,
  showCloseButton = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstFocusable = focusables?.[0];
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const nodes = dialog.querySelectorAll<HTMLElement>(focusableSelectors);
      const ordered = Array.from(nodes);
      if (ordered.length === 0) return;

      const first = ordered[0];
      const last = ordered[ordered.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 sm:py-12">
      <button
        type="button"
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          bare
            ? "relative z-10 w-auto max-w-none border-0 bg-transparent p-0 shadow-none"
            : "relative z-10 w-full max-w-xl rounded-[30px] border border-white/80 bg-white/96 p-6 shadow-[0_30px_80px_-38px_rgba(15,23,42,0.5)] sm:p-7",
          className,
        )}
      >
        {hideHeader ? (
          showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-20 rounded-full bg-slate-950/52 p-2 text-white/80 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.9)] transition-[background-color,color,transform,box-shadow] duration-200 ease-out hover:bg-slate-950/72 hover:text-white hover:scale-[1.03] hover:shadow-[0_22px_44px_-24px_rgba(15,23,42,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          ) : null
        ) : (
          <div className="mb-5 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              {title ? <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2> : null}
            </div>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border/80 bg-white/80 p-2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
