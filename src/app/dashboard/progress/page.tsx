"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/lib/project-context";
import { fetchWeeklyMetrics } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { AsyncState } from "@/components/ui/async-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowUpRight, Gauge, ShieldAlert } from "lucide-react";
import type { Timeframe } from "@/lib/types";

const timeframeWeeks: Record<Timeframe, number> = { "4w": 4, "12w": 12, "26w": 26 };

export default function ProgressPage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();
  const { data: weekly, loading, error, refetch } = useApi(
    () => fetchWeeklyMetrics(currentProject.id, 26),
    [currentProject.id],
  );
  const [timeframe, setTimeframe] = useState<Timeframe>("12w");

  const chartData = useMemo(() => {
    if (!weekly) return [];
    return weekly.slice(-timeframeWeeks[timeframe]);
  }, [weekly, timeframe]);

  const summary = useMemo(() => {
    if (chartData.length === 0) return null;

    const progressValues = chartData.map((entry) => entry.progressDelta);
    const activeHours = chartData.map((entry) => entry.activeHours);
    const latest = chartData[chartData.length - 1];
    const averageDelta = progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length;
    const bestWeek = Math.max(...progressValues);
    const averageHours = activeHours.reduce((sum, value) => sum + value, 0) / activeHours.length;

    return {
      latest,
      averageDelta,
      bestWeek,
      averageHours,
    };
  }, [chartData]);

  if (loading || !weekly) {
    if (error && !weekly) {
      return (
        <AsyncState
          type="error"
          title="Unable to load progress metrics"
          description={error}
          actionLabel="Retry"
          onAction={refetch}
        />
      );
    }

    return (
      <AsyncState
        type="loading"
        title={t("common.loading")}
        description={t("progressPage.description")}
      />
    );
  }

  const averageLine = summary ? Math.round(summary.averageDelta * 10) / 10 : 0;
  const localizedRiskLevel =
    summary?.latest.riskLevel === "Low"
      ? t("overview.riskLow")
      : summary?.latest.riskLevel === "Medium"
        ? t("overview.riskMedium")
        : t("overview.riskHigh");
  const riskTone =
    summary?.latest.riskLevel === "High"
      ? "text-red-600"
      : summary?.latest.riskLevel === "Medium"
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("progressPage.title")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {t("progressPage.description")}
          </p>
        </div>
        <Tabs defaultValue={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}>
          <TabsList>
            {(["4w", "12w", "26w"] as Timeframe[]).map((value) => (
              <TabsTrigger key={value} value={value}>
                {value}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <ArrowUpRight className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-muted">{t("progressPage.averageWeeklyDelta")}</p>
                <p className="text-2xl font-semibold tracking-tight">{summary.averageDelta.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Gauge className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-muted">{t("progressPage.bestObservedWeek")}</p>
                <p className="text-2xl font-semibold tracking-tight">{summary.bestWeek.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-muted">{t("progressPage.averageActiveHours")}</p>
                <p className="text-2xl font-semibold tracking-tight">{summary.averageHours.toFixed(0)}h</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-muted">{t("progressPage.currentRiskLevel")}</p>
                <p className={`text-2xl font-semibold tracking-tight ${riskTone}`}>{localizedRiskLevel}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("progressPage.weeklyProgressDelta")}</CardTitle>
            <CardDescription>{t("progressPage.weeklyDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper height={360}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d5fd1" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#1d5fd1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dfec" />
                <XAxis
                  dataKey="weekStart"
                  tickFormatter={(value) => String(value).slice(5)}
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 16,
                    border: "1px solid #d5dfec",
                    boxShadow: "0 18px 42px -30px rgba(15, 23, 42, 0.45)",
                  }}
                  formatter={(value) => [`${value}%`, t("progressPage.tooltipProgressDelta")]}
                  labelFormatter={(label) => t("progressPage.tooltipWeekOf", { label: String(label) })}
                />
                <ReferenceLine
                  y={averageLine}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  label={{ value: t("progressPage.averageLabel", { value: averageLine.toFixed(1) }), position: "right", fontSize: 11, fill: "#64748b" }}
                />
                <Area
                  type="monotone"
                  dataKey="progressDelta"
                  stroke="#1d5fd1"
                  fill="url(#progressFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ChartWrapper>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("progressPage.currentReadout")}</CardTitle>
              <CardDescription>{t("progressPage.currentReadoutDescription")}</CardDescription>
            </CardHeader>
            {summary ? (
              <CardContent className="space-y-4">
                <div className="rounded-[24px] bg-accent/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("progressPage.latestDelta")}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.latest.progressDelta}%</p>
                  <p className="mt-1 text-sm text-muted">{t("progressPage.comparedAgainst", { count: timeframeWeeks[timeframe] })}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-border/70 bg-white/75 p-4">
                    <p className="text-sm font-medium text-foreground">{t("progressPage.activityIndex")}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{summary.latest.activityIndex.toFixed(0)}</p>
                    <p className="mt-1 text-sm text-muted">{t("progressPage.activityIndexDescription")}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-white/75 p-4">
                    <p className="text-sm font-medium text-foreground">{t("progressPage.activeHours")}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{summary.latest.activeHours}h</p>
                    <p className="mt-1 text-sm text-muted">{t("progressPage.activeHoursDescription")}</p>
                  </div>
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("progressPage.howMetricRead")}</CardTitle>
              <CardDescription>
                {t("progressPage.howMetricReadDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <p>{t("progressPage.metricReadBody1")}</p>
              <p>{t("progressPage.metricReadBody2")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
