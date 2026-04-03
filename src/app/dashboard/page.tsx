"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProject } from "@/lib/project-context";
import { useLanguage } from "@/lib/language-context";
import { fetchWeeklyMetrics, fetchAlerts, fetchPlan } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Clock,
  ShieldAlert,
  MapPin,
  Camera,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

export default function OverviewPage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();

  const { data: weekly, loading: loadingW } = useApi(
    () => fetchWeeklyMetrics(currentProject.id, 26),
    [currentProject.id],
  );
  const { data: alerts, loading: loadingA } = useApi(
    () => fetchAlerts(currentProject.id),
    [currentProject.id],
  );
  const { data: planData } = useApi(
    () => fetchPlan(currentProject.id),
    [currentProject.id],
  );

  const scheduleAlerts = useMemo(
    () => (alerts ?? []).filter((a) => a.type === "schedule" && a.status === "open"),
    [alerts],
  );

  const planStats = useMemo(() => {
    const milestones = planData?.milestones ?? [];
    if (!milestones.length) return null;
    return {
      total: milestones.length,
      completed: milestones.filter((m) => m.status === "completed").length,
      delayed: milestones.filter((m) => m.status === "delayed").length,
      onTrack: milestones.filter((m) => m.status === "on_track").length,
    };
  }, [planData]);

  if (loadingW || loadingA || !weekly || !alerts) {
    return <div className="py-12 text-center text-muted">{t("common.loading")}</div>;
  }

  const latest = weekly[weekly.length - 1];
  if (!latest) {
    return (
      <div className="py-12 text-center text-muted">
        {t("overview.noMetrics")}
      </div>
    );
  }

  const chartData = weekly.slice(-12);
  const localizedRiskLevel =
    latest.riskLevel === "Low"
      ? t("overview.riskLow")
      : latest.riskLevel === "Medium"
        ? t("overview.riskMedium")
        : t("overview.riskHigh");

  const kpis = [
    {
      id: "weekly",
      label: t("overview.kpiWeeklyProgress"),
      value: `${latest.progressDelta}%`,
      icon: TrendingUp,
      trend: t("overview.trendPrev"),
    },
    {
      id: "activity",
      label: t("overview.kpiActivityIndex"),
      value: latest.activityIndex.toFixed(0),
      icon: Activity,
      trend: t("overview.trendAboveAvg"),
    },
    {
      id: "hours",
      label: t("overview.kpiActiveHours"),
      value: `${latest.activeHours}h`,
      icon: Clock,
      trend: t("overview.trendOnTrack"),
    },
    {
      id: "risk",
      label: t("overview.kpiDelayRisk"),
      value: localizedRiskLevel,
      icon: ShieldAlert,
      trend:
        latest.riskLevel === "Low"
          ? t("overview.trendNoConcerns")
          : latest.riskLevel === "Medium"
            ? t("overview.trendMonitorClosely")
            : t("overview.trendActionNeeded"),
    },
  ];

  const riskVariant =
    latest.riskLevel === "Low"
      ? "low"
      : latest.riskLevel === "Medium"
        ? "medium"
        : ("high" as const);

  const summaryProgress = t("overview.summaryProgress", { value: latest.progressDelta });
  const summaryProgressValue = `${latest.progressDelta}%`;
  const [summaryProgressBefore = "", summaryProgressAfter = ""] =
    summaryProgress.split(summaryProgressValue);

  const summaryActivityValue = latest.activityIndex.toFixed(0);
  const summaryActivity = t("overview.summaryActivity", { value: summaryActivityValue });
  const [summaryActivityBefore = "", summaryActivityAfter = ""] =
    summaryActivity.split(summaryActivityValue);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{currentProject.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {currentProject.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" />
            {t("overview.cameraCoverage", {
              count: currentProject.cameraCount,
              coverage: currentProject.coveragePercent,
            })}
          </span>
          <span>
            {t("overview.lastSnapshot", {
              date: formatDateTime(currentProject.lastSnapshotAt),
            })}
          </span>
        </div>
      </div>

      {scheduleAlerts.length > 0 && (
        <Link
          href="/dashboard/alerts"
          className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 transition-colors hover:bg-orange-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-orange-900">
              {t("overview.scheduleDelaysDetected", {
                count: scheduleAlerts.length,
                label:
                  scheduleAlerts.length === 1
                    ? t("overview.delaySingular")
                    : t("overview.delayPlural"),
              })}
            </p>
            <p className="mt-0.5 text-xs text-orange-700">
              {scheduleAlerts[0].summary}
              {scheduleAlerts.length > 1 &&
                ` ${t("common.andMore", { count: scheduleAlerts.length - 1 })}`}
            </p>
          </div>
          <Badge variant="high" className="shrink-0">{t("common.view")}</Badge>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
              <kpi.icon className="h-4 w-4 text-muted" />
            </div>
            <div>
              <p className="text-xs text-muted">{kpi.label}</p>
              <p className="text-lg font-semibold leading-tight">
                {kpi.id === "risk" ? (
                  <Badge variant={riskVariant}>{kpi.value}</Badge>
                ) : (
                  kpi.value
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted">{kpi.trend}</p>
            </div>
          </Card>
        ))}

        <Card className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <ClipboardList className="h-4 w-4 text-muted" />
          </div>
          <div>
            <p className="text-xs text-muted">{t("overview.planStatus")}</p>
            {planStats ? (
              <>
                <p className="text-lg font-semibold leading-tight">
                  {planStats.completed}/{planStats.total}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {planStats.delayed > 0
                    ? t("overview.planDelayed", { count: planStats.delayed })
                    : t("overview.planOnSchedule")}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted">{t("overview.noPlan")}</p>
                <Link
                  href="/dashboard/plan"
                  className="mt-0.5 text-xs text-primary hover:underline"
                >
                  {t("overview.uploadPlan")}
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>{t("overview.progressDeltaChart")}</CardTitle>
          <CardContent className="mt-4">
            <ChartWrapper>
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
                  formatter={(value) => [`${value}%`, t("overview.tooltipProgressDelta")]}
                  labelFormatter={(label) => t("overview.tooltipWeekOf", { label })}
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

        <Card>
          <CardTitle>{t("overview.activityIndexChart")}</CardTitle>
          <CardContent className="mt-4">
            <ChartWrapper>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="weekStart"
                  tickFormatter={(v) => String(v).slice(5)}
                  tick={{ fontSize: 11 }}
                  stroke="#a1a1aa"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
                  formatter={(value) => [Number(value).toFixed(1), t("overview.tooltipActivityIndex")]}
                  labelFormatter={(label) => t("overview.tooltipWeekOf", { label })}
                />
                <Area
                  type="monotone"
                  dataKey="activityIndex"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.08}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartWrapper>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>{t("overview.summaryTitle")}</CardTitle>
          <CardContent className="mt-3 space-y-2 text-sm text-muted">
            <p>
              {summaryProgressBefore}
              <strong className="text-foreground">{summaryProgressValue}</strong>
              {summaryProgressAfter}
            </p>
            <p>
              {summaryActivityBefore}
              <strong className="text-foreground">{summaryActivityValue}</strong>
              {summaryActivityAfter}
            </p>
            <p>
              {t("overview.summaryActiveHours", {
                hours: latest.activeHours,
                count: currentProject.cameraCount,
              })}
            </p>
            <p>
              {t("overview.summaryDelayRisk")}{" "}
              <Badge variant={riskVariant} className="ml-1">
                {localizedRiskLevel}
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>{t("overview.recentFlagsTitle")}</CardTitle>
          <CardContent className="mt-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted">{t("overview.noRecentFlags")}</p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3">
                    <Badge variant={alert.severity}>{alert.severity}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{alert.summary}</p>
                      <p className="text-xs text-muted">{timeAgo(alert.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
