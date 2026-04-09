"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProject } from "@/lib/project-context";
import { fetchSnapshots, fetchWeeklyMetrics } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ImageOff } from "lucide-react";
import type { SnapshotMetadata } from "@/lib/types";

function sortSnapshots(snapshots: SnapshotMetadata[]): SnapshotMetadata[] {
  return snapshots.slice().sort((a, b) => a.date.localeCompare(b.date));
}

export default function ProgressComparePage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();
  const { data: snapshots, loading } = useApi(
    () => fetchSnapshots(currentProject.id),
    [currentProject.id],
  );
  const { data: weekly } = useApi(
    () => fetchWeeklyMetrics(currentProject.id, 26),
    [currentProject.id],
  );

  const sortedSnapshots = useMemo(() => sortSnapshots(snapshots ?? []), [snapshots]);
  const sortedDates = useMemo(() => sortedSnapshots.map((snapshot) => snapshot.date), [sortedSnapshots]);
  const dateOptions = useMemo(
    () => sortedDates.map((date) => ({ value: date, label: date })),
    [sortedDates],
  );

  const [selectedDateA, setSelectedDateA] = useState<string>("");
  const [selectedDateB, setSelectedDateB] = useState<string>("");
  const [sliderPos, setSliderPos] = useState(50);
  const [failedDateA, setFailedDateA] = useState<string | null>(null);
  const [failedDateB, setFailedDateB] = useState<string | null>(null);

  const resolvedDateA = useMemo(() => {
    if (sortedDates.length === 0) return "";
    if (selectedDateA && sortedDates.includes(selectedDateA)) return selectedDateA;
    return sortedDates[Math.max(sortedDates.length - 2, 0)] ?? sortedDates[0] ?? "";
  }, [selectedDateA, sortedDates]);

  const resolvedDateB = useMemo(() => {
    if (sortedDates.length === 0) return "";
    if (selectedDateB && sortedDates.includes(selectedDateB)) return selectedDateB;
    return sortedDates[sortedDates.length - 1] ?? "";
  }, [selectedDateB, sortedDates]);

  const snapshotA = sortedSnapshots.find((snapshot) => snapshot.date === resolvedDateA) ?? null;
  const snapshotB = sortedSnapshots.find((snapshot) => snapshot.date === resolvedDateB) ?? null;

  useEffect(() => {
    if (snapshotA?.url) {
      const img = new Image();
      img.src = snapshotA.url;
    }
    if (snapshotB?.url) {
      const img = new Image();
      img.src = snapshotB.url;
    }
  }, [snapshotA?.url, snapshotB?.url]);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updatePosFromEvent = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      updatePosFromEvent(event.clientX);
    },
    [updatePosFromEvent],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updatePosFromEvent(event.clientX);
    },
    [updatePosFromEvent],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const metricsForDate = useCallback(
    (date: string) => {
      if (!weekly) return null;
      return (
        weekly.find((entry) => {
          const weekStart = new Date(entry.weekStart);
          const target = new Date(date);
          const diff = (target.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff < 7;
        }) ?? null
      );
    },
    [weekly],
  );

  const detectedChanges = useMemo(() => {
    const metricA = metricsForDate(resolvedDateA);
    const metricB = metricsForDate(resolvedDateB);
    if (!metricA || !metricB) return [];
    const riskA =
      metricA.riskLevel === "Low"
        ? t("overview.riskLow")
        : metricA.riskLevel === "Medium"
          ? t("overview.riskMedium")
          : t("overview.riskHigh");
    const riskB =
      metricB.riskLevel === "Low"
        ? t("overview.riskLow")
        : metricB.riskLevel === "Medium"
          ? t("overview.riskMedium")
          : t("overview.riskHigh");

    const delta = metricB.progressDelta - metricA.progressDelta;

    return [
      t("comparePage.changeProgress", {
        from: metricA.progressDelta,
        to: metricB.progressDelta,
        delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`,
      }),
      metricB.activityIndex >= metricA.activityIndex
        ? t("comparePage.changeActivityRose", {
            from: metricA.activityIndex.toFixed(0),
            to: metricB.activityIndex.toFixed(0),
          })
        : t("comparePage.changeActivityFell", {
            from: metricA.activityIndex.toFixed(0),
            to: metricB.activityIndex.toFixed(0),
          }),
      t("comparePage.changeHours", {
        from: metricA.activeHours,
        to: metricB.activeHours,
      }),
      metricA.riskLevel === metricB.riskLevel
        ? t("comparePage.changeRiskSame", { value: riskB })
        : t("comparePage.changeRiskChanged", { from: riskA, to: riskB }),
    ];
  }, [metricsForDate, resolvedDateA, resolvedDateB, t]);

  if (loading) {
    return <div className="py-12 text-center text-muted">{t("common.loading")}</div>;
  }

  const hasData = sortedDates.length > 0;

  const placeholder = (label: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-accent/45 text-muted">
      <ImageOff className="h-8 w-8 opacity-40" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {!hasData ? (
        <Card className="p-10 text-center">
          <ImageOff className="mx-auto h-8 w-8 text-muted/40" />
          <p className="mt-3 text-sm font-medium text-foreground">{t("comparePage.noSnapshotsTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("comparePage.noSnapshotsDescription")}</p>
        </Card>
      ) : (
        <>
          <Card className="relative z-20">
            <CardHeader>
              <CardTitle>{t("comparePage.controlsTitle")}</CardTitle>
              <CardDescription>{t("comparePage.controlsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <Select
                  id="snapshot-a"
                  label={t("comparePage.snapshotA")}
                  options={dateOptions}
                  value={resolvedDateA}
                  onChange={(event) => setSelectedDateA(event.target.value)}
                />
                <Select
                  id="snapshot-b"
                  label={t("comparePage.snapshotB")}
                  options={dateOptions}
                  value={resolvedDateB}
                  onChange={(event) => setSelectedDateB(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span>{resolvedDateA}</span>
                  <span>{resolvedDateB}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPos}
                  onChange={(event) => setSliderPos(Number(event.target.value))}
                  className="w-full accent-primary"
                  aria-label={t("comparePage.sliderAria")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="relative z-10">
            <CardHeader>
              <CardTitle>{t("comparePage.visualTitle")}</CardTitle>
              <CardDescription>{t("comparePage.visualDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="relative aspect-[21/9] w-full overflow-hidden rounded-[28px] border border-white/70 bg-slate-100 select-none touch-none"
              >
                <div className="absolute inset-0">
                  {snapshotB?.url && failedDateB !== resolvedDateB ? (
                    <img
                      src={snapshotB.url}
                      alt={`Snapshot B - ${resolvedDateB}`}
                      className="h-full w-full object-cover pointer-events-none"
                      draggable={false}
                      onError={() => setFailedDateB(resolvedDateB)}
                    />
                  ) : (
                    placeholder(`Snapshot B - ${resolvedDateB}`)
                  )}
                </div>

                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                  {snapshotA?.url && failedDateA !== resolvedDateA ? (
                    <img
                      src={snapshotA.url}
                      alt={`Snapshot A - ${resolvedDateA}`}
                      className="h-full w-full object-cover pointer-events-none"
                      draggable={false}
                      onError={() => setFailedDateA(resolvedDateA)}
                    />
                  ) : (
                    placeholder(`Snapshot A - ${resolvedDateA}`)
                  )}
                </div>

                <div className="absolute left-4 top-4 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-white">
                  {t("comparePage.snapshotA")}: {resolvedDateA}
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-white">
                  {t("comparePage.snapshotB")}: {resolvedDateB}
                </div>

                <div
                  className="absolute bottom-0 top-0 w-0.5 bg-white/95 shadow-[0_0_18px_rgba(15,23,42,0.25)] pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="flex h-11 w-7 items-center justify-center rounded-full bg-white shadow-[0_18px_38px_-20px_rgba(15,23,42,0.4)]">
                    <div className="flex gap-0.5">
                      <div className="h-4 w-0.5 rounded-full bg-slate-400" />
                      <div className="h-4 w-0.5 rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {detectedChanges.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("comparePage.metricChanges")}</CardTitle>
                <CardDescription>{t("comparePage.metricChangesDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {detectedChanges.map((change, index) => (
                    <li key={change} className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5 shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="text-sm text-muted">{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
