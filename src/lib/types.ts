import type { ActivityConfidence, ActivityStatus, WeatherStatus } from "./activity";

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
  activityStatus: ActivityStatus;
  activityConfidence: ActivityConfidence;
  weatherStatus: WeatherStatus;
  weatherImpacted: boolean;
  reasonCodes: string[];
  summaryNote: string | null;
}

export interface ActivitySummary {
  totalDays: number;
  activeDays: number;
  inactiveDays: number;
  unknownDays: number;
  weatherImpactedDays: number;
  rainDays: number;
  snowDays: number;
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

export interface SnapshotMetadata {
  date: string;
  url: string;
  expiresAt: string;
  mediaType: string;
}

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

export type ProgressReportType = "daily" | "weekly" | "custom";
export type ReportGenerationOrigin = "automatic" | "manual";
export type ReportConfidenceLevel = "high" | "medium" | "low";

export interface ReportEvidenceImage {
  capturedAt: string | null;
  date: string | null;
  url: string;
  key: string | null;
}

export interface ProgressReport {
  id: number;
  reportType: ProgressReportType | string;
  contentMd?: string;
  summary: string;
  headline?: string | null;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  imageCount: number;
  evidenceImageCount?: number | null;
  modelUsed: string;
  generationOrigin?: ReportGenerationOrigin | string | null;
  confidenceLevel?: ReportConfidenceLevel | string | null;
  confidenceNote?: string | null;
  periodLabel?: string | null;
  createdAt: string | null;
  evidenceImages?: ReportEvidenceImage[];
}

export type UserRole = "ADMIN" | "USER";
export type UserStatus = "INVITED" | "ACTIVE" | "DISABLED";

export interface UserProfileIdentity {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  projectIds: number[];
}

export type AuthUser = UserProfileIdentity;

export interface AuthSession {
  user: AuthUser;
}

export interface AdminUser extends UserProfileIdentity {
  lastLoginAt: string | null;
  invitationPreviewUrl: string | null;
}
