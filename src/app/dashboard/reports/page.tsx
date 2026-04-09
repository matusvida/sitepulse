"use client";

import { useState, useCallback, useMemo } from "react";
import Markdown from "react-markdown";
import { useProject } from "@/lib/project-context";
import { generateReport, fetchReports, fetchReport, fetchSnapshotDates } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ProgressReport } from "@/lib/types";
import { Sparkles, Loader2, FileText, Calendar, Image as ImageIcon, Clock } from "lucide-react";

export default function ReportsPage() {
  const { currentProject } = useProject();
  const { t } = useLanguage();

  const { data: dates } = useApi(
    () => fetchSnapshotDates(currentProject.id),
    [currentProject.id],
  );
  const { data: reports, loading: loadingList, refetch } = useApi(
    () => fetchReports(currentProject.id),
    [currentProject.id],
  );

  const sortedDates = useMemo(() => (dates ?? []).slice().sort(), [dates]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ProgressReport | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const effectiveFrom = dateFrom || sortedDates[0] || "";
  const effectiveTo = dateTo || sortedDates[sortedDates.length - 1] || "";

  const dateOptions = useMemo(
    () => sortedDates.map((date) => ({ value: date, label: date })),
    [sortedDates],
  );

  const handleGenerate = useCallback(async () => {
    if (!effectiveFrom || !effectiveTo) return;
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
  }, [currentProject.id, effectiveFrom, effectiveTo, refetch, t]);

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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("reportsPage.title")}</h1>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("reportsPage.generateTitle")}
        </CardTitle>
        <CardContent className="mt-4">
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
            <Button onClick={handleGenerate} disabled={generating || !effectiveFrom || !effectiveTo}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? t("reportsPage.generating") : t("reportsPage.generate")}
            </Button>
          </div>
          {genError ? <p className="mt-3 text-sm text-destructive">{genError}</p> : null}
          {generating ? <p className="mt-3 text-sm text-muted">{t("reportsPage.analyzing")}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-muted">{t("reportsPage.history")}</h2>
          {loadingList ? (
            <p className="px-1 text-sm text-muted">{t("common.loading")}</p>
          ) : !reports || reports.length === 0 ? (
            <Card className="py-6 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-muted opacity-30" />
              <p className="text-xs text-muted">{t("reportsPage.noReports")}</p>
            </Card>
          ) : (
            reports.map((report) => (
              <button
                key={report.id}
                onClick={() => handleViewReport(report.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                  activeReport?.id === report.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {report.reportType}
                  </Badge>
                  <span className="text-[10px] text-muted">
                    {report.createdAt ? formatDate(report.createdAt) : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium line-clamp-2">
                  {report.summary || t("reportsPage.fallbackSummary")}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                  {report.dateRangeStart && report.dateRangeEnd ? (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {report.dateRangeStart} - {report.dateRangeEnd}
                    </span>
                  ) : null}
                  {report.imageCount != null ? (
                    <span className="flex items-center gap-0.5">
                      <ImageIcon className="h-2.5 w-2.5" />
                      {report.imageCount}
                    </span>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>

        <Card className="min-h-[400px]">
          {loadingDetail ? (
            <div className="flex h-full items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : activeReport?.contentMd ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 border-b pb-4">
                <Badge variant="default">{activeReport.reportType}</Badge>
                {activeReport.dateRangeStart && activeReport.dateRangeEnd ? (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Calendar className="h-3 w-3" />
                    {activeReport.dateRangeStart} - {activeReport.dateRangeEnd}
                  </span>
                ) : null}
                {activeReport.imageCount != null ? (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <ImageIcon className="h-3 w-3" />
                    {t("reportsPage.photosAnalyzed", { count: activeReport.imageCount })}
                  </span>
                ) : null}
                {activeReport.modelUsed ? (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Sparkles className="h-3 w-3" />
                    {activeReport.modelUsed}
                  </span>
                ) : null}
                {activeReport.createdAt ? (
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3 w-3" />
                    {formatDate(activeReport.createdAt)}
                  </span>
                ) : null}
              </div>
              <div className="prose prose-sm prose-zinc max-w-none [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-sm [&_p]:text-muted [&_li]:text-sm [&_li]:text-muted [&_strong]:text-foreground">
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
