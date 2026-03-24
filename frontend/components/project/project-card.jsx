/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Pencil, Plus, Database, ArrowRight, Archive, ArchiveRestore } from "lucide-react";
import { EditProjectDialog } from "./edit-project-dialog";
import { DeleteProjectAlert } from "./delete-project-alert";
import { CreateProjectDialog } from "./create-project-dialog";
import { useRouter } from 'nextjs-toploader/app';
import { useProjects } from "@/providers/ProjectContext";

export function ProjectCard({ project, mutate }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();
  const { selectProject } = useProjects();

  const isArchived = project.project_status === "archived";

  const handleSelectClick = async () => {
    await selectProject(project.project_id);
    router.push(`/project/${project.project_id}/dashboard`);
  };

  const handleArchiveToggle = async () => {
    try {
      const { default: api } = await import("@/utils/axios");
      const { toast } = await import("sonner");
      await api.put(`/projects/${project.project_id}`, {
        status: isArchived ? "active" : "archived"
      });
      toast.success(isArchived ? "Project restored to active" : "Project archived");
      mutate();
    } catch (e) {
      const { toast } = await import("sonner");
      toast.error("Failed to update project status");
    }
  };

  return (
    <>
      <div className="glass-card flex flex-col justify-between p-5 rounded-2xl min-h-[180px] h-full group relative overflow-hidden border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300">
        {/* Hover glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-violet-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

        {/* Top row */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-inner flex-shrink-0">
              <Database className="w-4 h-4 text-violet-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white leading-tight truncate">
                {project.project_name}
              </h3>
              <p className="font-mono text-[10px] text-zinc-600 mt-0.5 truncate">
                {project.schema_name}
              </p>
            </div>
          </div>

          {/* More options */}
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl flex-shrink-0 opacity-60 group-hover:opacity-100 transition-all"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#0d0d14] border border-white/10 rounded-xl shadow-2xl shadow-black/40 min-w-[10rem] py-1"
              >
                <DropdownMenuItem
                  onSelect={() => setIsEditDialogOpen(true)}
                  className="mx-1 rounded-lg gap-2 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer text-sm"
                >
                  <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleArchiveToggle}
                  className="mx-1 rounded-lg gap-2 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer text-sm"
                >
                  {isArchived
                    ? <ArchiveRestore className="h-3.5 w-3.5 text-emerald-400" />
                    : <Archive className="h-3.5 w-3.5 text-zinc-400" />}
                  {isArchived ? "Restore project" : "Archive project"}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06] my-1 mx-1" />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="mx-1 rounded-lg gap-2 px-2.5 py-2 text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-sm">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete project
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <DeleteProjectAlert project={project} onSuccess={() => mutate()} />
          </AlertDialog>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-auto relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            <span className="text-[11px] font-medium text-zinc-400 capitalize">
              {project.project_status}
            </span>
          </div>
          <Button
            onClick={handleSelectClick}
            size="sm"
            className="h-8 px-3 text-xs bg-white/[0.07] hover:bg-violet-600 text-white border border-white/[0.08] hover:border-violet-500 rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-[0_0_16px_rgba(139,92,246,0.35)] gap-1.5"
          >
            Open <ArrowRight className="w-3 h-3 opacity-80" />
          </Button>
        </div>
      </div>
      <EditProjectDialog
        project={project}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => mutate()}
      />
    </>
  );
}

// New Project Card
export function NewProjectCard({ onSuccess }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center p-5 rounded-2xl min-h-[180px] h-full border-2 border-dashed border-white/[0.1] hover:border-violet-500/50 bg-white/[0.01] hover:bg-violet-500/[0.04] transition-all duration-300 group w-full"
      >
        <div className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:border-violet-500/30 transition-all duration-300">
          <Plus className="h-5 w-5 text-zinc-500 group-hover:text-violet-400 transition-colors" />
        </div>
        <span className="text-sm font-semibold text-zinc-500 group-hover:text-zinc-200 transition-colors">
          New Project
        </span>
        <span className="text-[11px] text-zinc-700 mt-1 group-hover:text-zinc-500 transition-colors">
          Click to create
        </span>
      </button>
      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
