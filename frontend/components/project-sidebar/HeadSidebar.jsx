"use client";

import React from "react";
import Breadcrumb from "@/components/global/Breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import CommandMenu from "../global/CommandMenu";

function HeadSidebar() {
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center bg-[#0d0d14]/90 backdrop-blur-xl border-b border-white/[0.06] px-4">
      <div className="flex w-full items-center justify-between gap-3">
        {/* Left Section: Sidebar Trigger + Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" />
          <Separator
            orientation="vertical"
            className="hidden sm:block h-4 bg-white/10"
          />
          <div className="min-w-0 flex-1">
            <Breadcrumb className="truncate" />
          </div>
        </div>

        {/* Right Section: Command Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="md:w-40 lg:w-60">
            <CommandMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeadSidebar;