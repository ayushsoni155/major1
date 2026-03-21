// src/providers/TableContext.jsx
"use client";

import { createContext, useContext, useEffect } from "react";
import useSWR from "swr";
import axios from "@/utils/axios";
import { useProjects } from "@/providers/ProjectContext";

const TableContext = createContext();

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

export const TableProvider = ({ children }) => {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.project_id;

  // useSWR key is conditional. It will only fetch if projectId exists.
  const { data: tables, error, isLoading, mutate } = useSWR(
    projectId ? `/projects/${projectId}/tables` : null,
    fetcher
  );

  return (
    <TableContext.Provider
      value={{
        tables,
        error,
        isLoading,
        mutate, // Expose mutate for manual re-fetching
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTables = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTables must be used within a TableProvider");
  }
  return context;
};