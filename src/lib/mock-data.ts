import { Project, WeeklyMetrics, DailyMetrics, Alert } from "./types";

export const projects: Project[] = [
  {
    id: "proj-1",
    name: "Riverside Tower",
    location: "Prague 5, Czech Republic",
    coveragePercent: 87,
    cameraCount: 4,
    lastSnapshotAt: "2026-02-26T08:15:00Z",
  },
  {
    id: "proj-2",
    name: "Metro Line D – Station Olbrachtova",
    location: "Prague 4, Czech Republic",
    coveragePercent: 72,
    cameraCount: 6,
    lastSnapshotAt: "2026-02-26T07:45:00Z",
  },
  {
    id: "proj-3",
    name: "Greenfield Logistics Hub",
    location: "Brno, Czech Republic",
    coveragePercent: 94,
    cameraCount: 3,
    lastSnapshotAt: "2026-02-25T16:30:00Z",
  },
];

function generateWeeklyMetrics(projectId: string): WeeklyMetrics[] {
  const baseDate = new Date("2025-12-01");
  const seeds: Record<string, number> = {
    "proj-1": 42,
    "proj-2": 17,
    "proj-3": 88,
  };
  const seed = seeds[projectId] ?? 50;

  return Array.from({ length: 26 }, (_, i) => {
    const weekStart = new Date(baseDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const noise = Math.sin(seed + i * 1.3) * 0.5 + 0.5;
    const trend = i * 0.15;
    return {
      weekStart: weekStart.toISOString().split("T")[0],
      progressDelta: Math.round((1.5 + noise * 3.5 + trend * 0.2) * 10) / 10,
      activityIndex: Math.round((55 + noise * 35 + trend) * 10) / 10,
      activeHours: Math.round(28 + noise * 22 + trend * 0.5),
      riskLevel: noise < 0.25 ? "High" : noise < 0.5 ? "Medium" : ("Low" as const),
    };
  });
}

function generateDailyMetrics(projectId: string): DailyMetrics[] {
  const baseDate = new Date("2026-02-01");
  const seeds: Record<string, number> = {
    "proj-1": 33,
    "proj-2": 71,
    "proj-3": 12,
  };
  const seed = seeds[projectId] ?? 40;

  return Array.from({ length: 28 }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const noise = Math.sin(seed + i * 2.1) * 0.5 + 0.5;
    const weekendFactor = isWeekend ? 0.15 : 1;

    return {
      date: date.toISOString().split("T")[0],
      peopleCount: Math.round((8 + noise * 32) * weekendFactor),
      vehicleCount: Math.round((2 + noise * 10) * weekendFactor),
      activeHours: Math.round((isWeekend ? 1 : 6 + noise * 5) * 10) / 10,
    };
  });
}

function generateAlerts(projectId: string): Alert[] {
  const alertsMap: Record<string, Alert[]> = {
    "proj-1": [
      {
        id: "alert-1",
        createdAt: "2026-02-26T06:30:00Z",
        type: "stall",
        severity: "high",
        status: "open",
        summary: "No visible progress on east facade for 5 days",
        details:
          "Image comparison (SSIM) shows < 0.5% change on the east facade between Feb 20–25. Historical average for this phase is 2.1% weekly change. This may indicate a material delivery delay or crew reallocation.",
        recommendedActions: [
          "Verify material delivery schedule for east facade cladding",
          "Check if crew was reallocated to another zone",
          "Review weather logs for work stoppages",
        ],
      },
      {
        id: "alert-2",
        createdAt: "2026-02-25T14:00:00Z",
        type: "anomaly",
        severity: "medium",
        status: "acknowledged",
        summary: "Unusual activity spike detected at 22:00",
        details:
          "Vehicle count of 7 detected between 22:00–23:00 on Feb 24. Normal after-hours activity averages 0.3 vehicles. This could indicate unscheduled concrete pour or unauthorized access.",
        recommendedActions: [
          "Review camera footage from 22:00–23:00 on Feb 24",
          "Confirm with site manager if night work was scheduled",
        ],
      },
      {
        id: "alert-3",
        createdAt: "2026-02-24T09:15:00Z",
        type: "weather",
        severity: "low",
        status: "resolved",
        summary: "Heavy rain forecast may impact this week's progress",
        details:
          "Weather API indicates 3 consecutive rain days (Feb 24–26). Historical data shows 40% activity reduction during similar events.",
        recommendedActions: [
          "Adjust weekly progress expectations by ~40%",
          "Prioritize indoor tasks if available",
        ],
      },
      {
        id: "alert-4",
        createdAt: "2026-02-22T11:30:00Z",
        type: "safety",
        severity: "critical",
        status: "open",
        summary: "Potential safety zone violation detected",
        details:
          "Activity detected in exclusion zone near crane operation area during active lift window. 3 people counted in the zone between 11:00–11:30.",
        recommendedActions: [
          "Immediately review site safety protocols",
          "Brief on-site team on exclusion zone boundaries",
          "Consider adding physical barriers",
        ],
      },
      {
        id: "alert-5",
        createdAt: "2026-02-20T08:00:00Z",
        type: "schedule",
        severity: "medium",
        status: "resolved",
        summary: "Foundation work trending 4 days behind schedule",
        details:
          "Based on cumulative progress delta, foundation phase is tracking ~4 days behind the original schedule. Current completion estimate: March 8 vs planned March 4.",
        recommendedActions: [
          "Review resource allocation for foundation crew",
          "Consider weekend work to catch up",
          "Update stakeholder timeline if delay persists",
        ],
      },
    ],
    "proj-2": [
      {
        id: "alert-6",
        createdAt: "2026-02-26T05:00:00Z",
        type: "stall",
        severity: "medium",
        status: "open",
        summary: "Tunnel boring progress slowed by 60%",
        details:
          "Weekly progress delta dropped from 3.2% to 1.3% compared to 4-week average. Geological survey may reveal unexpected rock formation.",
        recommendedActions: [
          "Request geological survey update",
          "Check TBM maintenance logs",
        ],
      },
      {
        id: "alert-7",
        createdAt: "2026-02-23T16:00:00Z",
        type: "anomaly",
        severity: "low",
        status: "resolved",
        summary: "Camera 3 intermittent feed disruption",
        details:
          "Camera 3 experienced 4 feed interruptions averaging 12 minutes each over the past 48 hours. Image quality degraded during recovery periods.",
        recommendedActions: [
          "Schedule camera maintenance check",
          "Verify network connectivity at Camera 3 location",
        ],
      },
    ],
    "proj-3": [
      {
        id: "alert-8",
        createdAt: "2026-02-25T10:00:00Z",
        type: "schedule",
        severity: "low",
        status: "open",
        summary: "Steel delivery on track — 2 days ahead of schedule",
        details:
          "Structural steel delivery confirmed for Feb 27, 2 days ahead of schedule. This allows early start of Phase 2 steel erection.",
        recommendedActions: [
          "Confirm crane availability for early start",
          "Notify steel erection crew of updated timeline",
        ],
      },
    ],
  };

  return alertsMap[projectId] ?? [];
}

const weeklyCache = new Map<string, WeeklyMetrics[]>();
const dailyCache = new Map<string, DailyMetrics[]>();

export function getWeeklyMetrics(projectId: string): WeeklyMetrics[] {
  if (!weeklyCache.has(projectId)) {
    weeklyCache.set(projectId, generateWeeklyMetrics(projectId));
  }
  return weeklyCache.get(projectId)!;
}

export function getDailyMetrics(projectId: string): DailyMetrics[] {
  if (!dailyCache.has(projectId)) {
    dailyCache.set(projectId, generateDailyMetrics(projectId));
  }
  return dailyCache.get(projectId)!;
}

export function getAlerts(projectId: string): Alert[] {
  return generateAlerts(projectId);
}

export function getProject(projectId: string): Project | undefined {
  return projects.find((p) => p.id === projectId);
}
