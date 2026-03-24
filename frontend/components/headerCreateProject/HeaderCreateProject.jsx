"use client";

import React from "react";
import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import CommandMenu from "../global/CommandMenu";

function HeaderCreateProject() {
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center bg-[#0d0d14]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 lg:px-6">
      <div className="flex w-full items-center justify-between gap-3">
        {/* Left: Logo + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)]">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-black tracking-tight text-white">RapidBase</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-violet-300 font-semibold">All Projects</span>
        </div>

        {/* Right: Command Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 md:w-40 lg:w-60">
            <CommandMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderCreateProject;
