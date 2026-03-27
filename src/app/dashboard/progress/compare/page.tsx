"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useProject } from "@/lib/project-context";
import { fetchSnapshotDates, snapshotUrl, fetchWeeklyMetrics } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";

interface Week {
  label: string;
  dates: { date: string; globalIndex: number }[];
}

function groupIntoWeeks(sortedDates: string[]): Week[] {
  if (sortedDates.length === 0) return [];

  const weeks: Week[] = [];
  let currentWeek: Week["dates"] = [];
  let weekStart: Date | null = null;

  for (let i = 0; i < sortedDates.length; i++) {
    const d = new Date(sortedDates[i] + "T00:00:00");

    if (!weekStart) {
      weekStart = d;
      currentWeek = [{ date: sortedDates[i], globalIndex: i }];
    } else {
      const daysSinceStart = Math.floor(
        (d.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceStart < 7) {
        currentWeek.push({ date: sortedDates[i], globalIndex: i });
      } else {
        weeks.push({ label: `Week ${weeks.length + 1}`, dates: currentWeek });
        weekStart = d;
        currentWeek = [{ date: sortedDates[i], globalIndex: i }];
      }
    }
  }

  if (currentWeek.length > 0) {
    weeks.push({ label: `Week ${weeks.length + 1}`, dates: currentWeek });
  }

  return weeks;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function WeekPicker({
  label,
  weeks,
  activeDateIdx,
  onSelect,
}: {
  label: string;
  weeks: Week[];
  activeDateIdx: number;
  onSelect: (globalIndex: number) => void;
}) {
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback((weekIdx: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenWeek(weekIdx);
  }, []);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpenWeek(null), 200);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {weeks.map((week, wi) => {
          const hasActive = week.dates.some((d) => d.globalIndex === activeDateIdx);
          const dateRange = `${formatShortDate(week.dates[0].date)} – ${formatShortDate(week.dates[week.dates.length - 1].date)}`;

          return (
            <div
              key={wi}
              className="relative"
              onMouseEnter={() => handleEnter(wi)}
              onMouseLeave={handleLeave}
            >
              <button
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  hasActive
                    ? "bg-primary text-white"
                    : openWeek === wi
                      ? "bg-accent/80 text-foreground"
                      : "bg-accent text-muted hover:bg-accent/80"
                }`}
              >
                <span className="block">{week.label}</span>
                <span className="block text-[9px] font-normal opacity-75">
                  {dateRange}
                </span>
              </button>

              {openWeek === wi && (
                <div
                  className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border bg-card p-1.5 shadow-lg"
                  onMouseEnter={() => handleEnter(wi)}
                  onMouseLeave={handleLeave}
                >
                  {week.dates.map((entry) => (
                    <button
                      key={entry.date}
                      onClick={() => {
                        onSelect(entry.globalIndex);
                        setOpenWeek(null);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                        entry.globalIndex === activeDateIdx
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="tabular-nums">{entry.date}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProgressComparePage() {
  const { currentProject } = useProject();

  const { data: dates, loading: loadingDates } = useApi(
    () => fetchSnapshotDates(currentProject.id),
    [currentProject.id],
  );

  const { data: weekly } = useApi(
    () => fetchWeeklyMetrics(currentProject.id, 26),
    [currentProject.id],
  );

  const sortedDates = useMemo(
    () => (dates ?? []).slice().sort(),
    [dates],
  );

  const weeks = useMemo(() => groupIntoWeeks(sortedDates), [sortedDates]);

  const [idxA, setIdxA] = useState<number | null>(null);
  const [idxB, setIdxB] = useState<number | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [imgAError, setImgAError] = useState(false);
  const [imgBError, setImgBError] = useState(false);

  const activeIdxA = idxA ?? (sortedDates.length > 1 ? sortedDates.length - 2 : 0);
  const activeIdxB = idxB ?? (sortedDates.length > 0 ? sortedDates.length - 1 : 0);

  const effectiveA = sortedDates[activeIdxA] ?? "";
  const effectiveB = sortedDates[activeIdxB] ?? "";

  const imgSrcA = effectiveA ? snapshotUrl(currentProject.id, effectiveA) : "";
  const imgSrcB = effectiveB ? snapshotUrl(currentProject.id, effectiveB) : "";

  const handleSelectA = useCallback((globalIndex: number) => {
    setIdxA(globalIndex);
    setImgAError(false);
  }, []);

  const handleSelectB = useCallback((globalIndex: number) => {
    setIdxB(globalIndex);
    setImgBError(false);
  }, []);

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPos(Number(e.target.value));
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updatePosFromEvent = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosFromEvent(e.clientX);
    },
    [updatePosFromEvent],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      updatePosFromEvent(e.clientX);
    },
    [updatePosFromEvent],
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Prefetch selected images
  useEffect(() => {
    if (effectiveA) {
      const img = new Image();
      img.src = snapshotUrl(currentProject.id, effectiveA);
    }
    if (effectiveB) {
      const img = new Image();
      img.src = snapshotUrl(currentProject.id, effectiveB);
    }
  }, [effectiveA, effectiveB, currentProject.id]);

  const metricsForDate = useCallback(
    (d: string) => {
      if (!weekly) return null;
      const weekStart = weekly.find((w) => {
        const ws = new Date(w.weekStart);
        const target = new Date(d);
        const diff = (target.getTime() - ws.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 7;
      });
      return weekStart ?? null;
    },
    [weekly],
  );

  const detectedChanges = useMemo(() => {
    const mA = metricsForDate(effectiveA);
    const mB = metricsForDate(effectiveB);
    if (!mA || !mB) return [];
    const delta = mB.progressDelta - mA.progressDelta;
    return [
      `Progress delta changed from ${mA.progressDelta}% to ${mB.progressDelta}% (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%)`,
      `Activity index ${mB.activityIndex > mA.activityIndex ? "increased" : "decreased"} from ${mA.activityIndex.toFixed(0)} to ${mB.activityIndex.toFixed(0)}`,
      `Active hours went from ${mA.activeHours}h to ${mB.activeHours}h`,
      mB.riskLevel !== mA.riskLevel
        ? `Risk level changed from ${mA.riskLevel} to ${mB.riskLevel}`
        : `Risk level remained ${mB.riskLevel}`,
    ];
  }, [effectiveA, effectiveB, metricsForDate]);

  if (loadingDates) {
    return <div className="py-12 text-center text-muted">Loading...</div>;
  }

  const hasData = sortedDates.length > 0;

  const placeholder = (label: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
      <ImageOff className="h-8 w-8 opacity-40" />
      <span className="text-xs">{label}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top toolbar: week pickers for A and B */}
      {hasData && (
        <div className="space-y-3">
          <div className="space-y-2">
            <WeekPicker
              label="Snapshot A"
              weeks={weeks}
              activeDateIdx={activeIdxA}
              onSelect={handleSelectA}
            />
            <WeekPicker
              label="Snapshot B"
              weeks={weeks}
              activeDateIdx={activeIdxB}
              onSelect={handleSelectB}
            />
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={handleSlider}
              className="w-full cursor-pointer"
              aria-label="Compare slider"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>A: {effectiveA}</span>
              <span>B: {effectiveB}</span>
            </div>
          </div>
        </div>
      )}

      {!hasData ? (
        <div className="py-12 text-center text-muted">
          No snapshots available yet. Run a sync and detection first.
        </div>
      ) : (
        <>
          {/* Before/After slider */}
          <Card>
            <CardTitle>Visual Comparison</CardTitle>
            <CardContent className="mt-4">
              <div
                ref={containerRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border bg-zinc-50 cursor-col-resize select-none touch-none"
              >
                {/* Snapshot B (full background) */}
                <div className="absolute inset-0">
                  {imgSrcB && !imgBError ? (
                    <img
                      src={imgSrcB}
                      alt={`Snapshot B — ${effectiveB}`}
                      className="h-full w-full object-cover pointer-events-none"
                      draggable={false}
                      onError={() => setImgBError(true)}
                    />
                  ) : (
                    placeholder(`Snapshot B — ${effectiveB}`)
                  )}
                </div>

                {/* Snapshot A (clipped to left side) */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                  {imgSrcA && !imgAError ? (
                    <img
                      src={imgSrcA}
                      alt={`Snapshot A — ${effectiveA}`}
                      className="h-full w-full object-cover pointer-events-none"
                      draggable={false}
                      onError={() => setImgAError(true)}
                    />
                  ) : (
                    placeholder(`Snapshot A — ${effectiveA}`)
                  )}
                </div>

                {/* Date labels */}
                <div className="absolute top-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white pointer-events-none">
                  A: {effectiveA}
                </div>
                <div className="absolute top-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white pointer-events-none">
                  B: {effectiveB}
                </div>

                {/* Draggable divider line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-md pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="flex h-10 w-6 items-center justify-center rounded-full bg-white shadow-lg">
                    <div className="flex gap-0.5">
                      <div className="h-4 w-0.5 rounded-full bg-zinc-400" />
                      <div className="h-4 w-0.5 rounded-full bg-zinc-400" />
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Detected changes */}
          {detectedChanges.length > 0 && (
            <Card>
              <CardTitle>Metric Changes</CardTitle>
              <CardContent className="mt-3">
                <ul className="space-y-2">
                  {detectedChanges.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="mt-0.5 shrink-0">
                        {i + 1}
                      </Badge>
                      <span className="text-muted">{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
