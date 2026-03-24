"use client";

import { useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useAuth } from "@/providers/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, allowedRoutes = [] }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const currentPath = window.location.pathname;
    const isAllowed = allowedRoutes.some((route) =>
      currentPath === route || currentPath.startsWith(route + "/")
    );
    if (!user && !isAllowed) {
      router.replace("/login");
    }
  }, [user, loading, router, allowedRoutes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#08080f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <p className="text-sm text-zinc-500">Authenticating...</p>
        </div>
      </div>
    );
  }

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const isAllowed = allowedRoutes.some((route) =>
    currentPath === route || currentPath.startsWith(route + "/")
  );

  if (!user && !isAllowed) return null;
  return children;
}
