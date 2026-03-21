/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Trash2, Pencil, Plus } from "lucide-react";
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
  await selectProject(project.project_id); // use project_id instead of id
  router.push(`/project/${project.project_id}/dashboard`);
};


  return (
    <>
      <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">{project.project_name}</CardTitle>
            <CardDescription className="font-mono pt-1 text-xs">
              {project.schema_name}
            </CardDescription>
          </div>
          <AlertDialog>
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-500 focus:text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
            <DeleteProjectAlert project={project} onSuccess={() => mutate()} />
          </AlertDialog>
        </CardHeader>
        <CardContent>
          <Badge
            variant={project.project_status === "active" ? "default" : "secondary"}
          >
            {project.project_status}
          </Badge>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleSelectClick}>
            Select
          </Button>
        </CardFooter>
      </Card>
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
        className="relative flex w-full h-full min-h-[150px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted/20 p-6 text-center hover:border-primary hover:bg-muted/50 transition-colors"
      >
        <Plus className="h-8 w-8 text-muted-foreground" />
        <span className="mt-2 block text-sm font-semibold">New Project</span>
      </button>
      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
