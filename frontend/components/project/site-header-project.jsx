"use client";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

import { DynamicBreadcrumb } from "@/components/sidebar/DynamicBreadcrumb"; // Adjust path if needed
import { CommandPalette } from "@/components/sidebar/CommandPalette";

export function SiteHeaderProject() {
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b backdrop-blur-lg">
      <div className="flex h-12 w-full items-center gap-2 px-4">
        <DynamicBreadcrumb />
        <div className="ml-auto flex items-center gap-2">
          <CommandPalette />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
