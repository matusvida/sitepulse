"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useProject } from "@/lib/project-context";
import { Select } from "@/components/ui/select";
import { Bell, ClipboardList, FileText, LayoutDashboard, MapPin, Settings, TrendingUp, X } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { currentProject, setProjectId, allProjects } = useProject();

  const primaryNavItems = [
    { href: "/dashboard", label: t("sidebar.overview"), icon: LayoutDashboard },
    { href: "/dashboard/progress", label: t("sidebar.progress"), icon: TrendingUp },
    { href: "/dashboard/plan", label: t("sidebar.plan"), icon: ClipboardList },
    { href: "/dashboard/alerts", label: t("sidebar.alerts"), icon: Bell },
    { href: "/dashboard/reports", label: t("sidebar.reports"), icon: FileText },
  ];

  const settingsItem = { href: "/dashboard/settings", label: t("sidebar.settings"), icon: Settings };

  const projectOptions = allProjects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const renderNavLink = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
  }) => (
    <Link
      key={href}
      href={href}
      onClick={onClose}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
        isActive(href)
          ? "border border-primary/15 bg-primary/10 text-foreground shadow-[0_18px_40px_-30px_rgba(29,95,209,0.22)]"
          : "text-muted hover:bg-accent hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
          isActive(href)
            ? "bg-white text-primary shadow-[0_10px_24px_-18px_rgba(29,95,209,0.45)]"
            : "bg-white/70 text-muted group-hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </Link>
  );

  const nav = (
    <nav className="space-y-1.5" aria-label={t("sidebar.mainNavigation")}>
      {primaryNavItems.map(renderNavLink)}
    </nav>
  );

  const projectPanel = (
    <div className="rounded-[26px] border border-white/80 bg-white/84 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.3)] backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {t("sidebar.projectSwitcher")}
      </p>
      <div className="mt-3">
        <Select
          id="sidebar-project-switcher"
          aria-label={t("topNav.selectProject")}
          options={projectOptions}
          value={currentProject.id}
          onChange={(event) => setProjectId(event.target.value)}
          className="h-10 rounded-xl border-white/70 bg-white/80"
        />
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-accent/80 px-3.5 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{currentProject.name}</p>
          <p className="mt-1 truncate text-xs text-muted">{currentProject.location}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-16 lg:left-0 lg:z-30 lg:block lg:w-[290px] lg:border-r lg:border-white/70 lg:bg-white/58 lg:backdrop-blur-sm">
        <div className="flex h-full flex-col px-4 py-6">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-5">
              {projectPanel}
              {nav}
            </div>
          </div>
          <div className="mt-6 border-t border-white/70 pt-5">
            {renderNavLink(settingsItem)}
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label={t("sidebar.closeSidebar")}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[360px] flex-col border-r border-white/80 bg-[#f7f9fc]/95 px-4 py-5 shadow-[0_34px_80px_-34px_rgba(15,23,42,0.6)] backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold tracking-tight">{t("sidebar.brand")}</p>
                <p className="text-xs text-muted">{t("topNav.brandCaption")}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/80 bg-white/80 p-2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={t("sidebar.closeSidebar")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto pb-4">
              {projectPanel}
              {nav}
              <div className="border-t border-white/70 pt-4">
                {renderNavLink(settingsItem)}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
