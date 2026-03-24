"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { useAuth } from "@/providers/AuthContext";
import api from "@/utils/axios";

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/projects/notifications/unread-count");
      setCount(res.data?.data?.count || 0);
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  if (!user) return null;

  return (
    <button
      onClick={() => router.push("/notifications")}
      className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors"
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
