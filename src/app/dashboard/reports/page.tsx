"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useProject } from "@/lib/project-context";
import { fetchReport, fetchReports } from "@/lib/api";
import {
  getConfidenceLabel,
  getConfidenceVariant,
  getEvidenceImageCount,
  getReportHeadline,
  getReportOriginLabel,
  getReportPeriodLabel,
  getReportTypeLabel,
  groupReportsByType,
  isLowConfidence,
  normalizeReportType,
  pickPreferredReport,
} from "@/lib/report-utils";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { AsyncState } from "@/components/ui/async-state";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReportEvidenceGallery, ReportNarrative, ReportsHeader } from "@/components/reports";
import type { ProgressReport, ProgressReportType, ReportEvidenceImage } from "@/lib/types";
import { Calendar, Clock, FileText, Image as ImageIcon, Loader2, ShieldAlert } from "lucide-react";

const selectorTypes: ProgressReportType[] = ["daily", "weekly"];

export default function ReportsPage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();

  const { data: reports, loading: loadingList, error: reportsError, refetch } = useApi(
    () => fetchReports(currentProject.id),
    [currentProject.id],
  );

  const groupedReports = useMemo(() => groupReportsByType(reports), [reports]);
  const groupedCounts = useMemo(
    () => ({
      daily: groupedReports.daily.length,
      weekly: groupedReports.weekly.length,
      custom: groupedReports.custom.length,
    }),
    [groupedReports],
  );

  const [activeType, setActiveType] = useState<ProgressReportType>("weekly");
  const [activeReport, setActiveReport] = useState<ProgressReport | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleViewReport = useCallback(
    async (reportId: number) => {
      setLoadingDetail(true);
      try {
        const detail = await fetchReport(currentProject.id, reportId);
        setActiveReport(detail);
      } finally {
        setLoadingDetail(false);
      }
    },
    [currentProject.id],
  );

  const availableTypes = useMemo(
    () => selectorTypes.filter((type) => groupedReports[type].length > 0),
    [groupedReports],
  );

  useEffect(() => {
    if (!reports?.length) {
      setActiveReport(null);
      return;
    }

    const normalizedActiveType = activeReport ? normalizeReportType(activeReport) : null;
    const activeReportStillVisible = Boolean(
      activeReport && groupedReports[activeType].some((report) => report.id === activeReport.id),
    );

    if (normalizedActiveType && availableTypes.includes(normalizedActiveType) && activeType !== normalizedActiveType) {
      setActiveType(normalizedActiveType);
      return;
    }

    if (!availableTypes.includes(activeType)) {
      setActiveType(availableTypes[0] ?? "weekly");
      return;
    }

    if (activeReportStillVisible && activeReport?.contentMd) {
      return;
    }

    const nextReport =
      groupedReports[activeType][0] ??
      groupedReports[availableTypes[0] ?? "weekly"][0] ??
      pickPreferredReport(reports);

    if (!nextReport) {
      setActiveReport(null);
      return;
    }

    if (activeReport?.id === nextReport.id && activeReport.contentMd) {
      return;
    }

    void handleViewReport(nextReport.id);
  }, [activeReport, activeType, availableTypes, groupedReports, handleViewReport, reports]);

  const reportOptions = useMemo(
    () =>
      groupedReports[activeType].map((report) => ({
        value: String(report.id),
        label: `${getReportPeriodLabel(report, t)} - ${getReportHeadline(report, t)}`,
      })),
    [activeType, groupedReports, t],
  );

  const activeTypeCount = groupedReports[activeType].length;
  const activeConfidenceLabel = activeReport ? getConfidenceLabel(activeReport, t) : null;
  const activeEvidenceImageCount = activeReport ? getEvidenceImageCount(activeReport) : null;
  const activeEvidenceImages = useMemo(
    () =>
      (activeReport?.evidenceImages ?? []).slice().sort((left, right) => {
        const leftValue = left.capturedAt ?? left.date ?? "";
        const rightValue = right.capturedAt ?? right.date ?? "";
        return leftValue.localeCompare(rightValue);
      }),
    [activeReport?.evidenceImages],
  );

  const getEvidenceLabel = useCallback(
    (image: ReportEvidenceImage, index: number) => {
      if (image.capturedAt) {
        return formatDateTime(image.capturedAt);
      }
      if (image.date) {
        return image.date;
      }
      return `${t("reportsPage.evidenceImageFallback")} ${index + 1}`;
    },
    [t],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("reportsPage.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("reportsPage.description")}</p>
      </div>

      {loadingList ? (
        <AsyncState type="loading" title={t("common.loading")} className="min-h-[220px]" />
      ) : reportsError && (!reports || reports.length === 0) ? (
        <AsyncState
          type="error"
          title={t("reportsPage.errorTitle")}
          description={reportsError}
          actionLabel={t("common.retry")}
          onAction={() => {
            refetch();
          }}
          className="min-h-[220px]"
        />
      ) : !reports || reports.length === 0 ? (
        <AsyncState
          type="empty"
          title={t("reportsPage.noReportsTitle")}
          description={t("reportsPage.noReportsDescription")}
          className="min-h-[220px]"
        />
      ) : (
        <>
          <ReportsHeader
            activeType={activeType}
            activeTypeCount={activeTypeCount}
            groupedCounts={groupedCounts}
            reportOptions={reportOptions}
            selectedReportId={
              activeReport && normalizeReportType(activeReport) === activeType ? String(activeReport.id) : ""
            }
            onTypeChange={setActiveType}
            onReportChange={(reportId) => {
              void handleViewReport(reportId);
            }}
            t={t}
          />

          <Card className="relative z-0 min-h-[460px]">
            {loadingDetail ? (
              <div className="flex h-full items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              </div>
            ) : activeReport?.contentMd ? (
              <>
                <div className="border-b pb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{getReportTypeLabel(activeReport, t)}</Badge>
                    <Badge variant="outline">{getReportOriginLabel(activeReport, t)}</Badge>
                    {activeConfidenceLabel ? (
                      <Badge variant={getConfidenceVariant(activeReport)}>{activeConfidenceLabel}</Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                    {getReportHeadline(activeReport, t)}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {getReportPeriodLabel(activeReport, t)}
                    </span>
                    {activeReport.imageCount != null ? (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {t("reportsPage.photosAnalyzed", { count: activeReport.imageCount })}
                      </span>
                    ) : null}
                    {activeEvidenceImageCount != null ? (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {t("reportsPage.evidenceImages", { count: activeEvidenceImageCount })}
                      </span>
                    ) : null}
                    {activeReport.createdAt ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {t("reportsPage.generatedAt", { date: formatDateTime(activeReport.createdAt) })}
                      </span>
                    ) : null}
                  </div>
                </div>

                {isLowConfidence(activeReport) ? (
                  <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <div>
                        <p className="font-medium">{t("reportsPage.lowConfidenceTitle")}</p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          {activeReport.confidenceNote?.trim() || t("reportsPage.lowConfidenceDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeEvidenceImages.length > 0 ? (
                  <ReportEvidenceGallery
                    images={activeEvidenceImages}
                    getEvidenceLabel={getEvidenceLabel}
                    labels={{
                      sectionTitle: t("reportsPage.evidenceSectionTitle"),
                      sectionDescription: t("reportsPage.evidenceSectionDescription"),
                      fallbackImageLabel: t("reportsPage.evidenceImageFallback"),
                      previousImage: t("reportsPage.previousEvidenceImage"),
                      nextImage: t("reportsPage.nextEvidenceImage"),
                      thumbnailRail: t("reportsPage.evidenceThumbnailRail"),
                    }}
                  />
                ) : null}

                <ReportNarrative contentMd={activeReport.contentMd} />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted opacity-20" />
                <p className="text-sm text-muted">{t("reportsPage.emptyTitle")}</p>
                <p className="mt-1 text-xs text-muted">{t("reportsPage.emptyDescription")}</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
