"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompareRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/progress/compare");
  }, [router]);
  return <div className="py-12 text-center text-muted">Redirecting…</div>;
}
