"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Check, ChevronDown } from "lucide-react";
import {
  createAdminUser,
  fetchAdminUsers,
  resendAdminInvite,
  setAdminUserEnabled,
  setAdminUserProjects,
  updateAdminUser,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useProject } from "@/lib/project-context";
import { getUserDisplayName } from "@/lib/utils";
import type { AdminUser, UserRole, UserStatus } from "@/lib/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { allProjects } = useProject();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const projectPickerRef = useRef<HTMLDivElement>(null);

  const projectOptions = useMemo(
    () => allProjects.map((project) => ({ value: project.id, label: project.name })),
    [allProjects],
  );

  const isInviteReady =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    selectedProjects.length > 0;

  useEffect(() => {
    if (!projectsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (projectPickerRef.current?.contains(target)) return;
      setProjectsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [projectsOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      setUsers(await fetchAdminUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      void loadUsers();
    }
  }, [user?.role]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const created = await createAdminUser({
        firstName,
        lastName,
        email,
        role,
        projectIds: selectedProjects,
      });

      setUsers((current) => [created, ...current]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("USER");
      setSelectedProjects([]);
      setInviteSent(true);
    } finally {
      setCreating(false);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("adminPage.adminOnlyTitle")}</CardTitle>
          <CardDescription>{t("adminPage.adminOnlyDescription")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("adminPage.userAccessTitle")}</CardTitle>
          <CardDescription>{t("adminPage.userAccessDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 xl:grid-cols-2" onSubmit={handleCreate}>
            <Input
              id="first-name"
              label={t("adminPage.firstName")}
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                setInviteSent(false);
              }}
              autoComplete="given-name"
              required
            />
            <Input
              id="last-name"
              label={t("adminPage.lastName")}
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                setInviteSent(false);
              }}
              autoComplete="family-name"
              required
            />
            <Input
              id="email"
              label={t("adminPage.email")}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setInviteSent(false);
              }}
              autoComplete="email"
              required
            />
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                {t("adminPage.role")}
              </label>
              <Select
                id="role"
                options={[
                  { value: "USER", label: t("adminPage.roleUser") },
                  { value: "ADMIN", label: t("adminPage.roleAdmin") },
                ]}
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as UserRole);
                  setInviteSent(false);
                }}
              />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <label htmlFor="projects" className="text-sm font-medium text-foreground">
                {t("adminPage.projectAccess")}
              </label>
              <div ref={projectPickerRef} className="relative">
                <button
                  id="projects"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={projectsOpen}
                  onClick={() => setProjectsOpen((open) => !open)}
                  className="flex h-11 w-full items-center justify-between rounded-2xl border border-border/80 bg-white/80 px-3.5 text-sm text-foreground shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)] transition-[border-color,box-shadow,background-color] hover:bg-white focus-visible:border-primary/40 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
                >
                  <span className={selectedProjects.length === 0 ? "text-muted" : ""}>
                    {selectedProjects.length === 0
                      ? t("adminPage.selectProjects")
                      : t("adminPage.projectsSelected", { count: selectedProjects.length })}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${projectsOpen ? "rotate-180 text-primary" : ""}`}
                  />
                </button>

                {projectsOpen ? (
                  <div className="absolute z-[100] mt-2 w-full rounded-[24px] border border-white/80 bg-white/96 p-2 shadow-[0_26px_70px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                    <div role="listbox" aria-multiselectable="true" className="max-h-72 overflow-auto">
                      {projectOptions.map((option) => {
                        const projectId = Number(option.value);
                        const selected = selectedProjects.includes(projectId);

                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setSelectedProjects((current) =>
                                current.includes(projectId)
                                  ? current.filter((value) => value !== projectId)
                                  : [...current, projectId],
                              );
                              setInviteSent(false);
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm transition-[background-color,color] outline-none ${
                              selected
                                ? "border border-primary/15 bg-primary/10 text-foreground shadow-[0_16px_34px_-28px_rgba(29,95,209,0.2)]"
                                : "text-foreground hover:bg-accent"
                            }`}
                          >
                            <span className="truncate">{option.label}</span>
                            <Check className={`h-4 w-4 shrink-0 ${selected ? "text-primary opacity-100" : "opacity-0"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-end xl:col-span-2">
              <Button
                type="submit"
                className="group relative w-full overflow-hidden md:w-auto"
                disabled={creating || !isInviteReady}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-[-30%] w-14 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] opacity-80 group-disabled:hidden"
                  style={{ animation: "inviteShimmer 2.8s ease-in-out infinite" }}
                />
                <span className="relative z-[1]">
                  {creating
                    ? t("adminPage.sendingInvite")
                    : inviteSent
                      ? t("adminPage.invitationSent")
                      : t("adminPage.sendInvite")}
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminPage.usersTitle")}</CardTitle>
          <CardDescription>{t("adminPage.usersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted">{t("adminPage.loadingUsers")}</p> : null}
          {users.map((adminUser) => (
            <div key={adminUser.id} className="rounded-2xl border border-white/80 bg-white/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{getUserDisplayName(adminUser)}</p>
                  <p className="text-sm text-muted">{adminUser.email}</p>
                  <p className="text-sm text-muted">
                    {adminUser.role} · {adminUser.status} ·{" "}
                    {adminUser.lastLoginAt
                      ? t("adminPage.lastLogin", { date: new Date(adminUser.lastLoginAt).toLocaleString() })
                      : t("adminPage.neverLoggedIn")}
                  </p>
                  {adminUser.invitationPreviewUrl ? (
                    <p className="mt-2 break-all text-xs text-primary">{adminUser.invitationPreviewUrl}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const updated = await resendAdminInvite(adminUser.id);
                      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                    }}
                  >
                    {t("adminPage.resendInvite")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const updated = await setAdminUserEnabled(
                        adminUser.id,
                        adminUser.status === "DISABLED",
                      );
                      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                    }}
                  >
                    {adminUser.status === "DISABLED" ? t("adminPage.enable") : t("adminPage.disable")}
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[180px_180px_1fr]">
                <Select
                  id={`role-${adminUser.id}`}
                  options={[
                    { value: "USER", label: t("adminPage.roleUser") },
                    { value: "ADMIN", label: t("adminPage.roleAdmin") },
                  ]}
                  value={adminUser.role}
                  onChange={async (event) => {
                    const updated = await updateAdminUser(adminUser.id, {
                      role: event.target.value as UserRole,
                      status: adminUser.status as UserStatus,
                    });
                    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                  }}
                />
                <Select
                  id={`status-${adminUser.id}`}
                  options={[
                    { value: "INVITED", label: t("adminPage.statusInvited") },
                    { value: "ACTIVE", label: t("adminPage.statusActive") },
                    { value: "DISABLED", label: t("adminPage.statusDisabled") },
                  ]}
                  value={adminUser.status}
                  onChange={async (event) => {
                    const updated = await updateAdminUser(adminUser.id, {
                      role: adminUser.role as UserRole,
                      status: event.target.value as UserStatus,
                    });
                    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                  }}
                />
                <select
                  multiple
                  className="min-h-24 w-full rounded-xl border border-border/80 bg-white/75 px-3 py-2 text-sm outline-none focus:border-primary/40"
                  value={adminUser.projectIds.map(String)}
                  onChange={async (event) => {
                    const projectIds = Array.from(event.target.selectedOptions).map((option) =>
                      Number(option.value),
                    );
                    const updated = await setAdminUserProjects(adminUser.id, projectIds);
                    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                  }}
                >
                  {projectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <style jsx>{`
        @keyframes inviteShimmer {
          0%,
          18% {
            transform: translateX(-180%) skewX(-12deg);
            opacity: 0;
          }
          28% {
            opacity: 0.8;
          }
          52% {
            transform: translateX(440%) skewX(-12deg);
            opacity: 0;
          }
          100% {
            transform: translateX(440%) skewX(-12deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
