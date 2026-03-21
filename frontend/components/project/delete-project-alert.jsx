"use client";
import { useState } from "react";
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import axios from "@/utils/axios";
import { toast } from "sonner";

export function DeleteProjectAlert({ project, onSuccess }) {
    const [confirmId, setConfirmId] = useState("");

    const handleDelete = async () => {
        if (confirmId !== project.project_id) {
            toast.error("The entered ID does not match.");
            return;
        }
        
        const promise = axios.delete(`/projects/${project.project_id}`)
            .then(() => {
                onSuccess();
                return 'Project deleted!'; // Return a value for the success toast
            })
            .catch((error) => {
                // Return a rejected promise with a specific error message
                const errorMessage = error.response?.data?.message || error.message || "Failed to delete project.";
                return Promise.reject(new Error(errorMessage));
            });
        
        toast.promise(promise, {
            loading: 'Deleting project...',
            success: (data) => data, // Use the resolved value from the promise
            error: (err) => err.message, // Use the error message from the rejected promise
        });
    };

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the <strong className="text-destructive">{project.project_name}</strong> project and all of its associated data. To confirm, please type the project's ID in the input field below.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="p-4">
                Project ID: <strong className="text-destructive">{project.project_id}</strong>
                <Input
                    type="text"
                    placeholder="Enter project ID to confirm"
                    value={confirmId}
                    onChange={(e) => setConfirmId(e.target.value)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDelete}
                    disabled={confirmId !== project.project_id}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}