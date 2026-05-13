"use client";

import { LanguageProvider } from "@/lib/language-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
