import type { UserRole, UserStatus } from "@/lib/types";

export type ProjectOption = {
  value: number | string;
  label: string;
};

export type UserDraft = {
  role: UserRole;
  status: UserStatus;
  projectIds: number[];
};
