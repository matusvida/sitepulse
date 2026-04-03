"use client";

import { useProject } from "@/lib/project-context";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Languages, Menu, User } from "lucide-react";

interface TopNavProps {
  onMenuToggle: () => void;
}

export function TopNav({ onMenuToggle }: TopNavProps) {
  const { currentProject, setProjectId, allProjects } = useProject();
  const { locale, toggleLocale, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <button
        onClick={onMenuToggle}
        className="lg:hidden rounded-md p-1.5 text-muted hover:text-foreground transition-colors cursor-pointer"
        aria-label={t("topNav.toggleSidebar")}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-white">SP</span>
        </div>
        <span className="text-base font-semibold tracking-tight">SitePulse</span>
      </div>

      <div className="mx-4 hidden sm:block">
        <select
          value={currentProject.id}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label={t("topNav.selectProject")}
          className="h-8 rounded-lg border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
        >
          {allProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLocale}
          aria-label={t("topNav.switchLanguage")}
          className="h-8 px-2.5"
        >
          <Languages className="h-3.5 w-3.5" />
          {locale === "en" ? "SK" : "EN"}
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
          <User className="h-4 w-4 text-muted" />
        </div>
      </div>
    </header>
  );
}
