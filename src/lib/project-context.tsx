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
import type { Project } from "./types";

const EMPTY_PROJECT: Project = {
  id: "",
  name: "No project access",
  location: "",
  coveragePercent: 0,
  cameraCount: 0,
  lastSnapshotAt: new Date(0).toISOString(),
};

interface ProjectContextValue {
  currentProject: Project;
  setProjectId: (id: string) => void;
  allProjects: Project[];
  loading: boolean;
  refresh: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
      setProjectId((prev) => {
        if (data.length === 0) return "";
        const stillExists = data.some((p) => p.id === prev);
        return stillExists ? prev : data[0].id;
      });
    } catch {
      setProjects([]);
      setProjectId("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? projects[0] ?? EMPTY_PROJECT,
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
