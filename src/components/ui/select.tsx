"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

const optionButtonClass =
  "flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm transition-[background-color,color] outline-none";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      options,
      className,
      id,
      value,
      defaultValue,
      onChange,
      disabled,
      placeholder,
      name,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const nativeSelectId = `${selectId}-native`;
    const listboxId = `${selectId}-listbox`;
    const hiddenSelectRef = useRef<HTMLSelectElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
    const [open, setOpen] = useState(false);
    const [highlightedValue, setHighlightedValue] = useState("");
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(String(defaultValue ?? options[0]?.value ?? ""));
    const selectedValue = String(isControlled ? value ?? "" : internalValue);

    useImperativeHandle(ref, () => hiddenSelectRef.current as HTMLSelectElement, []);

    useEffect(() => {
      if (!open) return;

      const handlePointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          panelRef.current?.contains(target) ||
          buttonRef.current?.contains(target)
        ) {
          return;
        }
        setOpen(false);
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        setOpen(false);
        buttonRef.current?.focus();
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [open]);

    const selectedOption = useMemo(
      () => options.find((option) => option.value === selectedValue) ?? null,
      [options, selectedValue],
    );

    const openSelect = useCallback(
      (preferredValue?: string) => {
        const nextHighlighted = preferredValue ?? selectedValue ?? options[0]?.value ?? "";
        setHighlightedValue(nextHighlighted);
        setOpen(true);
        queueMicrotask(() => {
          optionRefs.current.get(nextHighlighted)?.focus();
        });
      },
      [options, selectedValue],
    );

    const commitValue = useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setInternalValue(nextValue);
        }

        if (hiddenSelectRef.current) {
          hiddenSelectRef.current.value = nextValue;
        }

        onChange?.({
          target: { value: nextValue, name: name ?? "" },
          currentTarget: { value: nextValue, name: name ?? "" },
        } as React.ChangeEvent<HTMLSelectElement>);

        setOpen(false);
        buttonRef.current?.focus();
      },
      [isControlled, name, onChange],
    );

    const moveHighlight = useCallback(
      (direction: "next" | "prev" | "first" | "last") => {
        if (options.length === 0) return;

        const values = options.map((option) => option.value);
        const currentIndex = Math.max(values.indexOf(highlightedValue), 0);
        const nextIndex =
          direction === "first"
            ? 0
            : direction === "last"
              ? values.length - 1
              : direction === "next"
                ? Math.min(currentIndex + 1, values.length - 1)
                : Math.max(currentIndex - 1, 0);

        const nextValue = values[nextIndex] ?? values[0];
        setHighlightedValue(nextValue);
        optionRefs.current.get(nextValue)?.focus();
      },
      [highlightedValue, options],
    );

    const handleTriggerKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;

        switch (event.key) {
          case "ArrowDown":
          case "Enter":
          case " ":
            event.preventDefault();
            openSelect();
            break;
          case "ArrowUp":
            event.preventDefault();
            openSelect(options[options.length - 1]?.value ?? "");
            break;
          default:
            break;
        }
      },
      [disabled, openSelect, options],
    );

    const handleOptionKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>, optionValue: string) => {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            moveHighlight("next");
            break;
          case "ArrowUp":
            event.preventDefault();
            moveHighlight("prev");
            break;
          case "Home":
            event.preventDefault();
            moveHighlight("first");
            break;
          case "End":
            event.preventDefault();
            moveHighlight("last");
            break;
          case "Enter":
          case " ":
            event.preventDefault();
            commitValue(optionValue);
            break;
          case "Escape":
            event.preventDefault();
            setOpen(false);
            buttonRef.current?.focus();
            break;
          default:
            break;
        }
      },
      [commitValue, moveHighlight],
    );

    return (
      <div className="space-y-2">
        {label ? (
          <label id={`${selectId}-label`} htmlFor={selectId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}

        <div className="relative">
          <select
            {...props}
            ref={hiddenSelectRef}
            id={nativeSelectId}
            name={name}
            required={required}
            value={selectedValue}
            onChange={() => {}}
            aria-hidden="true"
            tabIndex={-1}
            className="sr-only"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            ref={buttonRef}
            id={selectId}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-labelledby={label ? `${selectId}-label ${selectId}-value` : `${selectId}-value`}
            aria-controls={listboxId}
            onClick={() => {
              if (open) {
                setOpen(false);
              } else {
                openSelect();
              }
            }}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-2xl border border-border/80 bg-white/80 px-3.5 text-sm text-foreground shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)] transition-[border-color,box-shadow,background-color] focus-visible:border-primary/40 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
              open && "border-primary/35 bg-white ring-4 ring-primary/10",
              className,
            )}
          >
            <span id={`${selectId}-value`} className={cn("truncate text-left", !selectedOption && "text-muted")}>
              {selectedOption?.label ?? placeholder ?? ""}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                open && "rotate-180 text-primary",
              )}
            />
          </button>

          {open ? (
            <div
              ref={panelRef}
              className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-[24px] border border-white/80 bg-white/96 p-2 shadow-[0_26px_70px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl"
            >
              <div id={listboxId} role="listbox" aria-labelledby={label ? `${selectId}-label` : undefined}>
                {options.map((option) => {
                  const isSelected = option.value === selectedValue;
                  const isHighlighted = option.value === highlightedValue;

                  return (
                    <button
                      key={option.value}
                      ref={(node) => {
                        optionRefs.current.set(option.value, node);
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={isHighlighted ? 0 : -1}
                      onMouseEnter={() => setHighlightedValue(option.value)}
                      onClick={() => commitValue(option.value)}
                      onKeyDown={(event) => handleOptionKeyDown(event, option.value)}
                      className={cn(
                        optionButtonClass,
                        isSelected
                          ? "border border-primary/15 bg-primary/10 text-foreground shadow-[0_16px_34px_-28px_rgba(29,95,209,0.2)]"
                          : isHighlighted
                            ? "bg-accent text-foreground"
                            : "text-foreground hover:bg-accent",
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100 text-primary" : "opacity-0",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
    );
  },
);

Select.displayName = "Select";
