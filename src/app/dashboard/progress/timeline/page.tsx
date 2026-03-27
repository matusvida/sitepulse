"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useProject } from "@/lib/project-context";
import { fetchSnapshotDates, snapshotUrl } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { ImageOff, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

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
  weeks,
  activeDateIdx,
  onSelect,
}: {
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
    <div className="flex flex-wrap gap-1.5">
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
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                hasActive
                  ? "bg-primary text-white"
                  : openWeek === wi
                    ? "bg-accent/80 text-foreground"
                    : "bg-accent text-muted hover:bg-accent/80"
              }`}
            >
              <span className="block">{week.label}</span>
              <span className="block text-[10px] font-normal opacity-75">
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
  );
}

export default function TimelinePage() {
  const { currentProject } = useProject();

  const { data: dates, loading } = useApi(
    () => fetchSnapshotDates(currentProject.id),
    [currentProject.id],
  );

  const sortedDates = useMemo(
    () => (dates ?? []).slice().sort(),
    [dates],
  );

  const weeks = useMemo(() => groupIntoWeeks(sortedDates), [sortedDates]);

  const [dateIndex, setDateIndex] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeDateIdx = dateIndex ?? (sortedDates.length > 0 ? sortedDates.length - 1 : 0);
  const activeDate = sortedDates[activeDateIdx] ?? "";

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateIndex(Number(e.target.value));
      setImgError(false);
      setPlaying(false);
    },
    [],
  );

  const handleDateSelect = useCallback((globalIndex: number) => {
    setDateIndex(globalIndex);
    setImgError(false);
    setPlaying(false);
  }, []);

  const handlePrev = useCallback(() => {
    setDateIndex((prev) => Math.max(0, (prev ?? sortedDates.length - 1) - 1));
    setImgError(false);
  }, [sortedDates.length]);

  const handleNext = useCallback(() => {
    setDateIndex((prev) =>
      Math.min(sortedDates.length - 1, (prev ?? sortedDates.length - 1) + 1),
    );
    setImgError(false);
  }, [sortedDates.length]);

  const togglePlay = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (playing && sortedDates.length > 1) {
      intervalRef.current = setInterval(() => {
        setDateIndex((prev) => {
          const current = prev ?? sortedDates.length - 1;
          if (current >= sortedDates.length - 1) {
            setPlaying(false);
            return current;
          }
          setImgError(false);
          return current + 1;
        });
      }, 1500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, sortedDates.length]);

  if (loading) {
    return <div className="py-12 text-center text-muted">Loading...</div>;
  }

  const hasData = sortedDates.length > 0;

  return (
    <div className="space-y-4">
      {/* Top toolbar: playback controls + week picker */}
      {hasData && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={activeDateIdx <= 0 || playing}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-muted transition-colors hover:bg-accent disabled:opacity-30"
              aria-label="Previous date"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={sortedDates.length < 2}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-muted transition-colors hover:bg-accent disabled:opacity-30"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={activeDateIdx >= sortedDates.length - 1 || playing}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-muted transition-colors hover:bg-accent disabled:opacity-30"
              aria-label="Next date"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="mx-1 h-5 w-px bg-zinc-200" />

            <WeekPicker
              weeks={weeks}
              activeDateIdx={activeDateIdx}
              onSelect={handleDateSelect}
            />
          </div>

          {/* Slider */}
          <div className="flex flex-col gap-1">
            <input
              type="range"
              min={0}
              max={sortedDates.length - 1}
              value={activeDateIdx}
              onChange={handleSlider}
              className="w-full cursor-pointer"
              aria-label="Timeline slider"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>{sortedDates[0]}</span>
              <span>{sortedDates[sortedDates.length - 1]}</span>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardTitle>Site Timeline</CardTitle>
        <CardContent className="mt-4">
          {!hasData ? (
            <div className="flex aspect-video items-center justify-center rounded-lg border bg-accent/50 text-sm text-muted">
              No snapshots available yet. Run a sync and detection first.
            </div>
          ) : (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border bg-zinc-50">
              {activeDate && !imgError ? (
                <img
                  key={activeDate}
                  src={snapshotUrl(currentProject.id, activeDate)}
                  alt={`Site snapshot — ${activeDate}`}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                  <ImageOff className="h-8 w-8 opacity-40" />
                  <span className="text-xs">No image for {activeDate}</span>
                </div>
              )}

              <div className="absolute top-3 left-3 rounded bg-black/60 px-3 py-1.5 text-sm font-medium text-white">
                {activeDate}
              </div>
              <div className="absolute top-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white/80">
                {activeDateIdx + 1} / {sortedDates.length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
