"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useProject } from "@/lib/project-context";
import { updateProject } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { AsyncState } from "@/components/ui/async-state";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { currentProject, refresh } = useProject();
  const { t } = useLanguage();

  const [projectName, setProjectName] = useState(currentProject.name);
  const [location, setLocation] = useState(currentProject.location);
  const [coverage, setCoverage] = useState(String(currentProject.coveragePercent));
  const [snapshotInterval, setSnapshotInterval] = useState("1h");
  const [workStart, setWorkStart] = useState("07:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsupportedHint = "Read-only for now. The current backend only saves project name and location.";

  useEffect(() => {
    setProjectName(currentProject.name);
    setLocation(currentProject.location);
    setCoverage(String(currentProject.coveragePercent));
    setSaved(false);
    setError(null);
  }, [currentProject]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateProject(currentProject.id, {
        name: projectName,
        location,
      });
      refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settingsPage.failedToSave"));
    } finally {
      setSaving(false);
    }
  }, [currentProject.id, location, projectName, refresh, t]);

  const intervalOptions = useMemo(
    () => [
      { value: "15m", label: t("settingsPage.interval.15m") },
      { value: "30m", label: t("settingsPage.interval.30m") },
      { value: "1h", label: t("settingsPage.interval.1h") },
      { value: "2h", label: t("settingsPage.interval.2h") },
      { value: "4h", label: t("settingsPage.interval.4h") },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("settingsPage.title")}</h1>
      <AsyncState
        type="empty"
        title="Only project profile settings are editable today"
        description="Monitoring and notification preferences are visible, but the current backend does not persist changes to those fields yet."
        className="min-h-[140px] items-start text-left"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>{t("settingsPage.projectSettings")}</CardTitle>
          <CardContent className="mt-4 space-y-4">
            <Input
              id="project-name"
              label={t("settingsPage.projectName")}
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
            <Input
              id="location"
              label={t("settingsPage.location")}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
            <Input
              id="coverage"
              label={t("settingsPage.coverage")}
              type="number"
              min={0}
              max={100}
              value={coverage}
              onChange={(event) => setCoverage(event.target.value)}
              disabled
              hint={unsupportedHint}
            />
          </CardContent>
        </Card>

        <Card>
          <CardTitle>{t("settingsPage.snapshotMonitoring")}</CardTitle>
          <CardContent className="mt-4 space-y-4">
            <Select
              id="snapshot-interval"
              label={t("settingsPage.snapshotInterval")}
              options={intervalOptions}
              value={snapshotInterval}
              onChange={(event) => setSnapshotInterval(event.target.value)}
              disabled
              hint={unsupportedHint}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="work-start"
                label={t("settingsPage.workStart")}
                type="time"
                value={workStart}
                onChange={(event) => setWorkStart(event.target.value)}
                disabled
              />
              <Input
                id="work-end"
                label={t("settingsPage.workEnd")}
                type="time"
                value={workEnd}
                onChange={(event) => setWorkEnd(event.target.value)}
                disabled
              />
            </div>
            <p className="text-xs text-muted">{unsupportedHint}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>{t("settingsPage.notifications")}</CardTitle>
          <CardContent className="mt-4 space-y-4">
            <Input
              id="notification-email"
              label={t("settingsPage.notificationEmail")}
              type="email"
              placeholder="alerts@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled
              hint={unsupportedHint}
            />
            <p className="text-xs text-muted">{t("settingsPage.notificationHelp")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? t("settingsPage.saving") : t("settingsPage.save")}
        </Button>
        {saved ? <span className="text-sm text-success">{t("settingsPage.saved")}</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </div>
  );
}
