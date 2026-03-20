"use client";

import { useState, useMemo, useCallback } from "react";
import { useProject } from "@/lib/project-context";
import { getAlerts } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import type { Alert } from "@/lib/types";
import { CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";

const typeOptions = [
  { value: "all", label: "All types" },
  { value: "stall", label: "Stall" },
  { value: "anomaly", label: "Anomaly" },
  { value: "weather", label: "Weather" },
  { value: "safety", label: "Safety" },
  { value: "schedule", label: "Schedule" },
];

const severityOptions = [
  { value: "all", label: "All severities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
];

export default function AlertsPage() {
  const { currentProject } = useProject();
  const alerts = getAlerts(currentProject.id);

  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [alerts, typeFilter, severityFilter, statusFilter]);

  const handleClose = useCallback(() => setSelectedAlert(null), []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Alerts</h1>

      <div className="flex flex-wrap items-end gap-3">
        <Select id="type-filter" label="Type" options={typeOptions} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
        <Select id="severity-filter" label="Severity" options={severityOptions} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} />
        <Select id="status-filter" label="Status" options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium text-muted">Type</th>
                <th className="px-4 py-3 font-medium text-muted">Summary</th>
                <th className="px-4 py-3 font-medium text-muted">Severity</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted">Time</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No alerts match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {alert.type}
                      </Badge>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-medium">
                      {alert.summary}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        {alert.status === "resolved" ? (
                          <CheckCircle className="h-3.5 w-3.5 text-success" />
                        ) : alert.status === "open" ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        ) : null}
                        <span className="capitalize">{alert.status}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatDateTime(alert.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alert detail modal */}
      <Modal open={!!selectedAlert} onClose={handleClose} title="Alert Details">
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={selectedAlert.severity}>{selectedAlert.severity}</Badge>
              <Badge variant="outline" className="capitalize">{selectedAlert.type}</Badge>
              <span className="ml-auto text-xs text-muted capitalize">{selectedAlert.status}</span>
            </div>
            <h3 className="font-medium">{selectedAlert.summary}</h3>
            <p className="text-sm text-muted">{selectedAlert.details}</p>

            <div>
              <h4 className="mb-2 text-sm font-medium">Recommended Next Steps</h4>
              <ul className="space-y-1.5">
                {selectedAlert.recommendedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-medium">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Close
              </Button>
              <Button size="sm">Acknowledge</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
