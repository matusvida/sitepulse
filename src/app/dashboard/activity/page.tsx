"use client";

import { useMemo } from "react";
import { useProject } from "@/lib/project-context";
import { fetchDailyMetrics, fetchWeeklyMetrics, fetchHeatmap } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import type { HeatmapCell } from "@/lib/api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ShieldCheck } from "lucide-react";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6);
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function buildHeatmapGrid(cells: HeatmapCell[]) {
  const lookup = new Map<string, number>();
  for (const c of cells) {
    lookup.set(`${c.dayOfWeek}-${c.hour}`, c.count);
  }
  return DAY_KEYS.map((day, di) => {
    const row: Record<string, number | string> = { day };
    HOURS.forEach((hour) => {
      row[`h${hour}`] = lookup.get(`${di}-${hour}`) ?? 0;
    });
    return row;
  });
}

function intensityClass(value: number): string {
  if (value < 10) return "bg-zinc-100";
  if (value < 25) return "bg-emerald-100";
  if (value < 45) return "bg-emerald-300";
  return "bg-emerald-500";
}

export default function ActivityPage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();

  const { data: daily, loading: loadingD } = useApi(
    () => fetchDailyMetrics(currentProject.id, 28),
    [currentProject.id],
  );
  const { data: weekly, loading: loadingW } = useApi(
    () => fetchWeeklyMetrics(currentProject.id, 26),
    [currentProject.id],
  );
  const { data: heatmapCells } = useApi(
    () => fetchHeatmap(currentProject.id),
    [currentProject.id],
  );

  const heatmap = useMemo(
    () => (heatmapCells && heatmapCells.length > 0 ? buildHeatmapGrid(heatmapCells) : []),
    [heatmapCells],
  );

  if (loadingD || loadingW || !daily || !weekly) {
    return <div className="py-12 text-center text-muted">{t("common.loading")}</div>;
  }

  const latestWeek = weekly[weekly.length - 1];
  const last14 = daily.slice(-14);
  const scorePercent = latestWeek ? Math.min(100, Math.round(latestWeek.activityIndex)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("activityPage.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t("activityPage.description")}</p>
      </div>

      <Card className="flex items-center gap-6">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e4e4e7" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeDasharray={`${scorePercent} ${100 - scorePercent}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-lg font-semibold">{scorePercent}</span>
        </div>
        <div>
          <CardTitle>{t("activityPage.scoreTitle")}</CardTitle>
          <p className="mt-1 text-sm text-muted">{t("activityPage.scoreDescription")}</p>
          <p className="mt-2 text-sm text-muted">{t("activityPage.scoreLimitation")}</p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>{t("activityPage.peopleCountTitle")}</CardTitle>
          <CardContent className="mt-4">
            <ChartWrapper height={240}>
              <LineChart data={last14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }} />
                <Line type="monotone" dataKey="peopleCount" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartWrapper>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>{t("activityPage.vehicleCountTitle")}</CardTitle>
          <CardContent className="mt-4">
            <ChartWrapper height={240}>
              <LineChart data={last14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }} />
                <Line type="monotone" dataKey="vehicleCount" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartWrapper>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardTitle>{t("activityPage.activeHoursTitle")}</CardTitle>
        <CardContent className="mt-4">
          <ChartWrapper height={240}>
            <BarChart data={last14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
              <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" tickFormatter={(v) => `${v}h`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }} formatter={(value) => [`${value}h`, t("activityPage.tooltipActiveHours")]} />
              <Bar dataKey="activeHours" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>{t("activityPage.heatmapTitle")}</CardTitle>
        <CardContent className="mt-4 overflow-x-auto">
          {heatmap.length === 0 ? (
            <div className="rounded-[20px] bg-accent/60 p-4 text-sm text-muted">
              <p className="font-medium text-foreground">{t("activityPage.heatmapUnavailableTitle")}</p>
              <p className="mt-2">{t("activityPage.heatmapUnavailableBody")}</p>
            </div>
          ) : (
            <div className="min-w-[600px]">
              <p className="mb-3 text-sm text-muted">{t("activityPage.heatmapDescription")}</p>
              <div className="mb-1 flex">
                <div className="w-12" />
                {HOURS.map((h) => (
                  <div key={h} className="flex-1 text-center text-[10px] text-muted">
                    {h}:00
                  </div>
                ))}
              </div>
              {heatmap.map((row) => (
                <div key={row.day as string} className="flex items-center">
                  <div className="w-12 text-xs text-muted">{t(`activityPage.days.${row.day as string}`)}</div>
                  {HOURS.map((h) => (
                    <div key={h} className="flex-1 p-0.5">
                      <div
                        className={cn(
                          "h-6 rounded-sm",
                          intensityClass(row[`h${h}`] as number),
                        )}
                        title={t("activityPage.heatmapCellTitle", {
                          day: t(`activityPage.days.${row.day as string}`),
                          hour: `${h}:00`,
                          value: row[`h${h}`] as number,
                        })}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                <span>{t("activityPage.lowLabel")}</span>
                <div className="h-3 w-4 rounded-sm bg-zinc-100" />
                <div className="h-3 w-4 rounded-sm bg-emerald-100" />
                <div className="h-3 w-4 rounded-sm bg-emerald-300" />
                <div className="h-3 w-4 rounded-sm bg-emerald-500" />
                <span>{t("activityPage.highLabel")}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border bg-accent/50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        <p className="text-sm text-muted">
          <strong className="text-foreground">{t("activityPage.privacyTitle")}</strong>{" "}
          {t("activityPage.privacyBody")}
        </p>
      </div>
    </div>
  );
}
