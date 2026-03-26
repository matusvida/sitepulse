export interface Project {
  id: string;
  name: string;
  location: string;
  coveragePercent: number;
  cameraCount: number;
  lastSnapshotAt: string;
}

export interface WeeklyMetrics {
  weekStart: string;
  progressDelta: number;
  activityIndex: number;
  activeHours: number;
  riskLevel: "Low" | "Medium" | "High";
}

export interface DailyMetrics {
  date: string;
  peopleCount: number;
  vehicleCount: number;
  activeHours: number;
}

export interface Alert {
  id: string;
  createdAt: string;
  type: "stall" | "anomaly" | "weather" | "safety" | "schedule";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved";
  summary: string;
  details: string;
  recommendedActions: string[];
}

export type RiskLevel = "Low" | "Medium" | "High";

export type AlertType = Alert["type"];
export type AlertSeverity = Alert["severity"];
export type AlertStatus = Alert["status"];

export type Timeframe = "4w" | "12w" | "26w";

// ── Plan ────────────────────────────────────────────────────────────────────

export type MilestoneStatus = "not_started" | "on_track" | "delayed" | "completed";

export interface ConstructionPlan {
  id: number;
  filename: string;
  status: string;
  createdAt: string | null;
}

export interface PlanMilestone {
  id: number;
  weekNumber: number;
  title: string;
  description: string;
  expectedState: string;
  actualState: string | null;
  status: MilestoneStatus;
  checkedAt: string | null;
  createdAt: string | null;
}

export interface PlanData {
  plan: ConstructionPlan | null;
  milestones: PlanMilestone[];
}

// ── Reports ─────────────────────────────────────────────────────────────────

export interface ProgressReport {
  id: number;
  reportType: string;
  contentMd?: string;
  summary: string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  imageCount: number;
  modelUsed: string;
  createdAt: string | null;
}
