"use client";

import { useState } from "react";
import { Activity, Camera, Globe2, LifeBuoy } from "lucide-react";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";
import { ProjectProvider, useProject } from "@/lib/project-context";
import { LanguageProvider, useLanguage } from "@/lib/language-context";
import { formatDateTime } from "@/lib/utils";

function DashboardFooter() {
  const { currentProject, allProjects } = useProject();
  const { locale, t } = useLanguage();

  return (
    <footer className="mt-2 border-t border-white/70 pt-5">
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-[24px] border border-white/75 bg-white/78 p-5 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.3)] backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {t("shell.projectStatus")}
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold tracking-tight">{currentProject.name}</p>
              <p className="mt-1 text-sm text-muted">{currentProject.location}</p>
            </div>
            <p className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-foreground">
              {t("shell.projectCount", { count: allProjects.length })}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[24px] border border-white/75 bg-white/78 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Camera className="h-4 w-4 text-primary" />
              {t("shell.cameraCoverage")}
            </div>
            <p className="mt-2 text-sm text-muted">
              {t("shell.cameraCoverageStat", {
                count: currentProject.cameraCount,
                coverage: currentProject.coveragePercent,
              })}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/75 bg-white/78 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Activity className="h-4 w-4 text-primary" />
              {t("shell.lastCapture")}
            </div>
            <p className="mt-2 text-sm text-muted">{formatDateTime(currentProject.lastSnapshotAt)}</p>
          </div>
          <div className="rounded-[24px] border border-white/75 bg-white/78 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe2 className="h-4 w-4 text-primary" />
              {t("shell.language")}
            </div>
            <p className="mt-2 text-sm text-muted uppercase">{locale}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-white/70 pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{t("shell.footerCopyright")}</p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-white">
            <LifeBuoy className="h-3.5 w-3.5" />
            {t("shell.support")}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-foreground/80">
            {t("shell.helpLink")}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-foreground/80">
            {t("shell.docsLink")}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-foreground/80">
            {t("shell.footerPrivacy")}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-foreground/80">
            {t("shell.footerTerms")}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-foreground/80">
            {t("shell.footerStatus")}
          </span>
        </div>
      </div>
    </footer>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(29,95,209,0.08),transparent_22%)]" />
      <TopNav onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto lg:pl-[290px]">
          <div className="mx-auto flex min-h-full w-full max-w-[1680px] flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
            <div className="flex-1">{children}</div>
            <DashboardFooter />
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <LanguageProvider>
        <ShellFrame>{children}</ShellFrame>
      </LanguageProvider>
    </ProjectProvider>
  );
}
