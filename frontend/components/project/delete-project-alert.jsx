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
        <AlertDialogContent className="glass border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)] text-white p-6 rounded-2xl w-[90vw] max-w-md">
            <AlertDialogHeader className="mb-4">
                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse" />
                    </span>
                    Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400 mt-2">
                    This action cannot be undone. This will permanently delete the <strong className="text-red-400 font-bold">{project.project_name}</strong> project and all of its associated data including databases and APIs.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-6">
                <p className="text-sm text-zinc-300 mb-3">To confirm, type the project ID: <strong className="text-red-400 font-mono tracking-tight bg-red-500/10 px-1 py-0.5 rounded">{project.project_id}</strong></p>
                <Input
                    type="text"
                    placeholder="Enter project ID to confirm"
                    value={confirmId}
                    onChange={(e) => setConfirmId(e.target.value)}
                    className="h-11 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all rounded-xl w-full"
                />
            </div>
            <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors">
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDelete}
                    disabled={confirmId !== project.project_id}
                    className="rounded-xl bg-red-600 hover:bg-red-500 text-white border-0 shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50"
                >
                    Delete Project
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}