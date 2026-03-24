"use client";

import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/lib/project-context";
import { updateProject } from "@/lib/api";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { currentProject, refresh } = useProject();

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

  useEffect(() => {
    setProjectName(currentProject.name);
    setLocation(currentProject.location);
    setCoverage(String(currentProject.coveragePercent));
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [currentProject.id, projectName, location, refresh]);

  const intervalOptions = [
    { value: "15m", label: "Every 15 minutes" },
    { value: "30m", label: "Every 30 minutes" },
    { value: "1h", label: "Every hour" },
    { value: "2h", label: "Every 2 hours" },
    { value: "4h", label: "Every 4 hours" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Project Settings</CardTitle>
          <CardContent className="mt-4 space-y-4">
            <Input
              id="project-name"
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <Input
              id="location"
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Input
              id="coverage"
              label="Coverage (%)"
              type="number"
              min={0}
              max={100}
              value={coverage}
              onChange={(e) => setCoverage(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Snapshot & Monitoring</CardTitle>
          <CardContent className="mt-4 space-y-4">
            <Select
              id="snapshot-interval"
              label="Snapshot Interval"
              options={intervalOptions}
              value={snapshotInterval}
              onChange={(e) => setSnapshotInterval(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="work-start"
                label="Working Hours Start"
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
              />
              <Input
                id="work-end"
                label="Working Hours End"
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Notifications</CardTitle>
          <CardContent className="mt-4 space-y-4">
            <Input
              id="notification-email"
              label="Notification Email"
              type="email"
              placeholder="alerts@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted">
              Alert notifications will be sent to this email address when new flags are detected.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : "Save Settings"}
        </Button>
        {saved && (
          <span className="text-sm text-success">Settings saved successfully</span>
        )}
        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>
    </div>
  );
}
