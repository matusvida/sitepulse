"use client";

import { useState, useMemo, useCallback } from "react";
import { useProject } from "@/lib/project-context";
import { fetchAlerts, updateAlertStatus } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import type { Alert } from "@/lib/types";
import { AlertTriangle, CheckCircle2, ChevronRight, ShieldAlert, Siren, TimerReset } from "lucide-react";

export default function AlertsPage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [ackLoading, setAckLoading] = useState(false);

  const filters = useMemo(
    () => ({
      type: typeFilter,
      severity: severityFilter,
      status: statusFilter,
    }),
    [typeFilter, severityFilter, statusFilter],
  );

  const { data: alerts, loading, refetch } = useApi(
    () => fetchAlerts(currentProject.id, filters),
    [currentProject.id, filters],
  );

  const allAlerts = useMemo(() => alerts ?? [], [alerts]);
  const typeOptions = useMemo(
    () => ["all", "stall", "anomaly", "weather", "safety", "schedule"].map((value) => ({
      value,
      label: t(`alertsPage.typeOptions.${value}`),
    })),
    [t],
  );
  const typeLabel = useCallback((value: string) => t(`alertsPage.typeOptions.${value}`), [t]);
  const severityLabel = useCallback((value: string) => t(`alertsPage.severityOptions.${value}`), [t]);
  const statusLabel = useCallback((value: string) => t(`alertsPage.statusOptions.${value}`), [t]);
  const severityOptions = useMemo(
    () => ["all", "low", "medium", "high", "critical"].map((value) => ({
      value,
      label: t(`alertsPage.severityOptions.${value}`),
    })),
    [t],
  );
  const statusOptions = useMemo(
    () => ["all", "open", "acknowledged", "resolved"].map((value) => ({
      value,
      label: t(`alertsPage.statusOptions.${value}`),
    })),
    [t],
  );

  const stats = useMemo(
    () => ({
      open: allAlerts.filter((alert) => alert.status === "open").length,
      critical: allAlerts.filter((alert) => alert.severity === "critical").length,
      schedule: allAlerts.filter((alert) => alert.type === "schedule").length,
      resolved: allAlerts.filter((alert) => alert.status === "resolved").length,
    }),
    [allAlerts],
  );

  const handleClose = useCallback(() => setSelectedAlert(null), []);

  const handleAcknowledge = useCallback(async () => {
    if (!selectedAlert) return;
    setAckLoading(true);
    try {
      await updateAlertStatus(currentProject.id, selectedAlert.id, "acknowledged");
      setSelectedAlert(null);
      refetch();
    } finally {
      setAckLoading(false);
    }
  }, [selectedAlert, currentProject.id, refetch]);

  const handleResolve = useCallback(async () => {
    if (!selectedAlert) return;
    setAckLoading(true);
    try {
      await updateAlertStatus(currentProject.id, selectedAlert.id, "resolved");
      setSelectedAlert(null);
      refetch();
    } finally {
      setAckLoading(false);
    }
  }, [selectedAlert, currentProject.id, refetch]);

  if (loading && !alerts) {
    return <div className="py-12 text-center text-muted">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("alertsPage.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {t("alertsPage.description")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <Siren className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-muted">{t("alertsPage.statsOpen")}</p>
              <p className="text-2xl font-semibold tracking-tight">{stats.open}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-muted">{t("alertsPage.statsCritical")}</p>
              <p className="text-2xl font-semibold tracking-tight">{stats.critical}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <TimerReset className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-muted">{t("alertsPage.statsSchedule")}</p>
              <p className="text-2xl font-semibold tracking-tight">{stats.schedule}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-muted">{t("alertsPage.statsResolved")}</p>
              <p className="text-2xl font-semibold tracking-tight">{stats.resolved}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="mb-0">
          <CardTitle className="flex items-center gap-2">
            {t("alertsPage.filterTitle")}
            <HelpTooltip content={t("alertsPage.filterDescription")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Select
            id="type-filter"
            label={t("alertsPage.type")}
            options={typeOptions}
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          />
          <Select
            id="severity-filter"
            label={t("alertsPage.severity")}
            options={severityOptions}
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
          />
          <Select
            id="status-filter"
            label={t("alertsPage.status")}
            options={statusOptions}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          />
        </CardContent>
      </Card>

      {allAlerts.length === 0 ? (
        <Card className="p-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-muted/50" />
          <p className="mt-3 text-sm font-medium text-foreground">{t("alertsPage.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("alertsPage.emptyDescription")}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {allAlerts.map((alert) => (
              <Card key={alert.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={alert.severity}>{severityLabel(alert.severity)}</Badge>
                      <Badge variant="outline" className="capitalize">{typeLabel(alert.type)}</Badge>
                    </div>
                    <h2 className="mt-3 text-base font-semibold tracking-tight">{alert.summary}</h2>
                  </div>
                  <Badge variant="outline" className="capitalize">{statusLabel(alert.status)}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted">{alert.details}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">{formatDateTime(alert.createdAt)}</p>
                  <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert)}>
                    {t("alertsPage.review")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-accent/55 text-left">
                    <th className="px-5 py-4 font-medium text-muted">{t("alertsPage.type")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("alertsPage.tableSummary")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("alertsPage.severity")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("alertsPage.status")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("alertsPage.tableTime")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("alertsPage.tableAction")}</th>
                  </tr>
                </thead>
                <tbody>
                  {allAlerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="capitalize">{typeLabel(alert.type)}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{alert.summary}</p>
                        <p className="mt-1 max-w-xl text-xs text-muted line-clamp-2">{alert.details}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={alert.severity}>{severityLabel(alert.severity)}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="capitalize">{statusLabel(alert.status)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted">
                        {formatDateTime(alert.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                          {t("alertsPage.openAction")}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal open={!!selectedAlert} onClose={handleClose} title={t("alertsPage.modalTitle")}>
        {selectedAlert ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selectedAlert.severity}>{severityLabel(selectedAlert.severity)}</Badge>
              <Badge variant="outline" className="capitalize">{typeLabel(selectedAlert.type)}</Badge>
              <Badge variant="outline" className="capitalize">{statusLabel(selectedAlert.status)}</Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{selectedAlert.summary}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{selectedAlert.details}</p>
            </div>
            <div className="rounded-2xl bg-accent/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("alertsPage.raised")}</p>
              <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(selectedAlert.createdAt)}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{t("alertsPage.nextSteps")}</h4>
              <ul className="mt-3 space-y-2">
                {selectedAlert.recommendedActions.map((action, index) => (
                  <li key={action} className="flex items-start gap-3 rounded-2xl bg-accent/60 px-3.5 py-3 text-sm text-muted">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-foreground">
                      {index + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleClose}>
                {t("common.close")}
              </Button>
              {selectedAlert.status === "open" ? (
                <Button size="sm" onClick={handleAcknowledge} disabled={ackLoading}>
                  {ackLoading ? t("common.saving") : t("alertsPage.acknowledge")}
                </Button>
              ) : null}
              {selectedAlert.status !== "resolved" ? (
                <Button variant="outline" size="sm" onClick={handleResolve} disabled={ackLoading}>
                  {ackLoading ? t("common.saving") : t("alertsPage.resolve")}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
