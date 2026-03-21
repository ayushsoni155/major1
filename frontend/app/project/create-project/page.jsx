"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ProjectGrid } from "@/components/project/project-grid";
import { useProjects } from "@/providers/ProjectContext";

export default function ProjectsPage() {
  const { projects, error, isLoading, mutate } = useProjects();
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Skeleton className="h-8 w-32 sm:w-48" />
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-64" />
            <Skeleton className="h-10 w-full sm:w-48" />
          </div>
        </div>

        {/* Projects Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton
              key={idx}
              className="w-full h-40 sm:h-48 rounded-md"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4 sm:p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">
            Failed to Load Projects
          </h2>
          <p className="text-muted-foreground mt-2">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <ProjectGrid projects={projects || []} mutate={mutate} />
    </div>
  );
}
