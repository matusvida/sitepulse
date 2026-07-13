"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";
import { ProjectProvider } from "@/lib/project-context";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useProject } from "@/lib/project-context";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ShellFrame({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();
  const { allProjects } = useProject();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl border border-white/80 bg-white/88 px-6 py-5 text-sm text-muted shadow-sm">
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(29,95,209,0.08),transparent_22%)]" />
      <TopNav onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <div className="relative flex min-w-0 flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto flex min-h-full min-w-0 w-full max-w-[1680px] flex-col gap-5 px-4 py-4 lg:px-5 lg:py-5 xl:gap-6 xl:px-6 xl:py-6">
            <div className="min-w-0 flex-1">
              {allProjects.length === 0 ? (
                <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
                  <Card className="w-full max-w-xl">
                    <CardHeader>
                      <CardTitle>No Project Access</CardTitle>
                      <CardDescription>
                        Your account is active, but no projects are assigned yet. Ask an administrator to grant access.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProjectProvider>
        <LanguageProvider>
          <ShellFrame>{children}</ShellFrame>
        </LanguageProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}
