"use client";

import { useState, useMemo } from "react";
import { useProject } from "@/lib/project-context";
import { getWeeklyMetrics } from "@/lib/mock-data";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { Timeframe } from "@/lib/types";

const timeframeWeeks: Record<Timeframe, number> = { "4w": 4, "12w": 12, "26w": 26 };

export default function ProgressPage() {
  const { currentProject } = useProject();
  const weekly = getWeeklyMetrics(currentProject.id);

  const [timeframe, setTimeframe] = useState<Timeframe>("12w");
  const [workingHoursOnly, setWorkingHoursOnly] = useState(true);
  const [weatherNorm, setWeatherNorm] = useState(false);

  const chartData = useMemo(() => {
    const weeks = timeframeWeeks[timeframe];
    return weekly.slice(-weeks);
  }, [weekly, timeframe]);

  const avg =
    chartData.reduce((sum, w) => sum + w.progressDelta, 0) / chartData.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Progress</h1>

        <div className="flex flex-wrap items-center gap-4">
          <Tabs defaultValue={timeframe}>
            <TabsList>
              {(["4w", "12w", "26w"] as Timeframe[]).map((tf) => (
                <TabsTrigger
                  key={tf}
                  value={tf}
                  className={timeframe === tf ? "" : ""}
                >
                  <button onClick={() => setTimeframe(tf)} className="cursor-pointer">
                    {tf}
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Toggle
            label="Working hours"
            checked={workingHoursOnly}
            onChange={setWorkingHoursOnly}
          />
          <Toggle
            label="Weather norm."
            checked={weatherNorm}
            onChange={setWeatherNorm}
          />
        </div>
      </div>

      {/* Main chart */}
      <Card>
        <CardTitle>Weekly Progress Delta</CardTitle>
        <CardContent className="mt-4">
          <ChartWrapper height={340}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="weekStart"
                tickFormatter={(v) => String(v).slice(5)}
                tick={{ fontSize: 11 }}
                stroke="#a1a1aa"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#a1a1aa"
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
                formatter={(value) => [`${value}%`, "Progress Delta"]}
                labelFormatter={(label) => `Week of ${label}`}
              />
              <ReferenceLine
                y={Math.round(avg * 10) / 10}
                stroke="#a1a1aa"
                strokeDasharray="4 4"
                label={{ value: `Avg ${avg.toFixed(1)}%`, position: "right", fontSize: 11, fill: "#71717a" }}
              />
              <Area
                type="monotone"
                dataKey="progressDelta"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.08}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartWrapper>
        </CardContent>
      </Card>

      {/* Heatmap preview */}
      <Card>
        <CardTitle>Change Heatmap</CardTitle>
        <CardContent className="mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {["Previous Week", "Current Week", "Change Overlay"].map((label) => (
              <div key={label}>
                <p className="mb-2 text-xs font-medium text-muted">{label}</p>
                <div className="flex aspect-video items-center justify-center rounded-lg border bg-accent/50 text-xs text-muted">
                  {label === "Change Overlay" ? (
                    <div className="text-center">
                      <div className="mx-auto mb-1 h-8 w-8 rounded-full bg-primary/20" />
                      <span>Diff visualization</span>
                    </div>
                  ) : (
                    <span>Snapshot placeholder</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card>
        <CardTitle>How Progress Is Calculated</CardTitle>
        <CardContent className="mt-3 space-y-2 text-sm text-muted">
          <p>
            SitePulse uses <strong className="text-foreground">structural similarity (SSIM)</strong> and pixel-level
            change detection between consecutive weekly snapshots to estimate construction progress.
          </p>
          <p>
            Regions of significant change are identified, filtered for weather/lighting variations,
            and aggregated into a single <strong className="text-foreground">progress delta</strong> metric
            representing the percentage of visible structural change.
          </p>
          <p>
            When &quot;Weather normalization&quot; is enabled, the algorithm compensates for known
            weather events using historical correlation data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
