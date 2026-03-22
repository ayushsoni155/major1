"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "@/utils/axios";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function EditProjectDialog({ project, open, onOpenChange, onSuccess }) {
  const [name, setName] = useState(project.project_name);
  const [status, setStatus] = useState(project.project_status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form state when the dialog is opened with a new project
  useEffect(() => {
    if (open) {
      setName(project.project_name);
      setStatus(project.project_status);
    }
  }, [open, project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
        toast.error("Project name cannot be empty.");
        return;
    }

    // Construct a payload with only the changed fields
    const payload = {};
    if (name !== project.project_name) {
        payload.name = name;
    }
    if (status !== project.project_status) {
        payload.status = status;
    }

    // If nothing changed, just close the dialog
    if (Object.keys(payload).length === 0) {
        onOpenChange(false);
        return;
    }

    setIsSubmitting(true);
    const promise = axios.patch(`/projects/${project.project_id}`, payload)
      .then(() => {
        onSuccess();
        onOpenChange(false);
      });

    toast.promise(promise, {
      loading: 'Saving changes...',
      success: 'Project updated successfully!',
      error: 'Failed to update project.',
    });
    promise.finally(() => setIsSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white shadow-2xl rounded-2xl p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Edit Project</DialogTitle>
            <DialogDescription className="text-zinc-400">Make changes to your project here. Click save when you&apos;re done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2 mb-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium text-zinc-300">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="h-11 bg-white/[0.05] border-white/10 text-white focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all rounded-xl w-full" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-sm font-medium text-zinc-300">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value)}>
                <SelectTrigger className="h-11 bg-white/[0.05] border border-white/10 text-white rounded-xl focus:ring-violet-500/30 w-full focus:ring-offset-0 focus:ring-offset-transparent">
                    <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10 text-white rounded-xl">
                    <SelectItem value="active" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg">Active</SelectItem>
                    <SelectItem value="archived" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg">Archived</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/25 transition-all duration-200"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
