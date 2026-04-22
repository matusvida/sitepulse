"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Select } from "@/components/ui/select";
import type { ProgressReport, ProgressReportType, ReportEvidenceImage } from "@/lib/types";
import {
  ArrowUpRight,
  Calendar,
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

  const effectiveFrom = dateFrom || sortedDates[0] || "";
  const effectiveTo = dateTo || sortedDates[sortedDates.length - 1] || "";
  const invalidRange = Boolean(effectiveFrom && effectiveTo && effectiveFrom > effectiveTo);

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
  const activeEvidenceImages = activeReport?.evidenceImages ?? [];

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

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("reportsPage.generateTitle")}
        </CardTitle>
        <CardContent className="mt-4">
          <p className="mb-4 max-w-2xl text-sm text-muted">{t("reportsPage.generateDescription")}</p>
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
              Latest day
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
              Last 7 captures
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
              Full range
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <Select
              id="date-from"
              label={t("reportsPage.from")}
              options={dateOptions}
              value={effectiveFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <Select
              id="date-to"
              label={t("reportsPage.to")}
              options={dateOptions}
              value={effectiveTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
            <Button onClick={handleGenerate} disabled={generating || !effectiveFrom || !effectiveTo || invalidRange}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? t("reportsPage.generating") : t("reportsPage.generate")}
            </Button>
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

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
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
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {activeEvidenceImages.map((image, index) => (
                      <a
                        key={`${image.url}-${index}`}
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group rounded-[18px] border border-border/70 bg-background px-3 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {getEvidenceLabel(image, index)}
                            </p>
                            <p className="mt-1 line-clamp-2 break-all text-[11px] text-muted">
                              {image.key || image.url}
                            </p>
                          </div>
                          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-primary" />
                        </div>
                      </a>
                    ))}
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
    </div>
  );
}
