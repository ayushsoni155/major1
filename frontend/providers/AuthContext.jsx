"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "@/utils/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session from cookie (server validates the HttpOnly cookie)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  /**
   * Step 1 of signup: registers user, triggers OTP email.
   * Returns { email } so the UI can show the OTP step.
   */
  const signUpWithEmail = async (email, password, name) => {
    const res = await api.post("/auth/register", { email, password, name });
    return res.data;
  };

  /**
   * Step 2 of signup: verifies OTP.
   * On success, server sets HttpOnly cookie — user is logged in.
   */
  const verifyOtp = async (email, otp) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    setUser(res.data.data?.user || null);
    return res.data;
  };

  /**
   * Resend OTP to email.
   */
  const resendOtp = async (email) => {
    const res = await api.post("/auth/resend-otp", { email });
    return res.data;
  };

  /**
   * Login with email/password — server sets HttpOnly cookie.
   */
  const signInWithEmail = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.data?.user || null);
    return res.data;
  };

  /**
   * Logout — server clears the HttpOnly cookie.
   */
  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors — clear local state regardless
    }
    setUser(null);
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        verifyOtp,
        resendOtp,
        signOut,
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
