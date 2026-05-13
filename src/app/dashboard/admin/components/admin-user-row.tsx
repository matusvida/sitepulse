"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { AdminUser, UserRole, UserStatus } from "@/lib/types";
import { getUserDisplayName } from "@/lib/utils";
import type { ProjectOption, UserDraft } from "../types";
import { areProjectIdsEqual, summarizeSelectedProjects } from "../utils";
import { ProjectMultiSelect } from "./project-multi-select";

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
      <div className="space-y-4">
        <div className="min-w-0 2xl:max-w-[26rem]">
          <p className="truncate font-semibold text-foreground">{getUserDisplayName(adminUser)}</p>
          <p className="truncate text-sm text-muted">{adminUser.email}</p>
          <p className="truncate text-sm text-muted">{profileSummary}</p>
          {adminUser.invitationPreviewUrl ? (
            <p className="mt-1 truncate text-xs text-primary">{adminUser.invitationPreviewUrl}</p>
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(148px,168px)_minmax(156px,176px)_minmax(0,260px)_auto] 2xl:items-center">
          <div className="min-w-0">
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

          <div className="min-w-0">
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

          <div className="min-w-0 lg:col-span-2 2xl:col-span-1">
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
              widthClassName="w-full 2xl:w-[260px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:col-span-2 2xl:col-span-1 2xl:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => void onResendInvite()}
            >
              {t("adminPage.resendInvite")}
            </Button>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              disabled={!isDirty}
              onClick={() => void onSave()}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
