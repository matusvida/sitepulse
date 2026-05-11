"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/86 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)]">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-muted">Enter your email address to receive a reset link.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input id="email" label="Email" type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        {submitted ? <p className="mt-4 text-sm text-foreground">If the email exists, a reset link has been sent.</p> : null}
        <p className="mt-6 text-sm text-muted">
          <Link href="/signin" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
