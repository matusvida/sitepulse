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
  setAdminUserProjects,
  updateAdminUser,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useProject } from "@/lib/project-context";
import type { AdminUser, UserRole } from "@/lib/types";
import { AdminUserRow } from "./components/admin-user-row";
import { ProjectMultiSelect } from "./components/project-multi-select";
import type { ProjectOption, UserDraft } from "./types";
import { areProjectIdsEqual } from "./utils";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { allProjects } = useProject();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userDrafts, setUserDrafts] = useState<Record<number, UserDraft>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

  const projectOptions = useMemo<ProjectOption[]>(
    () => allProjects.map((project) => ({ value: project.id, label: project.name })),
    [allProjects],
  );

  const isInviteReady =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    (role === "ADMIN" || selectedProjects.length > 0);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        setUsers(await fetchAdminUsers());
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, [user?.role]);

  useEffect(() => {
    setUserDrafts((current) => {
      const nextDrafts: Record<number, UserDraft> = {};

      for (const adminUser of users) {
        nextDrafts[adminUser.id] = current[adminUser.id] ?? {
          role: adminUser.role,
          status: adminUser.status,
          projectIds: [...adminUser.projectIds],
        };
      }

      return nextDrafts;
    });
  }, [users]);

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
            <div className="space-y-2 max-w-md">
              <label htmlFor="projects" className="text-sm font-medium text-foreground">
                {t("adminPage.projectAccess")}
              </label>
              <ProjectMultiSelect
                id="projects"
                options={projectOptions}
                value={selectedProjects}
                onChange={(nextValue) => {
                  setSelectedProjects(nextValue);
                  setInviteSent(false);
                }}
                placeholder={t("adminPage.selectProjects")}
                selectedLabel={t("adminPage.projectsSelected", { count: selectedProjects.length })}
                disabled={role === "ADMIN"}
                widthClassName="max-w-md"
              />
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
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted">{t("adminPage.loadingUsers")}</p> : null}
          {users.map((adminUser) => {
            const draft = userDrafts[adminUser.id] ?? {
              role: adminUser.role,
              status: adminUser.status,
              projectIds: [...adminUser.projectIds],
            };

            return (
              <AdminUserRow
                key={adminUser.id}
                adminUser={adminUser}
                draft={draft}
                projectOptions={projectOptions}
                t={t}
                onDraftChange={(nextDraft) =>
                  setUserDrafts((current) => ({
                    ...current,
                    [adminUser.id]: nextDraft,
                  }))
                }
                onResendInvite={async () => {
                  const updated = await resendAdminInvite(adminUser.id);
                  setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                }}
                onSave={async () => {
                  const roleChanged = draft.role !== adminUser.role;
                  const statusChanged = draft.status !== adminUser.status;
                  const projectsChanged = !areProjectIdsEqual(draft.projectIds, adminUser.projectIds);

                  let nextUser = adminUser;

                  if (roleChanged || statusChanged) {
                    nextUser = await updateAdminUser(adminUser.id, {
                      role: draft.role,
                      status: draft.status,
                    });
                  }

                  if (projectsChanged) {
                    nextUser = await setAdminUserProjects(adminUser.id, draft.projectIds);
                  }

                  setUsers((current) => current.map((item) => (item.id === nextUser.id ? nextUser : item)));
                  setUserDrafts((current) => ({
                    ...current,
                    [adminUser.id]: {
                      role: nextUser.role,
                      status: nextUser.status,
                      projectIds: [...nextUser.projectIds],
                    },
                  }));
                }}
              />
            );
          })}
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
