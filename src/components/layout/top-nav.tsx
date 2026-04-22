"use client";

import { useProject } from "@/lib/project-context";
import { useLanguage } from "@/lib/language-context";
import { formatDateTime } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { Camera, LayoutGrid, MapPin, Menu, User } from "lucide-react";

interface TopNavProps {
  onMenuToggle: () => void;
}

export function TopNav({ onMenuToggle }: TopNavProps) {
  const { currentProject, loading } = useProject();
  const { locale, toggleLocale, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/78 backdrop-blur-xl">
      <div className="flex h-14 w-full items-center gap-3 px-4 lg:px-5 xl:h-16 xl:px-6">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-xl border border-white/80 bg-white/80 p-2 text-muted shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:hidden"
          aria-label={t("topNav.toggleSidebar")}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_18px_34px_-20px_rgba(15,23,42,0.8)] xl:h-11 xl:w-11 xl:rounded-2xl">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div className="min-w-0 max-w-[220px]">
            <p className="truncate text-sm font-semibold tracking-tight xl:text-base">SitePulse</p>
            <p className="truncate text-xs text-muted">{t("topNav.brandCaption")}</p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 px-3 2xl:flex">
          <div className="mx-auto flex w-full max-w-[720px] items-center justify-center gap-3 rounded-[22px] border border-white/70 bg-white/72 px-4 py-2 shadow-sm">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{currentProject.location}</span>
            </div>
            <div className="h-8 w-px bg-border/80" />
            <div className="flex shrink-0 items-center gap-2 text-sm text-muted">
              <Camera className="h-4 w-4 text-primary" />
              <span>{t("topNav.cameraCount", { count: currentProject.cameraCount })}</span>
            </div>
            <div className="h-8 w-px bg-border/80" />
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("topNav.lastCapture")}
              </p>
              <p className="text-sm font-medium text-foreground">
                {loading ? t("common.loading") : formatDateTime(currentProject.lastSnapshotAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
          <div className="hidden rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-foreground sm:block xl:hidden">
            {currentProject.name}
          </div>
          <Toggle
            variant="segmented"
            checked={locale === "sk"}
            onChange={() => toggleLocale()}
            ariaLabel={t("topNav.switchLanguage")}
            uncheckedLabel="EN"
            checkedLabel="SK"
            className="h-9 xl:h-10"
          />
          <div
            className="flex h-9 min-w-9 items-center justify-center rounded-full border border-white/80 bg-white/80 px-2 shadow-sm xl:h-10"
            aria-label="Workspace avatar"
          >
            <User className="h-4 w-4 text-muted" />
            <span className="sr-only">Workspace avatar</span>
          </div>
        </div>
      </div>
    </header>
  );
}
