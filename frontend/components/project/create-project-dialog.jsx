// app/projects/components/create-project-dialog.tsx

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

/**
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }} props
 */
export function CreateProjectDialog({ open, onOpenChange, onSuccess }) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
        toast.error("Project name is required.");
        return;
    }
    setIsSubmitting(true);
    const promise = axios.post("/projects", { name })
      .then(() => {
        onSuccess(); // Re-fetches data via SWR
        onOpenChange(false); // Closes the dialog
        setName(""); // Resets the form field
      });

    toast.promise(promise, {
        loading: 'Creating project...',
        success: 'Project created successfully!',
        error: 'Failed to create project.',
    });
    
    promise.finally(() => {
        setIsSubmitting(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                    Give your new project a name to get started.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="create-project-name" className="text-right">
                        Name
                    </Label>
                    <Input
                        id="create-project-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="col-span-3"
                        placeholder="My Awesome Project"
                        disabled={isSubmitting}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
