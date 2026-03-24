"use client";

import { useState } from "react";
import { useProject } from "@/lib/project-context";
import { fetchWeeklyMetrics } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileText, Eye } from "lucide-react";

export default function ReportsPage() {
  const { currentProject } = useProject();

  const { data: weekly, loading } = useApi(
    () => fetchWeeklyMetrics(currentProject.id, 26),
    [currentProject.id],
  );

  const [timeframe, setTimeframe] = useState("12w");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSnapshots, setIncludeSnapshots] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const timeframeOptions = [
    { value: "4w", label: "Last 4 weeks" },
    { value: "12w", label: "Last 12 weeks" },
    { value: "26w", label: "Last 26 weeks" },
  ];

  if (loading || !weekly) {
    return <div className="py-12 text-center text-muted">Loading…</div>;
  }

  const latest = weekly[weekly.length - 1];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Reports</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardTitle>Generate Investor Report</CardTitle>
          <CardContent className="mt-4 space-y-4">
            <Select
              id="report-timeframe"
              label="Timeframe"
              options={timeframeOptions}
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            />
            <Toggle
              label="Include charts"
              checked={includeCharts}
              onChange={setIncludeCharts}
            />
            <Toggle
              label="Include snapshot comparison"
              checked={includeSnapshots}
              onChange={setIncludeSnapshots}
            />
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" onClick={() => alert("PDF export is a mock feature")}>
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className={showPreview ? "" : "flex items-center justify-center"}>
          {showPreview && latest ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted" />
                <CardTitle>Report Preview</CardTitle>
              </div>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-accent/30 p-4">
                  <h3 className="font-semibold">{currentProject.name}</h3>
                  <p className="text-xs text-muted">{currentProject.location}</p>
                  <p className="mt-1 text-xs text-muted">
                    Report period: {timeframe === "4w" ? "Last 4 weeks" : timeframe === "12w" ? "Last 12 weeks" : "Last 26 weeks"}
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium">Executive Summary</h4>
                  <p className="text-sm text-muted">
                    Construction at {currentProject.name} is progressing with a weekly delta of{" "}
                    <strong className="text-foreground">{latest.progressDelta}%</strong>. Site
                    activity levels remain healthy with an index of{" "}
                    <strong className="text-foreground">{latest.activityIndex.toFixed(0)}</strong> and{" "}
                    <strong className="text-foreground">{latest.activeHours}h</strong> of active work
                    in the last period. Current delay risk is assessed as{" "}
                    <Badge variant={latest.riskLevel === "Low" ? "low" : latest.riskLevel === "Medium" ? "medium" : "high"}>
                      {latest.riskLevel}
                    </Badge>.
                  </p>
                </div>

                {includeCharts && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Charts</h4>
                    <div className="flex aspect-[2/1] items-center justify-center rounded-lg border bg-accent/50 text-xs text-muted">
                      Progress & Activity charts would render here
                    </div>
                  </div>
                )}

                {includeSnapshots && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Snapshot Comparison</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex aspect-video items-center justify-center rounded-lg border bg-accent/50 text-xs text-muted">
                        Before
                      </div>
                      <div className="flex aspect-video items-center justify-center rounded-lg border bg-accent/50 text-xs text-muted">
                        After
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 text-xs text-muted">
                  Generated by SitePulse · {new Date().toLocaleDateString()}
                </div>
              </CardContent>
            </>
          ) : (
            <div className="text-center text-sm text-muted">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p>Configure and click Preview to see the report</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
