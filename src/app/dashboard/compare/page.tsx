"use client";

import { useState, useMemo, useCallback } from "react";
import { useProject } from "@/lib/project-context";
import { getWeeklyMetrics } from "@/lib/mock-data";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ComparePage() {
  const { currentProject } = useProject();
  const weekly = getWeeklyMetrics(currentProject.id);

  const weekOptions = useMemo(
    () =>
      weekly.map((w) => ({
        value: w.weekStart,
        label: `Week of ${w.weekStart}`,
      })),
    [weekly]
  );

  const [weekA, setWeekA] = useState(weekly[weekly.length - 2]?.weekStart ?? weekly[0].weekStart);
  const [weekB, setWeekB] = useState(weekly[weekly.length - 1]?.weekStart ?? weekly[0].weekStart);
  const [sliderPos, setSliderPos] = useState(50);

  const metricsA = weekly.find((w) => w.weekStart === weekA);
  const metricsB = weekly.find((w) => w.weekStart === weekB);

  const detectedChanges = useMemo(() => {
    if (!metricsA || !metricsB) return [];
    const delta = metricsB.progressDelta - metricsA.progressDelta;
    return [
      `Progress delta changed from ${metricsA.progressDelta}% to ${metricsB.progressDelta}% (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%)`,
      `Activity index ${metricsB.activityIndex > metricsA.activityIndex ? "increased" : "decreased"} from ${metricsA.activityIndex.toFixed(0)} to ${metricsB.activityIndex.toFixed(0)}`,
      `Active hours went from ${metricsA.activeHours}h to ${metricsB.activeHours}h`,
      metricsB.riskLevel !== metricsA.riskLevel
        ? `Risk level changed from ${metricsA.riskLevel} to ${metricsB.riskLevel}`
        : `Risk level remained ${metricsB.riskLevel}`,
      "East facade: new cladding panels visible in snapshot B",
      "Crane position shifted ~15m south between snapshots",
    ];
  }, [metricsA, metricsB]);

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPos(Number(e.target.value));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Compare Snapshots</h1>

      <div className="flex flex-wrap items-end gap-4">
        <Select
          id="week-a"
          label="Snapshot A"
          options={weekOptions}
          value={weekA}
          onChange={(e) => setWeekA(e.target.value)}
        />
        <Select
          id="week-b"
          label="Snapshot B"
          options={weekOptions}
          value={weekB}
          onChange={(e) => setWeekB(e.target.value)}
        />
      </div>

      {/* Before/After slider */}
      <Card>
        <CardTitle>Visual Comparison</CardTitle>
        <CardContent className="mt-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-accent/30">
            {/* "Before" side */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-zinc-100"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <div className="text-center">
                <div className="mb-2 text-xs font-medium text-muted">Snapshot A</div>
                <div className="text-sm text-muted">{weekA}</div>
                <div className="mt-4 h-20 w-32 rounded bg-zinc-200" />
              </div>
            </div>
            {/* "After" side */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
              <div className="text-center">
                <div className="mb-2 text-xs font-medium text-muted">Snapshot B</div>
                <div className="text-sm text-muted">{weekB}</div>
                <div className="mt-4 h-20 w-32 rounded bg-zinc-300" />
              </div>
            </div>
            {/* Overlay again for correct stacking */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-zinc-100"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <div className="text-center">
                <div className="mb-2 text-xs font-medium text-muted">Snapshot A</div>
                <div className="text-sm text-muted">{weekA}</div>
                <div className="mt-4 h-20 w-32 rounded bg-zinc-200" />
              </div>
            </div>
            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary"
              style={{ left: `${sliderPos}%` }}
            />
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
      <Card>
        <CardTitle>Detected Changes</CardTitle>
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
    </div>
  );
}
