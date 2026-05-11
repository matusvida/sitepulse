"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { consumeInvitation } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

export default function InvitationPage() {
  return (
    <Suspense fallback={<InvitationPageSkeleton />}>
      <InvitationPageContent />
    </Suspense>
  );
}

function InvitationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t("invitePage.passwordMismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await consumeInvitation(token, { firstName, lastName, password });
      router.replace("/dashboard");
    } catch {
      setError(t("invitePage.invalidOrExpired"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <InvitePageShell
      title={t("invitePage.title")}
      description={t("invitePage.description")}
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="first-name"
            label={t("invitePage.firstName")}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
          />
          <Input
            id="last-name"
            label={t("invitePage.lastName")}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
          />
        </div>
        <Input
          id="password"
          label={t("invitePage.password")}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Input
          id="confirm-password"
          label={t("invitePage.confirmPassword")}
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? t("invitePage.saving") : t("invitePage.activate")}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </InvitePageShell>
  );
}

function InvitationPageSkeleton() {
  return (
    <InvitePageShell title=" " description=" ">
      <div className="mt-6 space-y-4" aria-hidden="true">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-16 rounded-2xl bg-accent/60" />
          <div className="h-16 rounded-2xl bg-accent/60" />
        </div>
        <div className="h-16 rounded-2xl bg-accent/60" />
        <div className="h-16 rounded-2xl bg-accent/60" />
        <div className="h-11 rounded-xl bg-accent/70" />
      </div>
    </InvitePageShell>
  );
}

function InvitePageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/86 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)]">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
        {children}
      </div>
    </div>
  );
}
