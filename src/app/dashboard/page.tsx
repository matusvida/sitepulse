"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProject } from "@/lib/project-context";
import { ACTIVITY_STATUS, type ActivityStatus, WEATHER_STATUS, type WeatherStatus } from "@/lib/activity";
import { useLanguage } from "@/lib/language-context";
import { fetchActivitySummary, fetchAlerts, fetchDailyMetrics, fetchPlan, fetchReports, fetchWeeklyMetrics } from "@/lib/api";
import {
  getConfidenceLabel,
  getConfidenceVariant,
  getReportHeadline,
  getReportPeriodLabel,
  groupReportsByType,
} from "@/lib/report-utils";
import { useApi } from "@/lib/use-api";
import { AsyncState } from "@/components/ui/async-state";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Camera,
  ChevronRight,
  CloudRain,
  Clock,
  FileText,
  HelpCircle,
  MapPin,
  ShieldAlert,
  Truck,
} from "lucide-react";

export default function OverviewPage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();

  const { data: weekly, loading: loadingWeekly, error: weeklyError, refetch: refetchWeekly } = useApi(
    () => fetchWeeklyMetrics(currentProject.id, 26),
    [currentProject.id],
  );
  const { data: alerts, loading: loadingAlerts } = useApi(
    () => fetchAlerts(currentProject.id),
    [currentProject.id],
  );
  const { data: activitySummary, loading: loadingActivitySummary, error: activityError } = useApi(
    () => fetchActivitySummary(currentProject.id, 28),
    [currentProject.id],
  );
  const { data: dailyMetrics } = useApi(
    () => fetchDailyMetrics(currentProject.id, 14),
    [currentProject.id],
  );
  const { data: planData } = useApi(
    () => fetchPlan(currentProject.id),
    [currentProject.id],
  );
  const { data: reports } = useApi(
    () => fetchReports(currentProject.id),
    [currentProject.id],
  );

  const scheduleAlerts = useMemo(
    () => (alerts ?? []).filter((alert) => alert.type === "schedule" && alert.status === "open"),
    [alerts],
  );
  const groupedReports = useMemo(() => groupReportsByType(reports), [reports]);
  const latestDailyReport = groupedReports.daily[0] ?? null;
  const latestWeeklyReport = groupedReports.weekly[0] ?? null;
  const recentDaily = (dailyMetrics ?? []).slice(-7).reverse();

  const planStats = useMemo(() => {
    const milestones = planData?.milestones ?? [];
    if (milestones.length === 0) return null;

    return {
      total: milestones.length,
      completed: milestones.filter((milestone) => milestone.status === "completed").length,
      delayed: milestones.filter((milestone) => milestone.status === "delayed").length,
    };
  }, [planData]);

  if (loadingWeekly || loadingAlerts || loadingActivitySummary || !weekly || !alerts || !activitySummary) {
    if (weeklyError || activityError) {
      return (
        <AsyncState
          type="error"
          title={t("overview.errorTitle")}
          description={weeklyError ?? activityError ?? undefined}
          actionLabel={t("common.retry")}
          onAction={refetchWeekly}
        />
      );
    }

    return (
      <AsyncState
        type="loading"
        title={t("common.loading")}
        description={t("overview.heroDescription")}
      />
    );
  }

  const latest = weekly[weekly.length - 1];
  if (!latest) {
    return <AsyncState type="empty" title={t("overview.noMetrics")} />;
  }

  const chartData = weekly.slice(-12);
  const riskLabel =
    latest.riskLevel === "Low"
      ? t("overview.riskLow")
      : latest.riskLevel === "Medium"
        ? t("overview.riskMedium")
        : t("overview.riskHigh");
  const riskVariant =
    latest.riskLevel === "Low"
      ? "low"
      : latest.riskLevel === "Medium"
        ? "medium"
        : ("high" as const);

  const metrics = [
    {
      key: "weekly",
      icon: ArrowUpRight,
      label: t("overview.kpiWeeklyProgress"),
      value: `${latest.progressDelta}%`,
      note: t("overview.kpiWeeklyProgressNote"),
      tone: "bg-blue-100 text-blue-700",
    },
    {
      key: "activity",
      icon: Activity,
      label: t("overview.kpiActivityIndex"),
      value: latest.activityIndex.toFixed(0),
      note: t("overview.kpiActivityIndexNote"),
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "hours",
      icon: Clock,
      label: t("overview.kpiActiveHours"),
      value: `${latest.activeHours}h`,
      note: t("overview.kpiActiveHoursNote"),
      tone: "bg-indigo-100 text-indigo-700",
    },
    {
      key: "risk",
      icon: ShieldAlert,
      label: t("overview.kpiDelayRisk"),
      value: riskLabel,
      note:
        latest.riskLevel === "Low"
          ? t("overview.trendNoConcerns")
          : latest.riskLevel === "Medium"
            ? t("overview.trendMonitorClosely")
            : t("overview.trendActionNeeded"),
      tone: "bg-amber-100 text-amber-700",
    },
  ];

  const progressSummary = t("overview.summaryProgress", { value: latest.progressDelta });
  const progressValue = `${latest.progressDelta}%`;
  const [progressBefore = "", progressAfter = ""] = progressSummary.split(progressValue);

  const activityValue = latest.activityIndex.toFixed(0);
  const activitySummaryText = t("overview.summaryActivity", { value: activityValue });
  const [activityBefore = "", activityAfter = ""] = activitySummaryText.split(activityValue);
  const planCoverageValue = planStats ? `${planStats.completed}/${planStats.total}` : "0/0";
  const activityBreakdown = [
    {
      key: "active",
      icon: Truck,
      label: t("overview.kpiActiveDays"),
      value: activitySummary.activeDays,
      note: t("overview.kpiActiveDaysNote", { count: activitySummary.totalDays }),
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "inactive",
      icon: Clock,
      label: t("overview.kpiInactiveDays"),
      value: activitySummary.inactiveDays,
      note: t("overview.kpiInactiveDaysNote"),
      tone: "bg-slate-100 text-slate-700",
    },
    {
      key: "unknown",
      icon: HelpCircle,
      label: t("overview.kpiUnknownDays"),
      value: activitySummary.unknownDays,
      note: t("overview.kpiUnknownDaysNote"),
      tone: "bg-amber-50 text-amber-700",
    },
    {
      key: "weather",
      icon: CloudRain,
      label: t("overview.kpiWeatherImpactedDays"),
      value: activitySummary.weatherImpactedDays,
      note: t("overview.kpiWeatherImpactedDaysNote", {
        rain: activitySummary.rainDays,
        snow: activitySummary.snowDays,
      }),
      tone: "bg-sky-50 text-sky-700",
    },
  ];

  const formatActivityLabel = (status: ActivityStatus) => {
    if (status === ACTIVITY_STATUS.ACTIVE) return t("overview.activityStatusActive");
    if (status === ACTIVITY_STATUS.INACTIVE) return t("overview.activityStatusInactive");
    return t("overview.activityStatusUnknown");
  };

  const formatWeatherLabel = (status: WeatherStatus) => {
    if (status === WEATHER_STATUS.RAIN) return t("overview.weatherStatusRain");
    if (status === WEATHER_STATUS.SNOW) return t("overview.weatherStatusSnow");
    if (status === WEATHER_STATUS.UNCLEAR) return t("overview.weatherStatusUnclear");
    return t("overview.weatherStatusNormal");
  };

  const activityBadgeVariant = (status: ActivityStatus) => {
    if (status === ACTIVITY_STATUS.ACTIVE) return "low" as const;
    if (status === ACTIVITY_STATUS.INACTIVE) return "outline" as const;
    return "medium" as const;
  };

  const renderNarrativeCard = (
    title: string,
    description: string,
    emptyTitle: string,
    emptyDescription: string,
    report: NonNullable<typeof latestDailyReport>,
  ) => {
    const confidenceLabel = getConfidenceLabel(report, t);
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[24px] border border-white/80 bg-white/78 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{getReportPeriodLabel(report, t)}</Badge>
              {confidenceLabel ? (
                <Badge variant={getConfidenceVariant(report)}>{confidenceLabel}</Badge>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {getReportHeadline(report, t)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {report.summary || t("reportsPage.fallbackSummary")}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted">
                {report.createdAt
                  ? t("overview.generatedAt", { date: formatDateTime(report.createdAt) })
                  : emptyTitle}
              </p>
              <Link
                href="/dashboard/reports"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {t("overview.openReport")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderNarrativeEmptyState = (title: string, description: string) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-dashed border-white/80 bg-accent/50 p-5 text-sm text-muted">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <div>
              <p className="font-medium text-foreground">{t("overview.noNarrativeTitle")}</p>
              <p className="mt-1 leading-6">{t("overview.noNarrativeDescription")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(237,243,251,0.88))]">
        <CardContent className="grid gap-0 p-0 lg:grid-cols-[1.18fr_0.82fr] xl:grid-cols-[1.25fr_0.75fr]">
          <div className="p-4 sm:p-5 xl:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t("overview.heroEyebrow")}
            </p>
            <div className="mt-2.5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between xl:mt-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-[1.7rem] xl:text-2xl xl:sm:text-[1.9rem]">
                  {currentProject.name}
                </h1>
                <p className="mt-1.5 max-w-xl text-sm leading-5 text-muted xl:mt-2 xl:leading-6">
                  {t("overview.heroDescription")}
                </p>
              </div>
              <div className="rounded-[18px] bg-slate-950 px-3.5 py-2.5 text-white shadow-[0_20px_42px_-26px_rgba(15,23,42,0.65)] xl:rounded-[22px] xl:px-4 xl:py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                  {t("overview.latestObservedWeek")}
                </p>
                <p className="mt-1 text-xl font-semibold tracking-tight xl:text-2xl">{latest.progressDelta}%</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted xl:mt-5 xl:gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 text-xs shadow-sm xl:gap-2 xl:px-3 xl:text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                {currentProject.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 text-xs shadow-sm xl:gap-2 xl:px-3 xl:text-sm">
                <Camera className="h-4 w-4 text-primary" />
                {t("overview.cameraCoverage", {
                  count: currentProject.cameraCount,
                  coverage: currentProject.coveragePercent,
                })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 text-xs shadow-sm xl:gap-2 xl:px-3 xl:text-sm">
                <Clock className="h-4 w-4 text-primary" />
                {t("overview.lastSnapshot", {
                  date: formatDateTime(currentProject.lastSnapshotAt),
                })}
              </span>
            </div>
          </div>

          <div className="grid gap-2.5 border-t border-white/70 bg-white/55 p-4 sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0 xl:gap-3 xl:p-5">
            <div className="rounded-[18px] border border-white/80 bg-white/88 p-3 shadow-sm xl:rounded-[22px] xl:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {t("overview.openScheduleAlerts")}
              </p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight xl:mt-2 xl:text-2xl">{scheduleAlerts.length}</p>
              <p className="mt-1 text-xs leading-4 text-muted xl:leading-5">{t("overview.reviewAlertsDescription")}</p>
            </div>
            <div className="rounded-[18px] border border-white/80 bg-white/88 p-3 shadow-sm xl:rounded-[22px] xl:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {t("overview.planCoverage")}
              </p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight xl:mt-2 xl:text-2xl">{planCoverageValue}</p>
              <p className="mt-1 text-xs leading-4 text-muted xl:leading-5">
                {planStats
                  ? t("overview.planCoverageDescription", { count: planStats.delayed })
                  : t("overview.noPlan")}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/80 bg-white/88 p-3 shadow-sm xl:rounded-[22px] xl:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {t("overview.summaryTitle")}
              </p>
              <p className="mt-1.5 text-[13px] leading-4.5 text-muted xl:mt-2 xl:text-sm xl:leading-6">
                {progressBefore}
                <strong className="text-foreground">{progressValue}</strong>
                {progressAfter}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {scheduleAlerts.length > 0 ? (
        <Link
          href="/dashboard/alerts"
          className="flex items-start gap-3 rounded-[24px] border border-orange-200 bg-orange-50/90 px-5 py-4 transition-colors hover:bg-orange-100"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-orange-900">
              {t("overview.scheduleDelaysDetected", {
                count: scheduleAlerts.length,
                label:
                  scheduleAlerts.length === 1
                    ? t("overview.delaySingular")
                    : t("overview.delayPlural"),
              })}
            </p>
            <p className="mt-1 text-sm text-orange-700">
              {scheduleAlerts[0].summary}
              {scheduleAlerts.length > 1
                ? ` ${t("common.andMore", { count: scheduleAlerts.length - 1 })}`
                : ""}
            </p>
          </div>
          <Badge variant="high" className="shrink-0">
            {t("common.view")}
          </Badge>
        </Link>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.key} className="p-5">
            <div className="flex items-start gap-4">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.tone}`}>
                <metric.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted">{metric.label}</p>
                <div className="mt-2 text-2xl font-semibold tracking-tight">
                  {metric.key === "risk" ? (
                    <Badge variant={riskVariant} className="text-sm">
                      {metric.value}
                    </Badge>
                  ) : (
                    metric.value
                  )}
                </div>
                <p className="mt-2 text-sm text-muted">{metric.note}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {activityBreakdown.map((metric) => (
          <Card key={metric.key} className="p-5">
            <div className="flex items-start gap-4">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.tone}`}>
                <metric.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted">{metric.label}</p>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</div>
                <p className="mt-2 text-sm text-muted">{metric.note}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {latestDailyReport
          ? renderNarrativeCard(
              t("overview.latestDailyBriefingTitle"),
              t("overview.latestDailyBriefingDescription"),
              t("overview.noNarrativeTitle"),
              t("overview.noNarrativeDescription"),
              latestDailyReport,
            )
          : renderNarrativeEmptyState(
              t("overview.latestDailyBriefingTitle"),
              t("overview.latestDailyBriefingDescription"),
            )}
        {latestWeeklyReport
          ? renderNarrativeCard(
              t("overview.latestWeeklyInsightTitle"),
              t("overview.latestWeeklyInsightDescription"),
              t("overview.noNarrativeTitle"),
              t("overview.noNarrativeDescription"),
              latestWeeklyReport,
            )
          : renderNarrativeEmptyState(
              t("overview.latestWeeklyInsightTitle"),
              t("overview.latestWeeklyInsightDescription"),
            )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("overview.progressDeltaChart")}</CardTitle>
            <CardDescription>{t("overview.last12Weeks")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper height={320}>
              <AreaChart data={chartData}>
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
                  contentStyle={{ fontSize: 12, borderRadius: 16, border: "1px solid #d5dfec" }}
                  formatter={(value) => [`${value}%`, t("overview.tooltipProgressDelta")]}
                  labelFormatter={(label) => t("overview.tooltipWeekOf", { label })}
                />
                <Area
                  type="monotone"
                  dataKey="progressDelta"
                  stroke="#1d5fd1"
                  fill="#1d5fd1"
                  fillOpacity={0.1}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ChartWrapper>
            <div className="mt-4 rounded-[20px] bg-accent/60 p-4 text-sm text-muted">
              <p className="font-medium text-foreground">{t("overview.chartInterpretationTitle")}</p>
              <p className="mt-2">{t("overview.chartInterpretationBody")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("overview.operationsTitle")}</CardTitle>
            <CardDescription>{t("overview.operationsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] bg-accent/70 p-4 text-sm text-muted">
              <p>
                {progressBefore}
                <strong className="text-foreground">{progressValue}</strong>
                {progressAfter}
              </p>
              <p className="mt-3">
                {activityBefore}
                <strong className="text-foreground">{activityValue}</strong>
                {activityAfter}
              </p>
              <p className="mt-3">
                {t("overview.summaryActiveHours", {
                  hours: latest.activeHours,
                  count: currentProject.cameraCount,
                })}
              </p>
              <p className="mt-3">
                {t("overview.summaryDelayRisk")}{" "}
                <Badge variant={riskVariant}>{riskLabel}</Badge>
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/dashboard/alerts"
                className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4 text-sm font-medium text-foreground transition-colors hover:bg-white"
              >
                <p>{t("overview.reviewAlerts")}</p>
                <p className="mt-1 text-xs text-muted">{t("overview.reviewAlertsDescription")}</p>
              </Link>
              <Link
                href="/dashboard/plan"
                className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4 text-sm font-medium text-foreground transition-colors hover:bg-white"
              >
                <p>{t("overview.uploadPlan")}</p>
                <p className="mt-1 text-xs text-muted">
                  {planStats ? t("overview.planStatus") : t("overview.noPlan")}
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("overview.dailyActivityTitle")}</CardTitle>
            <CardDescription>{t("overview.dailyActivityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDaily.length === 0 ? (
              <div className="rounded-[24px] bg-accent/60 p-5 text-sm text-muted">
                {t("overview.noDailyActivity")}
              </div>
            ) : (
              <div className="space-y-3">
                {recentDaily.map((day) => (
                  <div
                    key={day.date}
                    className="flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{day.date}</p>
                      <p className="mt-1 text-sm text-muted">
                        {day.summaryNote || t("overview.noDailyActivityNote")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={activityBadgeVariant(day.activityStatus)}>
                        {formatActivityLabel(day.activityStatus)}
                      </Badge>
                      <Badge variant={day.weatherImpacted ? "medium" : "outline"}>
                        {formatWeatherLabel(day.weatherStatus)}
                      </Badge>
                      {day.weatherImpacted ? (
                        <Badge variant="medium">{t("overview.weatherImpactedBadge")}</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("overview.recentFlagsTitle")}</CardTitle>
            <CardDescription>{t("overview.recentFlagsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="rounded-[24px] bg-accent/60 p-5 text-sm text-muted">
                {t("overview.noRecentFlags")}
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-[24px] border border-white/80 bg-white/78 px-4 py-4"
                  >
                    <Badge variant={alert.severity}>{alert.severity}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{alert.summary}</p>
                      <p className="mt-1 text-sm text-muted">{alert.details}</p>
                    </div>
                    <p className="shrink-0 text-xs text-muted">{timeAgo(alert.createdAt)}</p>
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
