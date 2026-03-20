"use client";

import { useState } from "react";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";
import { ProjectProvider } from "@/lib/project-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProjectProvider>
      <div className="flex h-screen flex-col">
        <TopNav onMenuToggle={() => setSidebarOpen((p) => !p)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </ProjectProvider>
  );
}
