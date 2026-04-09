"use client";

import { useProject } from "@/lib/project-context";
import { useLanguage } from "@/lib/language-context";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Camera, Languages, LayoutGrid, MapPin, Menu, User } from "lucide-react";

interface TopNavProps {
  onMenuToggle: () => void;
}

export function TopNav({ onMenuToggle }: TopNavProps) {
  const { currentProject, setProjectId, allProjects, loading } = useProject();
  const { locale, toggleLocale, t } = useLanguage();

  const projectOptions = allProjects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/78 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-2xl border border-white/80 bg-white/80 p-2 text-muted shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
          aria-label={t("topNav.toggleSidebar")}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_34px_-20px_rgba(15,23,42,0.8)]">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">SitePulse</p>
            <p className="truncate text-xs text-muted">{t("topNav.brandCaption")}</p>
          </div>
        </div>

        <div className="hidden min-w-[260px] flex-1 md:block lg:max-w-sm">
          <Select
            id="top-nav-project"
            aria-label={t("topNav.selectProject")}
            options={projectOptions}
            value={currentProject.id}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-10 rounded-xl border-white/70 bg-white/72 text-sm"
          />
        </div>

        <div className="hidden items-center gap-3 rounded-[22px] border border-white/70 bg-white/72 px-4 py-2 shadow-sm xl:flex">
          <div className="flex items-center gap-2 text-sm text-muted">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="max-w-[180px] truncate">{currentProject.location}</span>
          </div>
          <div className="h-8 w-px bg-border/80" />
          <div className="flex items-center gap-2 text-sm text-muted">
            <Camera className="h-4 w-4 text-primary" />
            <span>{t("topNav.cameraCount", { count: currentProject.cameraCount })}</span>
          </div>
          <div className="h-8 w-px bg-border/80" />
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("topNav.lastCapture")}
            </p>
            <p className="text-sm font-medium text-foreground">
              {loading ? t("common.loading") : formatDateTime(currentProject.lastSnapshotAt)}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-foreground sm:block md:hidden">
            {currentProject.name}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLocale}
            aria-label={t("topNav.switchLanguage")}
            className="h-10 rounded-xl px-3"
          >
            <Languages className="h-4 w-4" />
            {locale === "en" ? "SK" : "EN"}
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/80 shadow-sm">
            <User className="h-4 w-4 text-muted" />
          </div>
        </div>
      </div>
    </header>
  );
}
