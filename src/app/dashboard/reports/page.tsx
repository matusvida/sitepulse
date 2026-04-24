"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import { useProject } from "@/lib/project-context";
import { fetchReport, fetchReports, fetchSnapshotDates, generateReport } from "@/lib/api";
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
  pickPreferredReport,
} from "@/lib/report-utils";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { AsyncState } from "@/components/ui/async-state";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import type { ProgressReport, ProgressReportType, ReportEvidenceImage } from "@/lib/types";
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function ReportsPage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();

  const { data: dates, error: datesError, refetch: refetchDates } = useApi(
    () => fetchSnapshotDates(currentProject.id),
    [currentProject.id],
  );
  const { data: reports, loading: loadingList, error: reportsError, refetch } = useApi(
    () => fetchReports(currentProject.id),
    [currentProject.id],
  );

  const sortedDates = useMemo(() => (dates ?? []).slice().sort(), [dates]);
  const dateOptions = useMemo(
    () => sortedDates.map((date) => ({ value: date, label: date })),
    [sortedDates],
  );
  const groupedReports = useMemo(() => groupReportsByType(reports), [reports]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ProgressReport | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState<number | null>(null);
  const [evidenceStartIndex, setEvidenceStartIndex] = useState(0);
  const [evidenceViewportWidth, setEvidenceViewportWidth] = useState(0);
  const evidenceViewportRef = useRef<HTMLDivElement>(null);

  const effectiveFrom = dateFrom || sortedDates[0] || "";
  const effectiveTo = dateTo || sortedDates[sortedDates.length - 1] || "";
  const invalidRange = Boolean(effectiveFrom && effectiveTo && effectiveFrom > effectiveTo);

  const handleViewReport = useCallback(
    async (reportId: number) => {
      setLoadingDetail(true);
      try {
        const detail = await fetchReport(currentProject.id, reportId);
        setActiveReport(detail);
        setSelectedEvidenceIndex(null);
        setEvidenceStartIndex(0);
      } finally {
        setLoadingDetail(false);
      }
    },
    [currentProject.id],
  );

  useEffect(() => {
    if (!reports?.length) {
      setActiveReport(null);
      return;
    }

    if (activeReport?.contentMd) {
      return;
    }

    if (activeReport && reports.some((report) => report.id === activeReport.id)) {
      return;
    }

    const preferredReport = pickPreferredReport(reports);
    if (!preferredReport) {
      return;
    }

    void handleViewReport(preferredReport.id);
  }, [activeReport, handleViewReport, reports]);

  const handleGenerate = useCallback(async () => {
    if (!effectiveFrom || !effectiveTo || invalidRange) {
      return;
    }

    setGenerating(true);
    setGenError(null);
    try {
      const report = await generateReport(currentProject.id, effectiveFrom, effectiveTo);
      setActiveReport(report);
      refetch();
    } catch (error) {
      setGenError(error instanceof Error ? error.message : t("reportsPage.generationFailed"));
    } finally {
      setGenerating(false);
    }
  }, [currentProject.id, effectiveFrom, effectiveTo, invalidRange, refetch, t]);

  const renderReportSection = useCallback(
    (type: ProgressReportType, items: ProgressReport[]) => (
      <section key={type} className="space-y-2">
        <div className="px-1">
          <h2 className="text-sm font-medium text-foreground">
            {t(`reportsPage.sections.${type}.title`)}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {t(`reportsPage.sections.${type}.description`)}
          </p>
        </div>
        {items.length === 0 ? (
          <Card className="rounded-[22px] py-5 text-center">
            <p className="text-xs text-muted">{t(`reportsPage.sections.${type}.empty`)}</p>
          </Card>
        ) : (
          items.map((report) => {
            const confidenceLabel = getConfidenceLabel(report, t);
            return (
              <button
                key={report.id}
                onClick={() => handleViewReport(report.id)}
                className={`w-full rounded-[22px] border p-3 text-left transition-colors cursor-pointer ${
                  activeReport?.id === report.id
                    ? "border-primary bg-primary/5"
                    : "border-white/70 bg-white/72 hover:bg-accent"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {getReportTypeLabel(report, t)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {getReportOriginLabel(report, t)}
                  </Badge>
                  {confidenceLabel ? (
                    <Badge variant={getConfidenceVariant(report)} className="text-[10px]">
                      {confidenceLabel}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-medium text-foreground line-clamp-2">
                  {getReportHeadline(report, t)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {getReportPeriodLabel(report, t)}
                  </span>
                  {report.createdAt ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(report.createdAt)}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </section>
    ),
    [activeReport?.id, handleViewReport, t],
  );

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
  const selectedEvidenceImage =
    selectedEvidenceIndex != null ? activeEvidenceImages[selectedEvidenceIndex] ?? null : null;

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

  useEffect(() => {
    const viewport = evidenceViewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setEvidenceViewportWidth(entry.contentRect.width);
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, [activeEvidenceImages.length]);

  const visibleEvidenceCount = useMemo(() => {
    if (evidenceViewportWidth >= 980) return 4;
    if (evidenceViewportWidth >= 700) return 3;
    if (evidenceViewportWidth >= 420) return 2;
    return 1;
  }, [evidenceViewportWidth]);

  const visibleEvidenceImages = useMemo(
    () => activeEvidenceImages.slice(evidenceStartIndex, evidenceStartIndex + visibleEvidenceCount),
    [activeEvidenceImages, evidenceStartIndex, visibleEvidenceCount],
  );

  useEffect(() => {
    const maxStart = Math.max(0, activeEvidenceImages.length - visibleEvidenceCount);
    setEvidenceStartIndex((current) => Math.min(current, maxStart));
  }, [activeEvidenceImages.length, visibleEvidenceCount]);

  const canScrollEvidenceLeft = evidenceStartIndex > 0;
  const canScrollEvidenceRight = evidenceStartIndex + visibleEvidenceCount < activeEvidenceImages.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("reportsPage.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("reportsPage.description")}</p>
      </div>

      <Card className="relative z-20">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("reportsPage.generateTitle")}
          <HelpTooltip content={t("reportsPage.generateDescription")} />
        </CardTitle>
        <CardContent className="mt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const latest = sortedDates[sortedDates.length - 1] ?? "";
                setDateFrom(latest);
                setDateTo(latest);
              }}
              disabled={sortedDates.length === 0}
            >
              {t("reportsPage.quickActions.latestDay")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const to = sortedDates[sortedDates.length - 1] ?? "";
                const from = sortedDates[Math.max(sortedDates.length - 7, 0)] ?? to;
                setDateFrom(from);
                setDateTo(to);
              }}
              disabled={sortedDates.length === 0}
            >
              {t("reportsPage.quickActions.last7Captures")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFrom(sortedDates[0] ?? "");
                setDateTo(sortedDates[sortedDates.length - 1] ?? "");
              }}
              disabled={sortedDates.length === 0}
            >
              {t("reportsPage.quickActions.fullRange")}
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <Select
              id="date-from"
              label={t("reportsPage.from")}
              options={dateOptions}
              value={effectiveFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="min-w-[180px]"
            />
            <Select
              id="date-to"
              label={t("reportsPage.to")}
              options={dateOptions}
              value={effectiveTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="min-w-[180px]"
            />
            <div className="group relative inline-flex">
              <Button
                onClick={handleGenerate}
                disabled
                aria-describedby="reports-generate-disabled-tip"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? t("reportsPage.generating") : t("reportsPage.generate")}
              </Button>
              <span
                id="reports-generate-disabled-tip"
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-[calc(100%+0.6rem)] z-[110] w-max -translate-x-1/2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)] transition-opacity duration-150 group-hover:opacity-100"
              >
                {t("reportsPage.temporarilyDisabled")}
              </span>
            </div>
          </div>
          {invalidRange ? (
            <p className="mt-3 text-sm text-amber-700">Start date must be on or before the end date.</p>
          ) : null}
          {genError ? <p className="mt-3 text-sm text-destructive">{genError}</p> : null}
          {generating ? <p className="mt-3 text-sm text-muted">{t("reportsPage.analyzing")}</p> : null}
          {datesError ? (
            <p className="mt-3 text-sm text-amber-700">
              Snapshot dates are unavailable right now. Refresh to retry before generating a report.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="relative z-10 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          {loadingList ? (
            <AsyncState type="loading" title={t("common.loading")} className="min-h-[180px]" />
          ) : reportsError && (!reports || reports.length === 0) ? (
            <AsyncState
              type="error"
              title="Unable to load reports"
              description={reportsError}
              actionLabel="Retry"
              onAction={() => {
                refetch();
                refetchDates();
              }}
              className="min-h-[180px]"
            />
          ) : !reports || reports.length === 0 ? (
            <AsyncState
              type="empty"
              title={t("reportsPage.noReportsTitle")}
              description={t("reportsPage.noReportsDescription")}
              className="min-h-[180px]"
            />
          ) : (
            <>
              {renderReportSection("daily", groupedReports.daily)}
              {renderReportSection("weekly", groupedReports.weekly)}
              {renderReportSection("custom", groupedReports.custom)}
            </>
          )}
        </div>

        <Card className="min-h-[460px]">
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
                  {activeReport.modelUsed ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      {activeReport.modelUsed}
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
                <div className="mt-5 rounded-[22px] border border-border/70 bg-accent/30 p-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      {t("reportsPage.evidenceSectionTitle")}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {t("reportsPage.evidenceSectionDescription")}
                  </p>
                  {activeEvidenceImages.length > 1 ? (
                    <p className="mt-2 text-xs font-medium text-muted">
                      {`${Math.min(evidenceStartIndex + 1, activeEvidenceImages.length)}/${activeEvidenceImages.length} - ${Math.min(
                        evidenceStartIndex + visibleEvidenceCount,
                        activeEvidenceImages.length,
                      )}/${activeEvidenceImages.length}`}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-3">
                    {activeEvidenceImages.length > 1 ? (
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 rounded-full bg-white/92 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.45)]"
                        onClick={() => setEvidenceStartIndex((current) => Math.max(0, current - 1))}
                        disabled={!canScrollEvidenceLeft}
                        aria-label="Scroll evidence images left"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div ref={evidenceViewportRef} className="mx-auto min-w-0 max-w-[860px] flex-1 overflow-hidden">
                        <div
                          className="grid gap-3"
                          style={{ gridTemplateColumns: `repeat(${visibleEvidenceCount}, minmax(0, 1fr))` }}
                        >
                          {visibleEvidenceImages.map((image, visibleIndex) => {
                            const index = evidenceStartIndex + visibleIndex;
                            return (
                              <button
                                key={`${image.url}-${index}`}
                                type="button"
                                onClick={() => setSelectedEvidenceIndex(index)}
                                className="overflow-hidden rounded-[18px] border border-border/70 bg-background text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
                              >
                                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                                  <img
                                    src={image.url}
                                    alt={getEvidenceLabel(image, index)}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex items-start justify-between gap-3 px-3 py-2.5">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                                      {`${index + 1}/${activeEvidenceImages.length}`}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                      {getEvidenceLabel(image, index)}
                                    </p>
                                    <p className="mt-1 line-clamp-2 break-all text-[11px] text-muted">
                                      {image.key || image.url}
                                    </p>
                                  </div>
                                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {activeEvidenceImages.length > 1 ? (
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 rounded-full bg-white/92 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.45)]"
                          onClick={() =>
                            setEvidenceStartIndex((current) =>
                              Math.min(activeEvidenceImages.length - visibleEvidenceCount, current + 1),
                            )
                          }
                          disabled={!canScrollEvidenceRight}
                          aria-label="Scroll evidence images right"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="prose prose-sm prose-zinc mt-5 max-w-none [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-sm [&_p]:text-muted [&_li]:text-sm [&_li]:text-muted [&_strong]:text-foreground">
                <Markdown>{activeReport.contentMd}</Markdown>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted opacity-20" />
              <p className="text-sm text-muted">{t("reportsPage.emptyTitle")}</p>
              <p className="mt-1 text-xs text-muted">{t("reportsPage.emptyDescription")}</p>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={selectedEvidenceImage != null}
        onClose={() => setSelectedEvidenceIndex(null)}
        bare
        hideHeader
        showCloseButton
        className="max-w-[96vw] max-h-[94vh]"
      >
        {selectedEvidenceImage ? (
          <div className="relative overflow-hidden rounded-[18px]">
            <div className="absolute left-3 top-3 z-10 rounded-full bg-slate-950/72 px-3 py-1.5 text-xs font-medium text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.8)]">
              {getEvidenceLabel(selectedEvidenceImage, selectedEvidenceIndex ?? 0)}
            </div>
            <img
              src={selectedEvidenceImage.url}
              alt={getEvidenceLabel(selectedEvidenceImage, selectedEvidenceIndex ?? 0)}
              className="block max-h-[94vh] max-w-[96vw] h-auto w-auto object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
