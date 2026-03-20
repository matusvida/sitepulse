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
