"use client";

import { useState, useMemo, useCallback } from "react";
import { useProject } from "@/lib/project-context";
import { fetchSnapshotDates, snapshotUrl, fetchWeeklyMetrics } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageOff } from "lucide-react";

export default function ComparePage() {
  const { currentProject } = useProject();

  const { data: dates, loading: loadingDates } = useApi(
    () => fetchSnapshotDates(currentProject.id),
    [currentProject.id],
  );

  const { data: weekly } = useApi(
    () => fetchWeeklyMetrics(currentProject.id, 26),
    [currentProject.id],
  );

  const dateOptions = useMemo(
    () => (dates ?? []).map((d) => ({ value: d, label: d })),
    [dates],
  );

  const [dateA, setDateA] = useState<string>("");
  const [dateB, setDateB] = useState<string>("");
  const [sliderPos, setSliderPos] = useState(50);
  const [imgAError, setImgAError] = useState(false);
  const [imgBError, setImgBError] = useState(false);

  const effectiveA = dateA || dates?.[1] || dates?.[0] || "";
  const effectiveB = dateB || dates?.[0] || "";

  const imgSrcA = effectiveA ? snapshotUrl(currentProject.id, effectiveA) : "";
  const imgSrcB = effectiveB ? snapshotUrl(currentProject.id, effectiveB) : "";

  const handleDateA = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateA(e.target.value);
    setImgAError(false);
  }, []);

  const handleDateB = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateB(e.target.value);
    setImgBError(false);
  }, []);

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPos(Number(e.target.value));
  }, []);

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
    return <div className="py-12 text-center text-muted">Loading…</div>;
  }

  if (!dates || dates.length === 0) {
    return (
      <div className="py-12 text-center text-muted">
        No snapshots available yet. Run a sync and detection first.
      </div>
    );
  }

  const placeholder = (label: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
      <ImageOff className="h-8 w-8 opacity-40" />
      <span className="text-xs">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Compare Snapshots</h1>

      <div className="flex flex-wrap items-end gap-4">
        <Select
          id="date-a"
          label="Snapshot A"
          options={dateOptions}
          value={effectiveA}
          onChange={handleDateA}
        />
        <Select
          id="date-b"
          label="Snapshot B"
          options={dateOptions}
          value={effectiveB}
          onChange={handleDateB}
        />
      </div>

      {/* Before/After slider */}
      <Card>
        <CardTitle>Visual Comparison</CardTitle>
        <CardContent className="mt-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-zinc-50">
            {/* Snapshot B (full background) */}
            <div className="absolute inset-0">
              {imgSrcB && !imgBError ? (
                <img
                  src={imgSrcB}
                  alt={`Snapshot B — ${effectiveB}`}
                  className="h-full w-full object-cover"
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
                  className="h-full w-full object-cover"
                  onError={() => setImgAError(true)}
                />
              ) : (
                placeholder(`Snapshot A — ${effectiveA}`)
              )}
            </div>

            {/* Date labels */}
            <div className="absolute top-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
              A: {effectiveA}
            </div>
            <div className="absolute top-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
              B: {effectiveB}
            </div>

            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
              style={{ left: `${sliderPos}%` }}
            />
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-1 shadow-md"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="h-5 w-5 rounded-full border-2 border-zinc-400" />
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={handleSlider}
            className="mt-3 w-full cursor-pointer"
            aria-label="Compare slider"
          />
          <div className="flex justify-between text-xs text-muted">
            <span>Snapshot A</span>
            <span>Snapshot B</span>
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
    </div>
  );
}
