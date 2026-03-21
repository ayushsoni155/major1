"use client";
import { useAuth } from "./AuthContext";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function SessionWatcher() {
  const { user } = useAuth();
  const prevUser = useRef(null);

  useEffect(() => {
    // Skip on first render until we know loading is done
    if (prevUser.current === null && user === null) return;

    if (!prevUser.current && user) {
      toast.success("🎉 You are logged in!");
    } else if (prevUser.current && !user) {
      toast.info("👋 You are logged out.");
    }

    prevUser.current = user; // update previous state
  }, [user]);

  return null;
}
