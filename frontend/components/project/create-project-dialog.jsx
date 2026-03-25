"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "@/utils/axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }} props
 */
export function CreateProjectDialog({ open, onOpenChange, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    setIsSubmitting(true);
    const promise = axios
      .post("/projects/", {
        name: name.trim(),
        description: description.trim() || undefined,
      })
      .then((res) => {
        onSuccess();
        onOpenChange(false);
        setName("");
        setDescription("");
        const projectId = res.data?.data?.project_id;
        if (projectId) router.push(`/project/${projectId}/dashboard`);
      });

    toast.promise(promise, {
      loading: "Creating project...",
      success: "Project created successfully!",
      error: "Failed to create project.",
    });

    promise.finally(() => setIsSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] glass border-white/10 text-white shadow-2xl rounded-2xl p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Create New Project
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Give your project a name and an optional description.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 mb-6">
            {/* Project Name */}
            <div className="grid gap-2">
              <Label
                htmlFor="create-project-name"
                className="text-sm font-medium text-zinc-300"
              >
                Project Name
              </Label>
              <Input
                id="create-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all rounded-xl w-full"
                placeholder="e.g. Acme E-commerce"
                disabled={isSubmitting}
                maxLength={80}
              />
            </div>

            {/* Description – optional */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="create-project-desc"
                  className="text-sm font-medium text-zinc-300"
                >
                  Description
                </Label>
                <span className="text-[11px] text-zinc-600">
                  Optional · {description.length}/200
                </span>
              </div>
              <textarea
                id="create-project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={200}
                rows={3}
                placeholder="What is this project about?"
                className="w-full px-3 py-2.5 text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-zinc-600 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 focus:outline-none transition-all rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/25 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
