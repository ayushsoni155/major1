"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "@/utils/axios";
import { useState, useEffect } from "react";

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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Make changes to your project here. Click save when you&apos;re done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value)}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
