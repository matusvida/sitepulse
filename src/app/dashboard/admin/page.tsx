"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

  const projectOptions = useMemo(
    () => allProjects.map((project) => ({ value: project.id, label: project.name })),
    [allProjects],
  );

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
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />
            <Input
              id="last-name"
              label={t("adminPage.lastName")}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
            />
            <Input
              id="email"
              label={t("adminPage.email")}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setRole(event.target.value as UserRole)}
              />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <label htmlFor="projects" className="text-sm font-medium text-foreground">
                {t("adminPage.projectAccess")}
              </label>
              <select
                id="projects"
                multiple
                className="min-h-24 w-full rounded-xl border border-border/80 bg-white/75 px-3 py-2 text-sm outline-none focus:border-primary/40"
                value={selectedProjects.map(String)}
                onChange={(event) =>
                  setSelectedProjects(
                    Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                  )
                }
              >
                {projectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end xl:col-span-2">
              <Button type="submit" className="w-full md:w-auto">
                {t("adminPage.sendInvite")}
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
    </div>
  );
}
