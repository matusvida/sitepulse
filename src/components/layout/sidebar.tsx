"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useProject } from "@/lib/project-context";
import { useAuth } from "@/lib/auth-context";
import { Select } from "@/components/ui/select";
import { BarChart3, Bell, Calendar, ClipboardList, FileText, GitCompareArrows, LayoutDashboard, MapPin, Settings, Shield, TrendingUp, X } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  children?: Array<{
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
  }>;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { currentProject, setProjectId, allProjects } = useProject();
  const { user } = useAuth();

  const primaryNavItems: NavItem[] = [
    { href: "/dashboard", label: t("sidebar.overview"), icon: LayoutDashboard },
    {
      href: "/dashboard/progress",
      label: t("sidebar.progress"),
      icon: TrendingUp,
      children: [
        { href: "/dashboard/progress", label: t("progressLayout.charts"), icon: BarChart3 },
        { href: "/dashboard/progress/timeline", label: t("progressLayout.timeline"), icon: Calendar },
        { href: "/dashboard/progress/compare", label: t("progressLayout.compare"), icon: GitCompareArrows },
      ],
    },
    { href: "/dashboard/plan", label: t("sidebar.plan"), icon: ClipboardList },
    { href: "/dashboard/alerts", label: t("sidebar.alerts"), icon: Bell },
    { href: "/dashboard/reports", label: t("sidebar.reports"), icon: FileText },
  ];

  const settingsItem = { href: "/dashboard/settings", label: t("sidebar.settings"), icon: Settings };
  const adminItem = { href: "/dashboard/admin", label: "Users", icon: Shield };

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
    children,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    children?: NavItem["children"];
  }) => {
    const active = isActive(href);

    return (
      <div key={href} className="space-y-1">
        <Link
          href={href}
          onClick={onClose}
          className={cn(
            "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200 xl:gap-3 xl:rounded-2xl xl:px-3.5 xl:py-2.5 xl:text-sm",
            active
              ? "border border-primary/15 bg-primary/10 text-foreground shadow-[0_18px_40px_-30px_rgba(29,95,209,0.22)]"
              : "text-muted hover:bg-accent hover:text-foreground",
          )}
          aria-current={active && !children ? "page" : undefined}
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors xl:h-9 xl:w-9 xl:rounded-xl",
              active
                ? "bg-white text-primary shadow-[0_10px_24px_-18px_rgba(29,95,209,0.45)]"
                : "bg-white/70 text-muted group-hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span>{label}</span>
        </Link>

        {children ? (
          <div
            className={cn(
              "ml-5 overflow-hidden pl-4 transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none",
              active ? "mt-1 grid grid-rows-[1fr] opacity-100" : "grid grid-rows-[0fr] opacity-0",
            )}
            aria-hidden={!active}
          >
            <div className="min-h-0">
              <div className="space-y-1.5 pb-0.5">
              {children.map((child) => {
                const childActive = pathname === child.href;
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-[background-color,color,box-shadow] duration-200 xl:rounded-2xl xl:px-3.5 xl:py-2.5 xl:text-[13px]",
                      childActive
                        ? "bg-white/92 text-primary shadow-[0_14px_24px_-22px_rgba(29,95,209,0.38)] ring-1 ring-primary/12"
                        : "text-muted hover:bg-white/72 hover:text-foreground",
                    )}
                    aria-current={childActive ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors xl:h-8 xl:w-8 xl:rounded-xl",
                        childActive
                          ? "bg-primary/10 text-primary"
                          : "bg-white/78 text-muted group-hover:text-foreground",
                      )}
                    >
                      <ChildIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>{child.label}</span>
                  </Link>
                );
              })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const nav = (
    <nav className="space-y-0.5" aria-label={t("sidebar.mainNavigation")}>
      {primaryNavItems.map(renderNavLink)}
    </nav>
  );

  const projectPanel = (
    <div className="rounded-[20px] border border-white/80 bg-white/84 p-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.3)] backdrop-blur-sm xl:rounded-[24px] xl:p-3.5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {t("sidebar.projectSwitcher")}
      </p>
      {allProjects.length > 0 ? (
        <>
          <div className="mt-2">
            <Select
              id="sidebar-project-switcher"
              aria-label={t("topNav.selectProject")}
              options={projectOptions}
              value={currentProject.id}
              onChange={(event) => setProjectId(event.target.value)}
              className="h-8.5 rounded-xl border-white/70 bg-white/80 text-[13px] xl:h-9"
            />
          </div>
          <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-accent/80 px-2.5 py-2 xl:mt-3 xl:gap-2.5 xl:rounded-2xl xl:px-3 xl:py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm xl:h-9 xl:w-9 xl:rounded-xl">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground xl:text-sm">{currentProject.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{currentProject.location}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-2 rounded-xl bg-accent/80 px-3 py-2 text-xs text-muted">
          No assigned projects
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden xl:block xl:w-[290px] xl:shrink-0 xl:self-stretch xl:border-r xl:border-white/70 xl:bg-white/58">
        <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col px-3.5 py-4.5 backdrop-blur-sm">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {projectPanel}
              {nav}
            </div>
          </div>
          <div className="mt-3 border-t border-white/70 pt-3">
            {user?.role === "ADMIN" ? renderNavLink(adminItem) : null}
            {renderNavLink(settingsItem)}
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label={t("sidebar.closeSidebar")}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-[312px] flex-col border-r border-white/80 bg-[#f7f9fc]/95 px-3.5 py-4 shadow-[0_34px_80px_-34px_rgba(15,23,42,0.6)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold tracking-tight">{t("sidebar.brand")}</p>
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
            <div className="space-y-4 overflow-y-auto pb-3">
              {projectPanel}
              {nav}
              <div className="border-t border-white/70 pt-4">
                {user?.role === "ADMIN" ? renderNavLink(adminItem) : null}
                {renderNavLink(settingsItem)}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
