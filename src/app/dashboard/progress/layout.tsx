"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { BarChart3, Calendar, GitCompareArrows } from "lucide-react";

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const tabs = [
    { href: "/dashboard/progress", label: t("progressLayout.charts"), icon: BarChart3 },
    { href: "/dashboard/progress/timeline", label: t("progressLayout.timeline"), icon: Calendar },
    { href: "/dashboard/progress/compare", label: t("progressLayout.compare"), icon: GitCompareArrows },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("progressLayout.title")}</h1>
      </div>

      <nav className="flex gap-1 border-b pb-px">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
