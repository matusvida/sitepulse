"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useProject } from "@/lib/project-context";
import { fetchSnapshotDates, snapshotUrl } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { ImageOff, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

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
    return <div className="py-12 text-center text-muted">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Site Timeline</CardTitle>
        <CardContent className="mt-4">
          {sortedDates.length === 0 ? (
            <div className="flex aspect-video items-center justify-center rounded-lg border bg-accent/50 text-sm text-muted">
              No snapshots available yet. Run a sync and detection first.
            </div>
          ) : (
            <>
              {/* Image display */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-zinc-50">
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

              {/* Controls */}
              <div className="mt-3 flex items-center gap-3">
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

                <div className="flex min-w-0 flex-1 flex-col gap-1">
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

                <button
                  onClick={handleNext}
                  disabled={activeDateIdx >= sortedDates.length - 1 || playing}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-muted transition-colors hover:bg-accent disabled:opacity-30"
                  aria-label="Next date"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Date markers */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {sortedDates.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => { setDateIndex(i); setImgError(false); setPlaying(false); }}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      i === activeDateIdx
                        ? "bg-primary text-white"
                        : "bg-accent text-muted hover:bg-accent/80"
                    }`}
                  >
                    {d.slice(5)}
                  </button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
