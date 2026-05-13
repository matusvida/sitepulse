"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { AdminUser, UserRole, UserStatus } from "@/lib/types";
import { getUserDisplayName } from "@/lib/utils";
import { ProjectMultiSelect } from "./project-multi-select";
import type { ProjectOption, UserDraft } from "../types";
import { areProjectIdsEqual, summarizeSelectedProjects } from "../utils";

type AdminUserRowProps = {
  adminUser: AdminUser;
  draft: UserDraft;
  projectOptions: ProjectOption[];
  t: (key: string, params?: Record<string, string | number>) => string;
  onDraftChange: (nextDraft: UserDraft) => void;
  onResendInvite: () => Promise<void>;
  onSave: () => Promise<void>;
};

export function AdminUserRow({
  adminUser,
  draft,
  projectOptions,
  t,
  onDraftChange,
  onResendInvite,
  onSave,
}: AdminUserRowProps) {
  const projectsEditable = draft.status !== "DISABLED" && draft.role !== "ADMIN";
  const roleChanged = draft.role !== adminUser.role;
  const statusChanged = draft.status !== adminUser.status;
  const projectsChanged = !areProjectIdsEqual(draft.projectIds, adminUser.projectIds);
  const isDirty = roleChanged || statusChanged || projectsChanged;
  const profileSummary = `${draft.role} · ${draft.status} · ${
    adminUser.lastLoginAt
      ? t("adminPage.lastLogin", { date: new Date(adminUser.lastLoginAt).toLocaleString() })
      : t("adminPage.neverLoggedIn")
  }`;

  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.32)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 xl:max-w-[26rem]">
          <p className="truncate font-semibold text-foreground">{getUserDisplayName(adminUser)}</p>
          <p className="truncate text-sm text-muted">{adminUser.email}</p>
          <p className="truncate text-sm text-muted">{profileSummary}</p>
          {adminUser.invitationPreviewUrl ? (
            <p className="mt-1 truncate text-xs text-primary">{adminUser.invitationPreviewUrl}</p>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:items-center">
          <div className="min-w-[148px]">
            <Select
              id={`role-${adminUser.id}`}
              options={[
                { value: "USER", label: t("adminPage.roleUser") },
                { value: "ADMIN", label: t("adminPage.roleAdmin") },
              ]}
              value={draft.role}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  role: event.target.value as UserRole,
                })
              }
            />
          </div>
          <div className="min-w-[156px]">
            <Select
              id={`status-${adminUser.id}`}
              options={[
                { value: "INVITED", label: t("adminPage.statusInvited") },
                { value: "ACTIVE", label: t("adminPage.statusActive") },
                { value: "DISABLED", label: t("adminPage.statusDisabled") },
              ]}
              value={draft.status}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  status: event.target.value as UserStatus,
                })
              }
            />
          </div>
          <ProjectMultiSelect
            id={`projects-${adminUser.id}`}
            options={projectOptions}
            value={draft.projectIds}
            onChange={(nextValue) =>
              onDraftChange({
                ...draft,
                projectIds: nextValue,
              })
            }
            placeholder={t("adminPage.selectProjects")}
            selectedLabel={summarizeSelectedProjects(
              draft.projectIds,
              projectOptions,
              (count) => t("common.andMore", { count }),
              t("common.none"),
            )}
            disabled={!projectsEditable}
            widthClassName="min-w-[220px] xl:w-[220px]"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void onResendInvite()}>
              {t("adminPage.resendInvite")}
            </Button>
            <Button size="sm" disabled={!isDirty} onClick={() => void onSave()}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
