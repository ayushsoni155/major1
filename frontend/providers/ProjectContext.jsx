"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import axios from "@/utils/axios";

const ProjectContext = createContext();

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

export const ProjectProvider = ({ children }) => {
  // SWR for fetching all projects
  const { data: projects, error, isLoading, mutate } = useSWR("/projects/", fetcher);

  const [selectedProject, setSelectedProject] = useState(null);
  const pathname = usePathname();

  // Extract projectId from /project/[id]/... URLs
  const getProjectIdFromUrl = (url) => {
    const match = url.match(/\/project\/([^\/]+)/);
    return match ? match[1] : null;
  };

  // Effect to auto-load project from URL or session storage
  useEffect(() => {
    const urlProjectId = getProjectIdFromUrl(pathname);
    const storedProjectId = sessionStorage.getItem("selectedProjectId");
    
    // Prefer URL ID first, then fallback to session storage
    if (urlProjectId && (!selectedProject || selectedProject.project_id !== urlProjectId)) {
        selectProject(urlProjectId);
    } else if (storedProjectId && !selectedProject && !urlProjectId) {
      selectProject(storedProjectId);
    }
  }, [pathname]);

  const selectProject = async (projectId) => {
    try {
      const res = await axios.get(`/projects/${projectId}`);
      const projectData = res.data.data;
      setSelectedProject(projectData);
      sessionStorage.setItem("selectedProjectId", projectData.project_id); // Save ID to session storage
    } catch (err) {
      console.error("Failed to fetch project details", err);
      setSelectedProject(null);
      sessionStorage.removeItem("selectedProjectId"); // Clear on error
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        error,
        isLoading,
        mutate,
        selectedProject,
        selectProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};