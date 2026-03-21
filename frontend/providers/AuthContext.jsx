"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "@/utils/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.data);
      } catch (err) {
        console.error("Failed to load user:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const signInWithEmail = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { user: userData, access_token, refresh_token } = res.data.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setUser(userData);
    return res.data;
  };

  const signUpWithEmail = async (email, password, name) => {
    const res = await api.post("/auth/register", { email, password, name });
    const { user: userData, access_token, refresh_token } = res.data.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setUser(userData);
    return res.data;
  };

  const signOut = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("selectedProjectId");
    setUser(null);
  };

  const refreshAccessToken = async () => {
    try {
      const refresh_token = localStorage.getItem("refresh_token");
      if (!refresh_token) throw new Error("No refresh token");
      const res = await api.post("/auth/refresh", { refresh_token });
      localStorage.setItem("access_token", res.data.data.access_token);
      localStorage.setItem("refresh_token", res.data.data.refresh_token);
      return res.data.data.access_token;
    } catch (err) {
      signOut();
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
