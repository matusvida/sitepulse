export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateStr: string): string {
  const now = new Date("2026-02-26T10:00:00Z");
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface UserIdentityLike {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export function getUserDisplayName(user: UserIdentityLike | null | undefined): string {
  const fullName = [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(" ");
  if (fullName) return fullName;

  const emailLocalPart = user?.email?.split("@")[0]?.trim();
  if (emailLocalPart) return emailLocalPart;

  return "Account";
}

export function getUserInitials(user: UserIdentityLike | null | undefined): string {
  const initials = [user?.firstName?.trim(), user?.lastName?.trim()]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.charAt(0).toUpperCase())
    .join("");

  if (initials) return initials.slice(0, 2);

  const emailInitial = user?.email?.trim()?.[0]?.toUpperCase();
  return emailInitial || "A";
}
