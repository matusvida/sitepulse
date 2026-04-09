"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

interface TabsContextValue {
  activeTab: string;
  baseId: string;
  setActiveTab: (tab: string) => void;
  onValueChange?: (value: string) => void;
  registerTrigger: (value: string, node: HTMLButtonElement | null) => void;
  moveFocus: (currentValue: string, direction: "next" | "prev" | "first" | "last") => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, children, className, onValueChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const baseId = useId();
  const triggerOrderRef = useRef<string[]>([]);
  const triggerMapRef = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const registerTrigger = useCallback((value: string, node: HTMLButtonElement | null) => {
    if (!triggerOrderRef.current.includes(value)) {
      triggerOrderRef.current.push(value);
    }
    triggerMapRef.current.set(value, node);
  }, []);

  const moveFocus = useCallback(
    (currentValue: string, direction: "next" | "prev" | "first" | "last") => {
      const order = triggerOrderRef.current;
      if (order.length === 0) return;

      const currentIndex = order.indexOf(currentValue);
      const nextIndex =
        direction === "first"
          ? 0
          : direction === "last"
            ? order.length - 1
            : direction === "next"
              ? (currentIndex + 1 + order.length) % order.length
              : (currentIndex - 1 + order.length) % order.length;

      const nextValue = order[nextIndex];
      if (!nextValue) return;

      setActiveTab(nextValue);
      onValueChange?.(nextValue);
      triggerMapRef.current.get(nextValue)?.focus();
    },
    [onValueChange],
  );

  const value = useMemo(
    () => ({
      activeTab,
      baseId,
      setActiveTab,
      onValueChange,
      registerTrigger,
      moveFocus,
    }),
    [activeTab, baseId, onValueChange, registerTrigger, moveFocus],
  );

  return (
    <TabsContext.Provider value={value}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl border border-white/80 bg-white/80 p-1 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm",
        className,
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { activeTab, setActiveTab, onValueChange, registerTrigger, moveFocus, baseId } = useTabs();
  const isActive = activeTab === value;

  const handleClick = useCallback(() => {
    setActiveTab(value);
    onValueChange?.(value);
  }, [setActiveTab, value, onValueChange]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          moveFocus(value, "next");
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          moveFocus(value, "prev");
          break;
        case "Home":
          event.preventDefault();
          moveFocus(value, "first");
          break;
        case "End":
          event.preventDefault();
          moveFocus(value, "last");
          break;
        default:
          break;
      }
    },
    [moveFocus, value],
  );

  return (
    <button
      ref={(node) => registerTrigger(value, node)}
      type="button"
      role="tab"
      id={`${baseId}-${value}-tab`}
      aria-selected={isActive}
      aria-controls={`${baseId}-${value}-panel`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "rounded-xl px-3.5 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        isActive
          ? "bg-primary text-white shadow-[0_14px_28px_-20px_rgba(29,95,209,0.95)]"
          : "text-muted hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab, baseId } = useTabs();
  if (activeTab !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-${value}-panel`}
      aria-labelledby={`${baseId}-${value}-tab`}
      className={cn("mt-4", className)}
    >
      {children}
    </div>
  );
}
