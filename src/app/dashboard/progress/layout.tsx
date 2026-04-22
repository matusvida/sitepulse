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

      <nav className="inline-flex flex-wrap gap-1 rounded-[22px] border border-white/80 bg-white/80 p-1 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={cn(
                "relative flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition-[background-color,color,box-shadow]",
                active
                  ? "border border-primary/15 bg-primary/10 text-primary shadow-[0_14px_28px_-24px_rgba(29,95,209,0.28)]"
                  : "text-muted hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
