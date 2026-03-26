"use client";

import { useState, useCallback, useMemo } from "react";
import Markdown from "react-markdown";
import { useProject } from "@/lib/project-context";
import { generateReport, fetchReports, fetchReport, fetchSnapshotDates } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ProgressReport } from "@/lib/types";
import { Sparkles, Loader2, FileText, Calendar, Image, Clock } from "lucide-react";

export default function ReportsPage() {
  const { currentProject } = useProject();

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
    () => sortedDates.map((d) => ({ value: d, label: d })),
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
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [currentProject.id, effectiveFrom, effectiveTo, refetch]);

  const handleViewReport = useCallback(
    async (reportId: number) => {
      setLoadingDetail(true);
      try {
        const detail = await fetchReport(currentProject.id, reportId);
        setActiveReport(detail);
      } catch {
        // silently degrade
      } finally {
        setLoadingDetail(false);
      }
    },
    [currentProject.id],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">AI Reports</h1>

      {/* Generate section */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Generate Progress Report
        </CardTitle>
        <CardContent className="mt-4">
          <div className="flex flex-wrap items-end gap-4">
            <Select
              id="date-from"
              label="From"
              options={dateOptions}
              value={effectiveFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Select
              id="date-to"
              label="To"
              options={dateOptions}
              value={effectiveTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Button
              onClick={handleGenerate}
              disabled={generating || !effectiveFrom || !effectiveTo}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate Report"}
            </Button>
          </div>
          {genError && (
            <p className="mt-3 text-sm text-destructive">{genError}</p>
          )}
          {generating && (
            <p className="mt-3 text-sm text-muted">
              Analyzing site photos with GPT-4o Vision. This may take 30-60 seconds...
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Report history sidebar */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted px-1">Report History</h2>
          {loadingList ? (
            <p className="px-1 text-sm text-muted">Loading...</p>
          ) : !reports || reports.length === 0 ? (
            <Card className="py-6 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-muted opacity-30" />
              <p className="text-xs text-muted">No reports yet</p>
            </Card>
          ) : (
            reports.map((r) => (
              <button
                key={r.id}
                onClick={() => handleViewReport(r.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                  activeReport?.id === r.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {r.reportType}
                  </Badge>
                  <span className="text-[10px] text-muted">
                    {r.createdAt ? formatDate(r.createdAt) : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium line-clamp-2">
                  {r.summary || "Progress report"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                  {r.dateRangeStart && r.dateRangeEnd && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {r.dateRangeStart} — {r.dateRangeEnd}
                    </span>
                  )}
                  {r.imageCount != null && (
                    <span className="flex items-center gap-0.5">
                      <Image className="h-2.5 w-2.5" />
                      {r.imageCount}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Report viewer */}
        <Card className="min-h-[400px]">
          {loadingDetail ? (
            <div className="flex h-full items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : activeReport?.contentMd ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 border-b pb-4">
                <Badge variant="default">{activeReport.reportType}</Badge>
                {activeReport.dateRangeStart && activeReport.dateRangeEnd && (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Calendar className="h-3 w-3" />
                    {activeReport.dateRangeStart} — {activeReport.dateRangeEnd}
                  </span>
                )}
                {activeReport.imageCount != null && (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Image className="h-3 w-3" />
                    {activeReport.imageCount} photos analyzed
                  </span>
                )}
                {activeReport.modelUsed && (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Sparkles className="h-3 w-3" />
                    {activeReport.modelUsed}
                  </span>
                )}
                {activeReport.createdAt && (
                  <span className="flex items-center gap-1 text-xs text-muted ml-auto">
                    <Clock className="h-3 w-3" />
                    {formatDate(activeReport.createdAt)}
                  </span>
                )}
              </div>
              <div className="prose prose-sm prose-zinc max-w-none [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-sm [&_p]:text-muted [&_li]:text-sm [&_li]:text-muted [&_strong]:text-foreground">
                <Markdown>{activeReport.contentMd}</Markdown>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted opacity-20" />
              <p className="text-sm text-muted">
                Select a report from the sidebar, or generate a new one.
              </p>
              <p className="mt-1 text-xs text-muted">
                AI reports analyze site photos and metrics to assess
                construction progress.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
