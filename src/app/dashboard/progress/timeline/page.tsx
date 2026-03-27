"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useProject } from "@/lib/project-context";
import { fetchSnapshotDates, snapshotUrl } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useImagePreloader } from "@/lib/use-image-preloader";
import { useTimelinePlayback } from "@/lib/use-timeline-playback";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { ImageOff, ChevronLeft, ChevronRight, Play, Pause, Loader2 } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── WeekPicker ───────────────────────────────────────────────────────────────

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

// ── SnapshotViewer ───────────────────────────────────────────────────────────
//
// This is the core image display component. It uses a double-buffer approach
// where TWO <img> elements are always mounted with stable `src` attributes.
// The crucial difference from the old implementation:
//
//   1. No `key` prop that forces DOM re-creation (which caused white flashes).
//   2. The incoming image's opacity stays at 0 until its `onLoad` fires,
//      guaranteeing we never show a half-loaded or blank image.
//   3. The outgoing image remains fully visible until the incoming one is ready.
//
// The "committed" image is the one currently fully visible. A "pending" image
// is loaded in the hidden layer. Only after it loads do we crossfade.

interface SnapshotViewerProps {
  currentUrl: string;
  currentDate: string;
  isReady: (url: string) => boolean;
  waitForImage: (url: string) => Promise<HTMLImageElement>;
  onError: () => void;
}

function SnapshotViewer({
  currentUrl,
  currentDate,
  isReady,
  waitForImage,
  onError,
}: SnapshotViewerProps) {
  // Track which layer (A or B) is the "committed" (visible) one.
  // We use a ref for activeLayer because commitImage is called from
  // async contexts (promise callbacks) where state closures would be stale.
  const [layerA, setLayerA] = useState(currentUrl);
  const [layerB, setLayerB] = useState(currentUrl);
  const [layerAVisible, setLayerAVisible] = useState(true);
  const activeLayerRef = useRef<"A" | "B">("A");
  const committedUrlRef = useRef(currentUrl);
  const pendingLoadRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const commitImage = useCallback((url: string) => {
    // Place the new URL in the HIDDEN layer, then crossfade.
    // The double-rAF ensures the browser has actually set the src
    // and decoded the image before we trigger the opacity transition.
    if (activeLayerRef.current === "A") {
      // A is visible -> load into B -> reveal B
      setLayerB(url);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!mountedRef.current) return;
          setLayerAVisible(false);
          activeLayerRef.current = "B";
          committedUrlRef.current = url;
          pendingLoadRef.current = null;
        });
      });
    } else {
      // B is visible -> load into A -> reveal A
      setLayerA(url);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!mountedRef.current) return;
          setLayerAVisible(true);
          activeLayerRef.current = "A";
          committedUrlRef.current = url;
          pendingLoadRef.current = null;
        });
      });
    }
  }, []);

  // When currentUrl changes, begin loading it in the hidden layer.
  // Only after it is fully decoded do we crossfade. The old image
  // remains 100% visible until then -- zero white flashes.
  useEffect(() => {
    const targetUrl = currentUrl;

    // Already showing this URL -- nothing to do
    if (targetUrl === committedUrlRef.current) return;
    // Already loading this exact URL as pending
    if (targetUrl === pendingLoadRef.current) return;

    pendingLoadRef.current = targetUrl;

    // If the preloader already has this image decoded, swap instantly.
    if (isReady(targetUrl)) {
      commitImage(targetUrl);
      return;
    }

    // Otherwise, start loading and wait for decode to finish.
    waitForImage(targetUrl)
      .then(() => {
        if (!mountedRef.current) return;
        // Only commit if this is still the URL we want (handles rapid clicking)
        if (pendingLoadRef.current === targetUrl) {
          commitImage(targetUrl);
        }
      })
      .catch(() => {
        if (!mountedRef.current) return;
        if (pendingLoadRef.current === targetUrl) {
          onError();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl, commitImage]);

  return (
    <>
      {/* Layer A */}
      <img
        src={layerA}
        alt={`Site snapshot — ${currentDate}`}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: layerAVisible ? 1 : 0,
          transition: "opacity 200ms ease-in-out",
          // Ensure the visible layer is painted on top
          zIndex: layerAVisible ? 1 : 0,
        }}
        // Suppress browser-native error handling; we handle via preloader
        onError={onError}
      />
      {/* Layer B */}
      <img
        src={layerB}
        alt={`Site snapshot — ${currentDate}`}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: layerAVisible ? 0 : 1,
          transition: "opacity 200ms ease-in-out",
          zIndex: layerAVisible ? 0 : 1,
        }}
        onError={onError}
      />
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

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

  // Build the full URL list for the preloader (memoized so the array
  // reference is stable and doesn't trigger unnecessary re-renders).
  const allUrls = useMemo(
    () => sortedDates.map((d) => snapshotUrl(currentProject.id, d)),
    [sortedDates, currentProject.id],
  );

  const [dateIndex, setDateIndex] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [isPlayMode, setIsPlayMode] = useState(false);

  const activeDateIdx = dateIndex ?? (sortedDates.length > 0 ? sortedDates.length - 1 : 0);
  const activeDate = sortedDates[activeDateIdx] ?? "";
  const activeUrl = allUrls[activeDateIdx] ?? "";

  // ── Image preloader: manages a single cache of decoded images ────────────
  // The `isPlayMode` flag makes it preload more aggressively forward (8 ahead
  // instead of 4) so playback never stalls waiting for the next image.
  const { waitForImage, isReady } = useImagePreloader(
    allUrls,
    activeDateIdx,
    isPlayMode,
  );

  // ── Playback controller: only advances when next image is decoded ───────
  const handleAdvance = useCallback((nextIndex: number) => {
    setDateIndex(nextIndex);
    setImgError(false);
  }, []);

  const canAdvance = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= allUrls.length) return false;
      return isReady(allUrls[nextIndex]);
    },
    [allUrls, isReady],
  );

  const { playing, waiting, toggle: togglePlay, stop: stopPlay, updateCurrentIndex } =
    useTimelinePlayback({
      totalFrames: sortedDates.length,
      intervalMs: 800,
      onAdvance: handleAdvance,
      canAdvance,
    });

  // Sync play mode state for the preloader
  useEffect(() => {
    setIsPlayMode(playing);
  }, [playing]);

  // Keep the playback controller aware of the current index
  useEffect(() => {
    updateCurrentIndex(activeDateIdx);
  }, [activeDateIdx, updateCurrentIndex]);

  // ── Navigation handlers ─────────────────────────────────────────────────
  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateIndex(Number(e.target.value));
      setImgError(false);
      stopPlay();
    },
    [stopPlay],
  );

  const handleDateSelect = useCallback(
    (globalIndex: number) => {
      setDateIndex(globalIndex);
      setImgError(false);
      stopPlay();
    },
    [stopPlay],
  );

  // For arrow navigation: if the image is already decoded, navigate
  // instantly. If not, start loading it and navigate anyway (the
  // SnapshotViewer will hold the old image until the new one loads).
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

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, togglePlay]);

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
                <SnapshotViewer
                  currentUrl={activeUrl}
                  currentDate={activeDate}
                  isReady={isReady}
                  waitForImage={waitForImage}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                  <ImageOff className="h-8 w-8 opacity-40" />
                  <span className="text-xs">No image for {activeDate}</span>
                </div>
              )}

              {/* Date badge */}
              <div className="absolute top-3 left-3 z-10 rounded bg-black/60 px-3 py-1.5 text-sm font-medium text-white">
                {activeDate}
              </div>
              {/* Counter badge */}
              <div className="absolute top-3 right-3 z-10 rounded bg-black/60 px-2 py-1 text-xs text-white/80">
                {activeDateIdx + 1} / {sortedDates.length}
              </div>
              {/* Subtle loading indicator during playback when waiting for next image */}
              {playing && waiting && (
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1">
                  <Loader2 className="h-3 w-3 animate-spin text-white/70" />
                  <span className="text-[10px] text-white/70">Loading next...</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
