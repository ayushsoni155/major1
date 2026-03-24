"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Search, X } from "lucide-react";
import { ProfilePopup } from "@/components/global/ProfilePopup";
import { NotificationBell } from "@/components/global/NotificationBell";
import { useAuth } from "@/providers/AuthContext";
import { Input } from "@/components/ui/input";

function HeaderCreateProject({ onSearchChange }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams?.get("q") || "");

  const handleSearch = (val) => {
    setSearch(val);
    onSearchChange?.(val);
    // update URL param without full navigation
    const params = new URLSearchParams(window.location.search);
    if (val) params.set("q", val);
    else params.delete("q");
    window.history.replaceState({}, "", `${window.location.pathname}${params.size ? "?" + params.toString() : ""}`);
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center bg-[#0d0d14]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 lg:px-6">
      <div className="flex w-full items-center justify-between gap-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)]">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-black tracking-tight text-white">RapidBase</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-violet-300 font-semibold hidden sm:block">All Projects</span>
        </div>

        {/* Center: Search */}
        <div className="relative flex-1 max-w-xs mx-4 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 text-sm w-full"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Notification bell + Profile */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {user && <NotificationBell />}
          <ProfilePopup />
        </div>
      </div>
    </header>
  );
}

export default HeaderCreateProject;
