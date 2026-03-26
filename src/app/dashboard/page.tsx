"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProject } from "@/lib/project-context";
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
    return <div className="py-12 text-center text-muted">Loading…</div>;
  }

  const latest = weekly[weekly.length - 1];
  if (!latest) {
    return (
      <div className="py-12 text-center text-muted">
        No metrics data available yet. Run the analysis engine first.
      </div>
    );
  }

  const chartData = weekly.slice(-12);

  const kpis = [
    {
      label: "Weekly Progress",
      value: `${latest.progressDelta}%`,
      icon: TrendingUp,
      trend: "+0.3% vs prev",
    },
    {
      label: "Activity Index",
      value: latest.activityIndex.toFixed(0),
      icon: Activity,
      trend: "Above avg",
    },
    {
      label: "Active Hours (7d)",
      value: `${latest.activeHours}h`,
      icon: Clock,
      trend: "On track",
    },
    {
      label: "Delay Risk",
      value: latest.riskLevel,
      icon: ShieldAlert,
      trend:
        latest.riskLevel === "Low"
          ? "No concerns"
          : latest.riskLevel === "Medium"
            ? "Monitor closely"
            : "Action needed",
    },
  ];

  const riskVariant =
    latest.riskLevel === "Low"
      ? "low"
      : latest.riskLevel === "Medium"
        ? "medium"
        : ("high" as const);

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div>
        <h1 className="text-xl font-semibold">{currentProject.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {currentProject.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" />
            {currentProject.cameraCount} cameras · {currentProject.coveragePercent}% coverage
          </span>
          <span>
            Last snapshot: {formatDateTime(currentProject.lastSnapshotAt)}
          </span>
        </div>
      </div>

      {/* Schedule alert banner */}
      {scheduleAlerts.length > 0 && (
        <Link
          href="/dashboard/alerts"
          className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 transition-colors hover:bg-orange-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-orange-900">
              {scheduleAlerts.length} schedule {scheduleAlerts.length === 1 ? "delay" : "delays"} detected
            </p>
            <p className="mt-0.5 text-xs text-orange-700">
              {scheduleAlerts[0].summary}
              {scheduleAlerts.length > 1 && ` and ${scheduleAlerts.length - 1} more`}
            </p>
          </div>
          <Badge variant="high" className="shrink-0">View</Badge>
        </Link>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
              <kpi.icon className="h-4 w-4 text-muted" />
            </div>
            <div>
              <p className="text-xs text-muted">{kpi.label}</p>
              <p className="text-lg font-semibold leading-tight">
                {kpi.label === "Delay Risk" ? (
                  <Badge variant={riskVariant}>{kpi.value}</Badge>
                ) : (
                  kpi.value
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted">{kpi.trend}</p>
            </div>
          </Card>
        ))}

        {/* Plan Status KPI */}
        <Card className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <ClipboardList className="h-4 w-4 text-muted" />
          </div>
          <div>
            <p className="text-xs text-muted">Plan Status</p>
            {planStats ? (
              <>
                <p className="text-lg font-semibold leading-tight">
                  {planStats.completed}/{planStats.total}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {planStats.delayed > 0
                    ? `${planStats.delayed} delayed`
                    : "On schedule"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted">No plan</p>
                <Link
                  href="/dashboard/plan"
                  className="mt-0.5 text-xs text-primary hover:underline"
                >
                  Upload plan
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Progress Delta (12 weeks)</CardTitle>
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
                  formatter={(value) => [`${value}%`, "Progress Delta"]}
                  labelFormatter={(label) => `Week of ${label}`}
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
          <CardTitle>Activity Index (12 weeks)</CardTitle>
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
                  formatter={(value) => [Number(value).toFixed(1), "Activity Index"]}
                  labelFormatter={(label) => `Week of ${label}`}
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

      {/* Summary & Recent flags */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>This Week Summary</CardTitle>
          <CardContent className="mt-3 space-y-2 text-sm text-muted">
            <p>
              Progress delta of <strong className="text-foreground">{latest.progressDelta}%</strong> is
              within the expected range for this construction phase.
            </p>
            <p>
              Activity index at <strong className="text-foreground">{latest.activityIndex.toFixed(0)}</strong> indicates
              normal on-site activity levels.
            </p>
            <p>
              {latest.activeHours}h of active work logged across {currentProject.cameraCount} camera
              zones in the last 7 days.
            </p>
            <p>
              Delay risk assessed as{" "}
              <Badge variant={riskVariant} className="ml-1">
                {latest.riskLevel}
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Recent Flags</CardTitle>
          <CardContent className="mt-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted">No recent flags for this project.</p>
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
