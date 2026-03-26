"use client";

import { useState, useCallback, useRef } from "react";
import { useProject } from "@/lib/project-context";
import { fetchPlan, uploadPlan, triggerPlanCheck } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { MilestoneStatus } from "@/lib/types";
import {
  Upload,
  FileText,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
} from "lucide-react";

const statusConfig: Record<
  MilestoneStatus,
  { label: string; variant: "success" | "default" | "high" | "outline"; icon: typeof CheckCircle2 }
> = {
  completed: { label: "Completed", variant: "success", icon: CheckCircle2 },
  on_track: { label: "On Track", variant: "default", icon: Clock },
  delayed: { label: "Delayed", variant: "high", icon: AlertTriangle },
  not_started: { label: "Not Started", variant: "outline", icon: Circle },
};

export default function PlanPage() {
  const { currentProject } = useProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data, loading, refetch } = useApi(
    () => fetchPlan(currentProject.id),
    [currentProject.id],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      try {
        await uploadPlan(currentProject.id, file);
        refetch();
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [currentProject.id, refetch],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      e.target.value = "";
    },
    [handleUpload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") handleUpload(file);
    },
    [handleUpload],
  );

  const handleCheck = useCallback(async () => {
    setChecking(true);
    setCheckError(null);
    try {
      await triggerPlanCheck(currentProject.id);
      refetch();
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : "Check failed");
    } finally {
      setChecking(false);
    }
  }, [currentProject.id, refetch]);

  if (loading) {
    return <div className="py-12 text-center text-muted">Loading...</div>;
  }

  const plan = data?.plan;
  const milestones = data?.milestones ?? [];
  const delayed = milestones.filter((m) => m.status === "delayed").length;
  const completed = milestones.filter((m) => m.status === "completed").length;
  const total = milestones.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Construction Plan</h1>
        {plan && (
          <Button
            onClick={handleCheck}
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {checking ? "Checking..." : "Check Progress"}
          </Button>
        )}
      </div>

      {/* Upload section */}
      <Card>
        <CardTitle>
          {plan ? "Upload New Plan" : "Upload Construction Plan"}
        </CardTitle>
        <CardContent className="mt-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted">
                  Uploading and parsing plan...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted" />
                <p className="text-sm text-muted">
                  Drag & drop a PDF here, or click to browse
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  Choose File
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={onFileChange}
                />
              </>
            )}
          </div>
          {uploadError && (
            <p className="mt-2 text-sm text-destructive">{uploadError}</p>
          )}
          {checkError && (
            <p className="mt-2 text-sm text-destructive">{checkError}</p>
          )}
        </CardContent>
      </Card>

      {/* Plan info + stats */}
      {plan && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted" />
            <div>
              <p className="text-xs text-muted">Plan</p>
              <p className="text-sm font-medium truncate">{plan.filename}</p>
            </div>
          </Card>
          <Card>
            <p className="text-xs text-muted">Milestones</p>
            <p className="text-lg font-semibold">{total}</p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Completed</p>
            <p className="text-lg font-semibold text-emerald-600">
              {completed}
              <span className="text-sm font-normal text-muted">
                {" "}/ {total}
              </span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Delayed</p>
            <p className={`text-lg font-semibold ${delayed > 0 ? "text-red-600" : "text-muted"}`}>
              {delayed}
            </p>
          </Card>
        </div>
      )}

      {/* Milestones table */}
      {milestones.length > 0 && (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium text-muted w-16">Week</th>
                  <th className="px-4 py-3 font-medium text-muted">Milestone</th>
                  <th className="px-4 py-3 font-medium text-muted">Expected</th>
                  <th className="px-4 py-3 font-medium text-muted">Current Assessment</th>
                  <th className="px-4 py-3 font-medium text-muted w-28">Status</th>
                  <th className="px-4 py-3 font-medium text-muted w-28">Checked</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => {
                  const cfg = statusConfig[m.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr
                      key={m.id}
                      className="border-b last:border-0 hover:bg-accent/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-muted">
                        {m.weekNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{m.title}</p>
                        {m.description && (
                          <p className="mt-0.5 text-xs text-muted line-clamp-2">
                            {m.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted max-w-xs">
                        <p className="line-clamp-2 text-xs">{m.expectedState}</p>
                      </td>
                      <td className="px-4 py-3 text-muted max-w-xs">
                        {m.actualState ? (
                          <p className="line-clamp-2 text-xs">{m.actualState}</p>
                        ) : (
                          <span className="text-xs italic">Not evaluated</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {m.checkedAt ? formatDate(m.checkedAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!plan && (
        <Card className="py-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted opacity-30" />
          <p className="text-sm text-muted">
            Upload a construction plan PDF to get started.
          </p>
          <p className="mt-1 text-xs text-muted">
            SitePulse will extract milestones using AI and track your progress
            against the plan automatically.
          </p>
        </Card>
      )}
    </div>
  );
}
