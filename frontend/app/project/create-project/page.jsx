"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ProjectGrid } from "@/components/project/project-grid";
import { useProjects } from "@/providers/ProjectContext";
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";

export default function ProjectsPage() {
  const { projects, error, isLoading, mutate } = useProjects();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-6 max-w-7xl mx-auto w-full"
      >
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/[0.08]">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 bg-white/10 rounded-lg" />
            <Skeleton className="h-3 w-20 bg-white/10 rounded-lg" />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-56 bg-white/10 rounded-xl" />
            <Skeleton className="h-10 w-32 bg-white/10 rounded-xl" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, idx) => (
            <Skeleton
              key={idx}
              className="w-full h-44 bg-white/[0.04] rounded-2xl border border-white/[0.06]"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center glass-card rounded-2xl p-10 border border-red-500/20 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Failed to Load Projects</h2>
          <p className="text-sm text-zinc-500">
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
