"use client";

import { useState } from "react";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";
import { ProjectProvider } from "@/lib/project-context";
import { LanguageProvider } from "@/lib/language-context";

function ShellFrame({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(29,95,209,0.08),transparent_22%)]" />
      <TopNav onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <div className="relative flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1">
          <div className="mx-auto flex min-h-full w-full max-w-[1680px] flex-col gap-5 px-4 py-4 lg:px-5 lg:py-5 xl:gap-6 xl:px-6 xl:py-6">
            <div className="flex-1">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <LanguageProvider>
        <ShellFrame>{children}</ShellFrame>
      </LanguageProvider>
    </ProjectProvider>
  );
}
