"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useProject } from "@/lib/project-context";
import { fetchSnapshots } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { useImagePreloader } from "@/lib/use-image-preloader";
import { useTimelinePlayback } from "@/lib/use-timeline-playback";
import { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Select } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ImageOff, Loader2, Pause, Play } from "lucide-react";
import type { SnapshotMetadata } from "@/lib/types";

interface SnapshotWeek {
  id: string;
  label: string;
  dates: { date: string; globalIndex: number }[];
}

function groupIntoWeeks(sortedDates: string[]): SnapshotWeek[] {
  if (sortedDates.length === 0) return [];

  const weeks: SnapshotWeek[] = [];
  let currentDates: SnapshotWeek["dates"] = [];
  let weekStart: Date | null = null;

  for (let index = 0; index < sortedDates.length; index += 1) {
    const isoDate = sortedDates[index];
    const date = new Date(`${isoDate}T00:00:00`);

    if (!weekStart) {
      weekStart = date;
      currentDates = [{ date: isoDate, globalIndex: index }];
      continue;
    }

    const daysSinceStart = Math.floor(
      (date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceStart < 7) {
      currentDates.push({ date: isoDate, globalIndex: index });
      continue;
    }

    weeks.push({
      id: `week-${weeks.length + 1}`,
      label: `${weeks.length + 1}`,
      dates: currentDates,
    });
    weekStart = date;
    currentDates = [{ date: isoDate, globalIndex: index }];
  }

  if (currentDates.length > 0) {
    weeks.push({
      id: `week-${weeks.length + 1}`,
      label: `${weeks.length + 1}`,
      dates: currentDates,
    });
  }

  return weeks;
}

function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function sortSnapshots(snapshots: SnapshotMetadata[]): SnapshotMetadata[] {
  return snapshots.slice().sort((a, b) => a.date.localeCompare(b.date));
}

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
  const [layerA, setLayerA] = useState(currentUrl);
  const [layerB, setLayerB] = useState(currentUrl);
  const [layerAVisible, setLayerAVisible] = useState(true);
  const activeLayerRef = useRef<"A" | "B">("A");
  const committedUrlRef = useRef(currentUrl);
  const pendingLoadRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const commitImage = useCallback((url: string) => {
    if (activeLayerRef.current === "A") {
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
      return;
    }

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
  }, []);

  useEffect(() => {
    const targetUrl = currentUrl;
    if (targetUrl === committedUrlRef.current || targetUrl === pendingLoadRef.current) return;

    pendingLoadRef.current = targetUrl;

    if (isReady(targetUrl)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      commitImage(targetUrl);
      return;
    }

    waitForImage(targetUrl)
      .then(() => {
        if (!mountedRef.current) return;
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
  }, [commitImage, currentUrl, isReady, onError, waitForImage]);

  return (
    <>
      <img
        src={layerA}
        alt={`Site snapshot - ${currentDate}`}
        className="absolute inset-0 h-full w-full object-cover object-bottom"
        style={{
          opacity: layerAVisible ? 1 : 0,
          transition: "opacity 200ms ease-in-out",
          zIndex: layerAVisible ? 1 : 0,
        }}
        onError={onError}
      />
      <img
        src={layerB}
        alt={`Site snapshot - ${currentDate}`}
        className="absolute inset-0 h-full w-full object-cover object-bottom"
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

export default function TimelinePage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();
  const { data: snapshots, loading, error, refetch: refetchSnapshots } = useApi(
    () => fetchSnapshots(currentProject.id),
    [currentProject.id],
  );

  const sortedSnapshots = useMemo(() => sortSnapshots(snapshots ?? []), [snapshots]);
  const sortedDates = useMemo(
    () => sortedSnapshots.map((snapshot) => snapshot.date),
    [sortedSnapshots],
  );
  const weeks = useMemo(() => groupIntoWeeks(sortedDates), [sortedDates]);

  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const retryDateRef = useRef<string | null>(null);
  const retryUrlRef = useRef<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sortedSnapshots.length === 0) return;
    setActiveDate((current) => {
      if (current && sortedSnapshots.some((snapshot) => snapshot.date === current)) {
        return current;
      }
      return sortedSnapshots[sortedSnapshots.length - 1].date;
    });
  }, [sortedSnapshots]);

  useEffect(() => {
    setImgError(false);
    retryDateRef.current = null;
    retryUrlRef.current = null;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [activeDate]);

  const allUrls = useMemo(
    () => sortedSnapshots.map((snapshot) => snapshot.url),
    [sortedSnapshots],
  );

  const activeDateIdx = useMemo(() => {
    if (sortedSnapshots.length === 0) return 0;
    if (!activeDate) return sortedSnapshots.length - 1;
    const found = sortedSnapshots.findIndex((snapshot) => snapshot.date === activeDate);
    return found >= 0 ? found : sortedSnapshots.length - 1;
  }, [activeDate, sortedSnapshots]);

  const activeSnapshot = sortedSnapshots[activeDateIdx];
  const activeUrl = activeSnapshot?.url ?? "";

  const activeWeekIndex = useMemo(
    () => weeks.findIndex((week) => week.dates.some((entry) => entry.globalIndex === activeDateIdx)),
    [activeDateIdx, weeks],
  );

  const activeWeek = activeWeekIndex >= 0 ? weeks[activeWeekIndex] : weeks[weeks.length - 1];

  const weekOptions = useMemo(() => {
    return weeks.map((week) => ({
      value: week.id,
      label: `${t("timelinePage.weekLabel", { count: week.label })} - ${formatShortDate(week.dates[0].date)} to ${formatShortDate(week.dates[week.dates.length - 1].date)}`,
    }));
  }, [t, weeks]);

  const dateOptions = useMemo(() => {
    return (activeWeek?.dates ?? []).map((entry) => ({
      value: entry.date,
      label: `${entry.date} - ${formatShortDate(entry.date)}`,
    }));
  }, [activeWeek]);

  const { waitForImage, isReady } = useImagePreloader(allUrls, activeDateIdx, isPlayMode);

  const handleAdvance = useCallback(
    (nextIndex: number) => {
      setActiveDate(sortedDates[nextIndex] ?? null);
      setImgError(false);
    },
    [sortedDates],
  );

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

  useEffect(() => {
    setIsPlayMode(playing);
  }, [playing]);

  useEffect(() => {
    updateCurrentIndex(activeDateIdx);
  }, [activeDateIdx, updateCurrentIndex]);

  const handleSlider = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextIndex = Number(event.target.value);
      setActiveDate(sortedDates[nextIndex] ?? null);
      setImgError(false);
      stopPlay();
    },
    [sortedDates, stopPlay],
  );

  const handleWeekChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextWeek = weeks.find((week) => week.id === event.target.value);
      const fallbackDate = nextWeek?.dates[nextWeek.dates.length - 1]?.date ?? null;
      setActiveDate(fallbackDate);
      setImgError(false);
      stopPlay();
    },
    [stopPlay, weeks],
  );

  const handleDateChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setActiveDate(event.target.value);
      setImgError(false);
      stopPlay();
    },
    [stopPlay],
  );

  const handlePrev = useCallback(() => {
    const nextIndex = Math.max(0, activeDateIdx - 1);
    setActiveDate(sortedDates[nextIndex] ?? null);
    setImgError(false);
    stopPlay();
  }, [activeDateIdx, sortedDates, stopPlay]);

  const handleNext = useCallback(() => {
    const nextIndex = Math.min(sortedDates.length - 1, activeDateIdx + 1);
    setActiveDate(sortedDates[nextIndex] ?? null);
    setImgError(false);
    stopPlay();
  }, [activeDateIdx, sortedDates, stopPlay]);

  const handleImageError = useCallback(() => {
    if (!activeSnapshot) {
      setImgError(true);
      return;
    }

    if (retryDateRef.current !== activeSnapshot.date) {
      retryDateRef.current = activeSnapshot.date;
      retryUrlRef.current = activeSnapshot.url;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      void refetchSnapshots();
      retryTimerRef.current = setTimeout(() => {
        if (
          retryDateRef.current === activeSnapshot.date &&
          retryUrlRef.current === activeSnapshot.url
        ) {
          setImgError(true);
          retryDateRef.current = null;
          retryUrlRef.current = null;
        }
      }, 1500);
      return;
    }

    setImgError(true);
  }, [activeSnapshot, refetchSnapshots]);

  useEffect(() => {
    if (!activeSnapshot) return;
    if (retryDateRef.current !== activeSnapshot.date) return;
    if (retryUrlRef.current && retryUrlRef.current !== activeSnapshot.url) {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      retryDateRef.current = null;
      retryUrlRef.current = null;
      setImgError(false);
    }
  }, [activeSnapshot]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <AsyncState
        type="loading"
        title={t("common.loading")}
        description={t("timelinePage.description")}
      />
    );
  }

  const hasData = sortedDates.length > 0;

  if (error && !hasData) {
    return (
      <AsyncState
        type="error"
        title="Unable to load timeline snapshots"
        description={error}
        actionLabel="Retry"
        onAction={refetchSnapshots}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("timelinePage.title")}
            <HelpTooltip content={t("timelinePage.scrubbingHint")} panelClassName="left-0 right-auto w-72" />
          </CardTitle>
          <CardDescription>{t("timelinePage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!hasData ? (
            <AsyncState type="empty" title={t("timelinePage.empty")} className="min-h-[280px]" />
          ) : (
            <>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid gap-4 md:grid-cols-2 xl:flex-1">
                  <Select
                    id="timeline-week"
                    label={t("timelinePage.weekSelect")}
                    options={weekOptions}
                    value={activeWeek?.id ?? ""}
                    onChange={handleWeekChange}
                  />
                  <Select
                    id="timeline-date"
                    label={t("timelinePage.dateSelect")}
                    options={dateOptions}
                    value={activeDate ?? ""}
                    onChange={handleDateChange}
                  />
                </div>

                <div className="inline-flex items-center gap-3 self-start rounded-full border border-white/80 bg-accent/70 px-4 py-2.5 shadow-sm xl:self-auto">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      {t("timelinePage.availableCaptures")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tracking-tight text-foreground">{sortedDates.length}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrev}
                  disabled={activeDateIdx <= 0 || playing}
                  aria-label="Previous capture"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={playing ? "secondary" : "primary"}
                  size="icon"
                  onClick={togglePlay}
                  disabled={sortedDates.length < 2}
                  aria-label={playing ? "Pause playback" : "Start playback"}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  disabled={activeDateIdx >= sortedDates.length - 1 || playing}
                  aria-label="Next capture"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
                    <span>{sortedDates[0]}</span>
                    <span>{sortedDates[sortedDates.length - 1]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={sortedDates.length - 1}
                    value={activeDateIdx}
                    onChange={handleSlider}
                    className="w-full accent-primary"
                    aria-label={t("timelinePage.sliderAria")}
                  />
                </div>
                <HelpTooltip content={t("timelinePage.keyboardHelp")} panelClassName="right-0 w-72" />
              </div>

              <div
                className="relative aspect-[21/9] w-full overflow-hidden rounded-[28px] border border-white/75 bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
                tabIndex={0}
                role="region"
                aria-label="Timeline image viewer"
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    handlePrev();
                  } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    handleNext();
                  } else if (event.key === " ") {
                    event.preventDefault();
                    togglePlay();
                  }
                }}
              >
                {activeDate && !imgError ? (
                  <SnapshotViewer
                    currentUrl={activeUrl}
                    currentDate={activeDate}
                    isReady={isReady}
                    waitForImage={waitForImage}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
                    <ImageOff className="h-8 w-8 opacity-40" />
                    <span className="text-sm">{t("timelinePage.noImage", { date: activeDate ?? "" })}</span>
                  </div>
                )}

                <div className="absolute left-4 top-4 z-10 rounded-full bg-slate-950/72 px-3 py-1.5 text-sm font-medium text-white">
                  {activeDate}
                </div>
                <div className="absolute right-4 top-4 z-10 rounded-full bg-slate-950/72 px-3 py-1.5 text-xs font-medium text-white/90">
                  {activeDateIdx + 1} / {sortedDates.length}
                </div>
                {playing && waiting ? (
                  <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-slate-950/72 px-3 py-1.5 text-xs text-white/80">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("timelinePage.loadingNext")}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
