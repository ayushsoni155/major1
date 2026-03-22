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
import { MoreVertical, Trash2, Pencil, Plus, Database, ArrowRight } from "lucide-react";
import { EditProjectDialog } from "./edit-project-dialog";
import { DeleteProjectAlert } from "./delete-project-alert";
import { CreateProjectDialog } from "./create-project-dialog";
import { useRouter } from 'nextjs-toploader/app';
import { useProjects } from "@/providers/ProjectContext";

export function ProjectCard({ project, mutate }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();
  const { selectProject } = useProjects();
  
  const handleSelectClick = async () => {
    await selectProject(project.project_id);
    router.push(`/project/${project.project_id}/dashboard`);
  };

  return (
    <>
      <div className="glass-card flex flex-col justify-between p-6 rounded-[2rem] h-full group relative overflow-hidden">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{project.project_name}</h3>
              <p className="font-mono text-xs text-zinc-500 mt-0.5">{project.schema_name}</p>
            </div>
          </div>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-white/10 rounded-xl">
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" /> Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-400 focus:text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete project
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <DeleteProjectAlert project={project} onSuccess={() => mutate()} />
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between mt-auto relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-xs font-medium text-zinc-300 capitalize">{project.project_status}</span>
          </div>
          <Button 
            onClick={handleSelectClick}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl h-9 px-4 shadow-sm transition-all group-hover:bg-violet-600 group-hover:border-violet-500 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            Open <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
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

// A special card for creating a new project
export function NewProjectCard({ onSuccess }) {
  const [open, setOpen] = useState(false); 
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-card flex flex-col items-center justify-center p-6 rounded-[2rem] h-full min-h-[160px] border-2 border-dashed border-white/20 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300 group"
      >
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:border-violet-500/30 transition-all duration-300">
          <Plus className="h-6 w-6 text-zinc-400 group-hover:text-violet-400" />
        </div>
        <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Create Project</span>
      </button>
      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
