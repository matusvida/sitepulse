import type { Project, WeeklyMetrics, DailyMetrics, Alert, PlanData, PlanMilestone, ProgressReport, SnapshotMetadata, ActivitySummary } from "./types";
import {
  projects as mockProjects,
  getWeeklyMetrics as mockWeekly,
  getDailyMetrics as mockDaily,
  getActivitySummary as mockActivitySummary,
  getAlerts as mockAlerts,
} from "./mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Projects ────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  try {
    return await get<Project[]>("/api/projects");
  } catch {
    return mockProjects;
  }
}

export async function fetchProject(id: string): Promise<Project> {
  try {
    return await get<Project>(`/api/projects/${id}`);
  } catch {
    const p = mockProjects.find((p) => p.id === id);
    if (!p) throw new Error("Project not found");
    return p;
  }
}

export async function updateProject(
  id: string,
  data: { name?: string; location?: string; dropboxPath?: string },
): Promise<Project> {
  return patch<Project>(`/api/projects/${id}`, data);
}

// ── Metrics ─────────────────────────────────────────────────────────────────

export async function fetchWeeklyMetrics(
  projectId: string,
  weeks = 26,
): Promise<WeeklyMetrics[]> {
  try {
    return await get<WeeklyMetrics[]>(
      `/api/projects/${projectId}/metrics/weekly?weeks=${weeks}`,
    );
  } catch {
    return mockWeekly(projectId);
  }
}

export async function fetchDailyMetrics(
  projectId: string,
  days = 28,
): Promise<DailyMetrics[]> {
  try {
    return await get<DailyMetrics[]>(
      `/api/projects/${projectId}/metrics/daily?days=${days}`,
    );
  } catch {
    return mockDaily(projectId);
  }
}

// ── Alerts ──────────────────────────────────────────────────────────────────

export interface AlertFilters {
  type?: string;
  severity?: string;
  status?: string;
}

export async function fetchAlerts(
  projectId: string,
  filters?: AlertFilters,
): Promise<Alert[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== "all") params.set("type", filters.type);
    if (filters?.severity && filters.severity !== "all") params.set("severity", filters.severity);
    if (filters?.status && filters.status !== "all") params.set("status", filters.status);
    const qs = params.toString();
    return await get<Alert[]>(
      `/api/projects/${projectId}/alerts${qs ? `?${qs}` : ""}`,
    );
  } catch {
    return mockAlerts(projectId);
  }
}

export async function updateAlertStatus(
  projectId: string,
  alertId: string,
  status: string,
): Promise<Alert> {
  return patch<Alert>(`/api/projects/${projectId}/alerts/${alertId}`, {
    status,
  });
}

// ── Heatmap ─────────────────────────────────────────────────────────────────

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export async function fetchHeatmap(
  projectId: string,
): Promise<HeatmapCell[]> {
  try {
    return await get<HeatmapCell[]>(
      `/api/projects/${projectId}/activity/heatmap`,
    );
  } catch {
    return [];
  }
}

// ── Snapshots ───────────────────────────────────────────────────────────────

// Transitional fallback for older backends that still expose snapshot dates
// but do not yet serve the bulk /snapshots metadata endpoint.
function buildLegacySnapshotMetadata(projectId: string, dates: string[]): SnapshotMetadata[] {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return dates
    .slice()
    .sort()
    .map((date) => ({
      date,
      url: snapshotUrl(projectId, date),
      expiresAt,
      mediaType: "image/jpeg",
    }));
}

export async function fetchSnapshots(projectId: string): Promise<SnapshotMetadata[]> {
  try {
    return await get<SnapshotMetadata[]>(`/api/projects/${projectId}/snapshots`);
  } catch {
    try {
      const dates = await get<string[]>(`/api/projects/${projectId}/snapshot/dates`);
      return buildLegacySnapshotMetadata(projectId, dates);
    } catch {
      return [];
    }
  }
}

export async function fetchActivitySummary(
  projectId: string,
  days = 28,
): Promise<ActivitySummary> {
  try {
    return await get<ActivitySummary>(
      `/api/projects/${projectId}/activity/summary?days=${days}`,
    );
  } catch {
    return mockActivitySummary(projectId);
  }
}

export async function fetchSnapshotDates(projectId: string): Promise<string[]> {
  try {
    const snapshots = await fetchSnapshots(projectId);
    return snapshots.map((snapshot) => snapshot.date);
  } catch {
    return [];
  }
}

export function snapshotUrl(projectId: string, date: string): string {
  return `${API_URL}/api/projects/${projectId}/snapshot?date=${date}`;
}

// ── Sync ────────────────────────────────────────────────────────────────────

export async function fetchSyncStatus(projectId: string) {
  return get<Record<string, unknown>>(`/api/projects/${projectId}/sync/status`);
}

export async function triggerSync(projectId: string) {
  return post<Record<string, unknown>>(
    `/api/projects/${projectId}/sync/trigger`,
  );
}

// ── Plan ────────────────────────────────────────────────────────────────────

export async function fetchPlan(projectId: string): Promise<PlanData> {
  return get<PlanData>(`/api/projects/${projectId}/plan`);
}

export async function fetchMilestones(projectId: string): Promise<PlanMilestone[]> {
  return get<PlanMilestone[]>(`/api/projects/${projectId}/plan/milestones`);
}

export async function uploadPlan(projectId: string, file: File): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/projects/${projectId}/plan/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function updateMilestone(
  projectId: string,
  milestoneId: number,
  data: Partial<Pick<PlanMilestone, "title" | "description" | "expectedState" | "status">>,
): Promise<void> {
  await patch(`/api/projects/${projectId}/plan/milestones/${milestoneId}`, data);
}

export async function triggerPlanCheck(projectId: string): Promise<Record<string, unknown>> {
  return post<Record<string, unknown>>(`/api/projects/${projectId}/plan/check`);
}

// ── Reports ─────────────────────────────────────────────────────────────────

export async function generateReport(
  projectId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ProgressReport> {
  return post<ProgressReport>(`/api/projects/${projectId}/reports/generate`, {
    dateFrom,
    dateTo,
  });
}

export async function fetchReports(projectId: string): Promise<ProgressReport[]> {
  return get<ProgressReport[]>(`/api/projects/${projectId}/reports`);
}

export async function fetchReport(projectId: string, reportId: number): Promise<ProgressReport> {
  return get<ProgressReport>(`/api/projects/${projectId}/reports/${reportId}`);
}
