"use client";

import { useState, useCallback, useRef } from "react";
import { useProject } from "@/lib/project-context";
import { fetchPlan, uploadPlan, triggerPlanCheck } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { MilestoneStatus } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
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
  const { t } = useLanguage();
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
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : t("planPage.uploadFailed"));
      } finally {
        setUploading(false);
      }
    },
    [currentProject.id, refetch, t],
  );

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) handleUpload(file);
      event.target.value = "";
    },
    [handleUpload],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
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
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : t("planPage.checkFailed"));
    } finally {
      setChecking(false);
    }
  }, [currentProject.id, refetch, t]);

  if (loading) {
    return <div className="py-12 text-center text-muted">{t("common.loading")}</div>;
  }

  const plan = data?.plan;
  const milestones = data?.milestones ?? [];
  const delayed = milestones.filter((milestone) => milestone.status === "delayed").length;
  const completed = milestones.filter((milestone) => milestone.status === "completed").length;
  const total = milestones.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("planPage.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {t("planPage.description")}
          </p>
        </div>
        {plan ? (
          <Button onClick={handleCheck} disabled={checking} variant="outline">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {checking ? t("planPage.checking") : t("planPage.runProgressCheck")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{plan ? t("planPage.replaceCurrentPlan") : t("planPage.uploadConstructionPlan")}</CardTitle>
            <CardDescription>
              {t("planPage.uploadDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`rounded-[28px] border-2 border-dashed px-6 py-10 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/6" : "border-border/80 bg-accent/50"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">{t("planPage.uploadingTitle")}</p>
                  <p className="text-sm text-muted">{t("planPage.uploadingDescription")}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm">
                    <Upload className="h-6 w-6 text-primary" />
                  </span>
                  <div>
                    <p className="text-base font-semibold tracking-tight">{t("planPage.dropTitle")}</p>
                    <p className="mt-1 text-sm text-muted">
                      {t("planPage.dropDescription")}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => fileRef.current?.click()}>
                    {t("planPage.chooseFile")}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>
              )}
            </div>
            {uploadError ? <p className="mt-3 text-sm text-destructive">{uploadError}</p> : null}
            {checkError ? <p className="mt-3 text-sm text-destructive">{checkError}</p> : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted">{t("planPage.activePlan")}</p>
                <p className="truncate text-base font-semibold tracking-tight">
                  {plan ? plan.filename : t("planPage.noPlanUploaded")}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-muted">{t("planPage.milestones")}</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-3xl font-semibold tracking-tight">{total}</p>
              <p className="text-sm text-muted">{completed} {t("planPage.completed")}</p>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-muted">{t("planPage.delayedMilestones")}</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className={`text-3xl font-semibold tracking-tight ${delayed > 0 ? "text-red-600" : "text-foreground"}`}>
                {delayed}
              </p>
              <p className="text-sm text-muted">{total > 0 ? `${Math.round((completed / total) * 100)}${t("planPage.completeSuffix")}` : t("planPage.awaitingPlan")}</p>
            </div>
          </Card>
        </div>
      </div>

      {milestones.length === 0 ? (
        <Card className="p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted/40" />
          <p className="mt-3 text-sm font-medium text-foreground">{t("planPage.noMilestonesTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("planPage.noMilestonesDescription")}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {milestones.map((milestone) => {
              const config = statusConfig[milestone.status];
              const StatusIcon = config.icon;
              return (
                <Card key={milestone.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        {t("planPage.week")} {milestone.weekNumber}
                      </p>
                      <h2 className="mt-2 text-base font-semibold tracking-tight">{milestone.title}</h2>
                    </div>
                    <Badge variant={config.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {t(`planPage.status.${milestone.status}`)}
                    </Badge>
                  </div>
                  {milestone.description ? (
                    <p className="mt-3 text-sm text-muted">{milestone.description}</p>
                  ) : null}
                  <div className="mt-4 grid gap-3 rounded-2xl bg-accent/60 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("planPage.expected")}</p>
                      <p className="mt-1 text-sm text-foreground">{milestone.expectedState}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("planPage.currentAssessment")}</p>
                      <p className="mt-1 text-sm text-foreground">{milestone.actualState ?? t("planPage.notEvaluatedYet")}</p>
                    </div>
                    <p className="text-xs text-muted">
                      {t("planPage.checked")} {milestone.checkedAt ? formatDate(milestone.checkedAt) : t("planPage.pending").toLowerCase()}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-accent/55 text-left">
                    <th className="px-5 py-4 font-medium text-muted">{t("planPage.week")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("planPage.milestones")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("planPage.expected")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("planPage.currentAssessment")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("alertsPage.status")}</th>
                    <th className="px-5 py-4 font-medium text-muted">{t("planPage.checked")}</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((milestone) => {
                    const config = statusConfig[milestone.status];
                    const StatusIcon = config.icon;
                    return (
                      <tr key={milestone.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-4 font-mono text-muted">{milestone.weekNumber}</td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">{milestone.title}</p>
                          {milestone.description ? (
                            <p className="mt-1 max-w-sm text-xs text-muted line-clamp-2">{milestone.description}</p>
                          ) : null}
                        </td>
                        <td className="max-w-sm px-5 py-4 text-xs text-muted">{milestone.expectedState}</td>
                        <td className="max-w-sm px-5 py-4 text-xs text-muted">
                          {milestone.actualState ?? t("planPage.notEvaluatedYet")}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={config.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {t(`planPage.status.${milestone.status}`)}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted">
                          {milestone.checkedAt ? formatDate(milestone.checkedAt) : t("planPage.pending")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
