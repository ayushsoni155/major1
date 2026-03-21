"use client";

import React from "react";
import Breadcrump from "@/components/global/Breadcrumb";
import CommandMenu from "../global/CommandMenu";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

function HeaderCreateProject() {
  return (
    <header className="flex h-12 shrink-0 items-center bg-background px-4">
      <div className="flex w-full items-center justify-between gap-3">
        {/* Left Section: Sidebar + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Breadcrumb (responsive, truncate on small) */}
          <div className="min-w-0 flex-1">
            <Breadcrump className="truncate text-sm sm:text-base" />
          </div>
        </div>

        {/* Right Section: Search + Theme */}
        <div className="flex items-center gap-2">
          {/* Search bar responsive */}
          <div className=" md:w-40 lg:w-64">
            <CommandMenu />
          </div>
        <ThemeToggleButton variant="circle-blur" start="top-right" />
        </div>
      </div>
    </header>
  );
}

export default HeaderCreateProject;
