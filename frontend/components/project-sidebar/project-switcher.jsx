"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
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

  // Loading state → show skeleton
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="flex items-center gap-2 cursor-default"
          >
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 text-left gap-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-4 rounded-full ml-auto" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!projects || projects.length === 0) {
    return null;
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
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square h-8 w-8 items-center justify-center rounded-lg">
                  <span className="text-sm font-bold">
                    {activeProject.project_name?.charAt(0).toUpperCase() || "P"}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeProject.project_name}
                  </span>
                  <span className="truncate text-xs">
                    {activeProject.project_status}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-[14rem] rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Projects
              </DropdownMenuLabel>

              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.project_id}
                  onClick={() => handleSelect(project)}
                  className="gap-2 p-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border">
                    <span className="text-xs font-bold">
                      {project.project_name?.charAt(0).toUpperCase() || "P"}
                    </span>
                  </div>
                  {project.project_name}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setOpen(true)}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add project
                </div>
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
