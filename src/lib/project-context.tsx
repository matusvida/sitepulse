"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { projects } from "./mock-data";
import type { Project } from "./types";

interface ProjectContextValue {
  currentProject: Project;
  setProjectId: (id: string) => void;
  allProjects: Project[];
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectId] = useState(projects[0].id);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? projects[0],
    [projectId]
  );

  const handleSetProjectId = useCallback((id: string) => {
    setProjectId(id);
  }, []);

  const value = useMemo(
    () => ({
      currentProject,
      setProjectId: handleSetProjectId,
      allProjects: projects,
    }),
    [currentProject, handleSetProjectId]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within <ProjectProvider>");
  return ctx;
}
