"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { fetchProjects } from "./api";
import { projects as mockProjects } from "./mock-data";
import type { Project } from "./types";

interface ProjectContextValue {
  currentProject: Project;
  setProjectId: (id: string) => void;
  allProjects: Project[];
  loading: boolean;
  refresh: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [projectId, setProjectId] = useState<string>(mockProjects[0].id);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      if (data.length > 0) {
        setProjects(data);
        setProjectId((prev) => {
          const stillExists = data.some((p) => p.id === prev);
          return stillExists ? prev : data[0].id;
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? projects[0],
    [projects, projectId],
  );

  const handleSetProjectId = useCallback((id: string) => {
    setProjectId(id);
  }, []);

  const value = useMemo(
    () => ({
      currentProject,
      setProjectId: handleSetProjectId,
      allProjects: projects,
      loading,
      refresh: load,
    }),
    [currentProject, handleSetProjectId, projects, loading, load],
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
