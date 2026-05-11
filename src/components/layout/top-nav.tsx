"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/lib/project-context";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { cn, formatDateTime, getUserDisplayName, getUserInitials } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { Camera, LayoutGrid, LogOut, MapPin, Menu, Settings } from "lucide-react";

interface TopNavProps {
  onMenuToggle: () => void;
}

export function TopNav({ onMenuToggle }: TopNavProps) {
  const { currentProject, loading, allProjects } = useProject();
  const { user, logout } = useAuth();
  const { locale, toggleLocale, t } = useLanguage();
  const router = useRouter();
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

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
              <span className="truncate">{currentProject.location || "No assigned location"}</span>
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
                {loading
                  ? t("common.loading")
                  : allProjects.length === 0
                    ? "No snapshots"
                    : formatDateTime(currentProject.lastSnapshotAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
          <div className="hidden rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-foreground sm:block xl:hidden">
            {currentProject.name}
          </div>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={t("topNav.openAccountMenu")}
              aria-expanded={menuOpen}
              aria-controls="account-panel"
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "group flex h-10 w-10 items-center justify-center rounded-full border border-white/85 bg-slate-950 text-xs font-semibold tracking-[0.08em] text-white shadow-[0_18px_34px_-22px_rgba(15,23,42,0.7)] transition-[transform,box-shadow,border-color] hover:scale-[1.02] hover:border-white hover:shadow-[0_22px_40px_-24px_rgba(15,23,42,0.78)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white xl:h-11 xl:w-11",
                menuOpen && "scale-[1.02] border-white shadow-[0_22px_40px_-24px_rgba(15,23,42,0.78)]",
              )}
            >
              <span className="sr-only">Account menu</span>
              <span className="transition-transform group-hover:scale-[1.04]">{initials}</span>
            </button>

            {menuOpen ? (
              <div
                id="account-panel"
                aria-label={t("topNav.accountPanel")}
                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-white/85 bg-white/96 p-1.5 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.42)] backdrop-blur-xl"
              >
                <div className="rounded-[16px] px-3.5 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="truncate text-xs text-muted">{user?.email}</p>
                </div>

                <div className="mx-2 my-1 h-px bg-border/80" />

                <div className="flex rounded-[16px] px-3.5 py-2.5">
                  <div className="flex min-w-0 flex-1 items-center">
                    <Toggle
                      variant="segmented"
                      checked={locale === "sk"}
                      onChange={() => toggleLocale()}
                      ariaLabel={t("topNav.switchLanguage")}
                      uncheckedLabel="EN"
                      checkedLabel="SK"
                      className="h-8.5"
                    />
                  </div>
                </div>
                <AccountMenuItem
                  icon={Settings}
                  label={t("sidebar.settings")}
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/dashboard/settings");
                  }}
                />

                <div className="mx-2 my-1 h-px bg-border/80" />

                <AccountMenuItem
                  icon={LogOut}
                  label={t("topNav.signOut")}
                  destructive
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

interface AccountMenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function AccountMenuItem({ icon: Icon, label, onClick, destructive = false }: AccountMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium transition-[background-color,color] hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        destructive ? "text-destructive" : "text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", destructive ? "text-destructive" : "text-muted")} />
      <span>{label}</span>
    </button>
  );
}
