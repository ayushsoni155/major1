"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronsUpDown, Plus, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useProjects } from "@/providers/ProjectContext";
import { useRouter } from 'nextjs-toploader/app';
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";

export function ProjectSwitcher() {
  const { isMobile } = useSidebar();
  const { projects, selectedProject, selectProject, isLoading, mutate } = useProjects();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Loading state
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="flex items-center gap-2 cursor-default">
            <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
            <div className="grid flex-1 text-left gap-1">
              <Skeleton className="h-4 w-24 rounded bg-white/10" />
              <Skeleton className="h-3 w-16 rounded bg-white/10" />
            </div>
            <Skeleton className="h-4 w-4 rounded-full ml-auto bg-white/10" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)]">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-white">RapidBase</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const activeProject = selectedProject || projects[0];

  const handleSelect = async (project) => {
    await selectProject(project.project_id);
    router.push(`/project/${project.project_id}/dashboard`);
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-white/[0.08] hover:bg-white/[0.06] text-white transition-colors rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)] flex-shrink-0">
                  <span className="text-sm font-black text-white">
                    {activeProject.project_name?.charAt(0).toUpperCase() || "P"}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-white">
                    {activeProject.project_name}
                  </span>
                  <span className="truncate text-xs text-zinc-500 capitalize">
                    {activeProject.project_status}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 text-zinc-500 flex-shrink-0" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-[14rem] bg-[#0d0d14] border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-1"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={6}
            >
              <DropdownMenuLabel className="text-zinc-600 text-[10px] font-semibold uppercase tracking-widest px-3 py-2">
                Projects
              </DropdownMenuLabel>

              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.project_id}
                  onClick={() => handleSelect(project)}
                  className="mx-1 rounded-lg gap-2.5 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/20 flex-shrink-0">
                    <span className="text-xs font-bold text-violet-300">
                      {project.project_name?.charAt(0).toUpperCase() || "P"}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{project.project_name}</span>
                    <span className="text-[10px] text-zinc-600 capitalize">{project.project_status}</span>
                  </div>
                  {project.project_id === activeProject.project_id && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="bg-white/[0.06] my-1 mx-1" />
              <DropdownMenuItem
                className="mx-1 rounded-lg gap-2.5 px-2.5 py-2 text-zinc-400 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer transition-colors"
                onClick={() => setOpen(true)}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 border border-white/10 flex-shrink-0">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">New project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => mutate()}
      />
    </>
  );
}
