import type {
  ProgressReport,
  ProgressReportType,
  ReportConfidenceLevel,
  ReportGenerationOrigin,
} from "./types";
import { formatDate } from "./utils";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const reportTypePriority: Record<ProgressReportType, number> = {
  weekly: 0,
  daily: 1,
  custom: 2,
};

function normalizeString(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeReportType(report: ProgressReport): ProgressReportType {
  const normalized = normalizeString(report.reportType);
  if (normalized === "daily" || normalized === "weekly" || normalized === "custom") {
    return normalized;
  }

  if (report.dateRangeStart && report.dateRangeEnd && report.dateRangeStart === report.dateRangeEnd) {
    return "daily";
  }

  return "custom";
}

export function normalizeReportOrigin(report: ProgressReport): ReportGenerationOrigin {
  return normalizeString(report.generationOrigin) === "automatic" ? "automatic" : "manual";
}

export function normalizeConfidenceLevel(
  report: ProgressReport,
): ReportConfidenceLevel | null {
  const normalized = normalizeString(report.confidenceLevel);
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return null;
}

export function getReportTypeLabel(report: ProgressReport, t: TranslateFn): string {
  return t(`reportsPage.reportTypes.${normalizeReportType(report)}`);
}

export function getReportOriginLabel(report: ProgressReport, t: TranslateFn): string {
  return t(`reportsPage.origins.${normalizeReportOrigin(report)}`);
}

export function getConfidenceLabel(report: ProgressReport, t: TranslateFn): string | null {
  const confidence = normalizeConfidenceLevel(report);
  return confidence ? t(`reportsPage.confidenceLevels.${confidence}`) : null;
}

export function getConfidenceVariant(
  report: ProgressReport,
): "low" | "medium" | "high" | "outline" {
  const confidence = normalizeConfidenceLevel(report);
  return confidence ?? "outline";
}

export function isLowConfidence(report: ProgressReport): boolean {
  return normalizeConfidenceLevel(report) === "low";
}

export function getReportHeadline(report: ProgressReport, t: TranslateFn): string {
  return report.headline?.trim() || report.summary?.trim() || t("reportsPage.fallbackSummary");
}

export function getEvidenceImageCount(report: ProgressReport): number | null {
  return typeof report.evidenceImageCount === "number" ? report.evidenceImageCount : null;
}

export function getReportPeriodLabel(report: ProgressReport, t: TranslateFn): string {
  if (report.periodLabel?.trim()) {
    return report.periodLabel;
  }

  const type = normalizeReportType(report);
  const start = report.dateRangeStart;
  const end = report.dateRangeEnd;

  if (type === "daily" && start) {
    return formatDate(start);
  }

  if (type === "weekly" && start) {
    return t("reportsPage.weekOf", { date: formatDate(start) });
  }

  if (start && end) {
    if (start === end) {
      return formatDate(start);
    }
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  return t("reportsPage.periodUnavailable");
}

export function groupReportsByType(
  reports: ProgressReport[] | null | undefined,
): Record<ProgressReportType, ProgressReport[]> {
  const grouped: Record<ProgressReportType, ProgressReport[]> = {
    daily: [],
    weekly: [],
    custom: [],
  };

  for (const report of reports ?? []) {
    grouped[normalizeReportType(report)].push(report);
  }

  for (const type of Object.keys(grouped) as ProgressReportType[]) {
    grouped[type].sort(compareReportsByCreatedAtDesc);
  }

  return grouped;
}

export function pickPreferredReport(
  reports: ProgressReport[] | null | undefined,
): ProgressReport | null {
  if (!reports?.length) {
    return null;
  }

  return [...reports].sort((left, right) => {
    const priorityDelta =
      reportTypePriority[normalizeReportType(left)] - reportTypePriority[normalizeReportType(right)];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    return compareReportsByCreatedAtDesc(left, right);
  })[0] ?? null;
}

function compareReportsByCreatedAtDesc(left: ProgressReport, right: ProgressReport): number {
  const leftTs = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightTs = right.createdAt ? new Date(right.createdAt).getTime() : 0;
  return rightTs - leftTs;
}
