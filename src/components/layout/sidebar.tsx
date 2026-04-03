"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import {
  LayoutDashboard,
  TrendingUp,
  ClipboardList,
  Bell,
  FileText,
  Settings,
  X,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t("sidebar.overview"), icon: LayoutDashboard },
    { href: "/dashboard/progress", label: t("sidebar.progress"), icon: TrendingUp },
    { href: "/dashboard/plan", label: t("sidebar.plan"), icon: ClipboardList },
    { href: "/dashboard/alerts", label: t("sidebar.alerts"), icon: Bell },
    { href: "/dashboard/reports", label: t("sidebar.reports"), icon: FileText },
    { href: "/dashboard/settings", label: t("sidebar.settings"), icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label={t("sidebar.mainNavigation")}>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(href)
              ? "bg-primary/10 text-primary"
              : "text-muted hover:bg-accent hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:border-r lg:bg-card">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="text-base font-semibold">{t("sidebar.brand")}</span>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label={t("sidebar.closeSidebar")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
