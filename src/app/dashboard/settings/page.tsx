"use client";

import { useState } from "react";
import { useProject } from "@/lib/project-context";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { currentProject } = useProject();

  const [projectName, setProjectName] = useState(currentProject.name);
  const [location, setLocation] = useState(currentProject.location);
  const [coverage, setCoverage] = useState(String(currentProject.coveragePercent));
  const [snapshotInterval, setSnapshotInterval] = useState("1h");
  const [workStart, setWorkStart] = useState("07:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const intervalOptions = [
    { value: "15m", label: "Every 15 minutes" },
    { value: "30m", label: "Every 30 minutes" },
    { value: "1h", label: "Every hour" },
    { value: "2h", label: "Every 2 hours" },
    { value: "4h", label: "Every 4 hours" },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
        <Button onClick={handleSave}>
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
        {saved && (
          <span className="text-sm text-success">Settings saved successfully</span>
        )}
      </div>
    </div>
  );
}
