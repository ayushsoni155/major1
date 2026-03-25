"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "@/utils/axios";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function EditProjectDialog({ project, open, onOpenChange, onSuccess }) {
  const [name, setName] = useState(project.project_name);
  const [description, setDescription] = useState(project.project_description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(project.project_name);
      setDescription(project.project_description || "");
    }
  }, [open, project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Project name cannot be empty."); return; }
    const payload = {};
    if (name.trim() !== project.project_name) payload.name = name.trim();
    if (description !== (project.project_description || "")) payload.description = description;
    if (Object.keys(payload).length === 0) { onOpenChange(false); return; }

    setIsSubmitting(true);
    const promise = axios.patch(`/projects/${project.project_id}`, payload)
      .then(() => { onSuccess(); onOpenChange(false); });
    toast.promise(promise, {
      loading: "Saving changes...",
      success: "Project updated!",
      error: "Failed to update project.",
    });
    promise.finally(() => setIsSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white shadow-2xl rounded-2xl p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Edit Project</DialogTitle>
            <DialogDescription className="text-zinc-400">Update the project name or description. To archive, use the card menu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2 mb-6">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-sm font-medium text-zinc-300">Name</Label>
              <Input
                id="edit-name" value={name} onChange={(e) => setName(e.target.value)}
                className="h-11 bg-white/[0.05] border-white/10 text-white focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all rounded-xl w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-sm font-medium text-zinc-300">
                Description <span className="text-zinc-600 text-xs">(optional)</span>
              </Label>
              <Textarea
                id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Short project description..."
                className="bg-white/[0.05] border-white/10 text-white focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 rounded-xl min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/25">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
