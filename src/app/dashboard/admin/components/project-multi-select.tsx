"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ProjectOption } from "../types";

type ProjectMultiSelectProps = {
  id: string;
  options: ProjectOption[];
  value: number[];
  onChange: (nextValue: number[]) => void;
  placeholder: string;
  selectedLabel: string;
  disabled?: boolean;
  widthClassName?: string;
};

export function ProjectMultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
  selectedLabel,
  disabled = false,
  widthClassName = "w-full",
}: ProjectMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={pickerRef} className={`relative ${widthClassName}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={`flex h-10 w-full items-center justify-between rounded-2xl border border-border/80 px-3.5 text-sm shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)] transition-[border-color,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 ${
          disabled
            ? "cursor-not-allowed bg-slate-100/90 text-muted opacity-70"
            : "bg-white/80 text-foreground hover:bg-white focus-visible:border-primary/40 focus-visible:bg-white"
        }`}
      >
        <span className={`truncate ${value.length === 0 ? "text-muted" : ""}`}>
          {value.length === 0 ? placeholder : selectedLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute z-[100] mt-2 w-full rounded-[24px] border border-white/80 bg-white/96 p-2 shadow-[0_26px_70px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div role="listbox" aria-multiselectable="true" className="max-h-72 overflow-auto">
            {options.map((option) => {
              const projectId = Number(option.value);
              const selected = value.includes(projectId);

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() =>
                    onChange(
                      selected
                        ? value.filter((currentValue) => currentValue !== projectId)
                        : [...value, projectId],
                    )
                  }
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm transition-[background-color,color] outline-none ${
                    selected
                      ? "border border-primary/15 bg-primary/10 text-foreground shadow-[0_16px_34px_-28px_rgba(29,95,209,0.2)]"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  <span
                    className={`inline-flex items-center rounded-full p-1 ${
                      selected ? "bg-primary/12 text-primary opacity-100" : "opacity-0"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
