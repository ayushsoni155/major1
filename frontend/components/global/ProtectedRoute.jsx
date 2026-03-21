"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'nextjs-toploader/app';
import { useAuth } from "@/providers/AuthContext";
import { toast } from "sonner";

export default function ProtectedRoute({ children, allowedRoutes = [] }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const currentPath = window.location.pathname;
    const isAllowed = allowedRoutes.includes(currentPath);

    if (!user && !isAllowed) {
      toast.warning("You must be logged in to access this page");
      router.replace("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;
  return children;
}
