"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageSkeleton />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.replace("/signin"), 800);
    } catch {
      setError("Reset link is invalid or expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResetPasswordShell title="Choose a new password">
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Input
          id="confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? "Saving..." : "Reset password"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {done ? <p className="mt-4 text-sm text-foreground">Password updated. Redirecting to sign in...</p> : null}
      <p className="mt-6 text-sm text-muted">
        <Link href="/signin" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </ResetPasswordShell>
  );
}

function ResetPasswordPageSkeleton() {
  return (
    <ResetPasswordShell title=" ">
      <div className="mt-6 space-y-4" aria-hidden="true">
        <div className="h-16 rounded-2xl bg-accent/60" />
        <div className="h-16 rounded-2xl bg-accent/60" />
        <div className="h-11 rounded-xl bg-accent/70" />
      </div>
    </ResetPasswordShell>
  );
}

function ResetPasswordShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/86 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)]">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
    </div>
  );
}
