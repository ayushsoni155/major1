"use client";
// SessionWatcher: silent — auth notifications are handled by login/signup pages directly.
import { useRef, useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function SessionWatcher() {
  const { user } = useAuth();
  const prevUser = useRef(undefined);

  useEffect(() => {
    // Only fire on explicit logout (user was logged in, now null)
    if (prevUser.current !== undefined && prevUser.current && !user) {
      // User logged out — silent, ProtectedRoute will redirect
    }
    prevUser.current = user;
  }, [user]);

  return null;
}
