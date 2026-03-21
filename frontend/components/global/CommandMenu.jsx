"use client";

import * as React from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

import {
  Database,
  BarChart3,
  Key,
  Users,
  FileText,
  Settings,
  Rocket,
} from "lucide-react";

export default function CommandMenu() {
  const [open, setOpen] = React.useState(false);

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const down = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      {/* Search Input Trigger (Now Responsive) */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center sm:justify-between w-10 h-10 sm:w-full sm:h-auto p-0 sm:px-3 sm:py-2 sm:max-w-xs md:max-w-sm rounded-md border text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        {/* Icon and Text Wrapper */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline truncate">Search...</span>
        </div>

        {/* Shortcut Hint */}
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span>CTRL+K</span>
        </kbd>
      </button>

      {/* Command Palette Dialog (Unchanged) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 shadow-lg border-none max-w-lg w-[90%] sm:w-full">
          <DialogTitle className="sr-only">Command Menu</DialogTitle>
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search GoRapidBase features..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Quick Access">
                <CommandItem>
                  <Database className="mr-2 h-4 w-4" />
                  <span>Schema Builder</span>
                </CommandItem>
                <CommandItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Dashboards</span>
                </CommandItem>
                <CommandItem>
                  <Key className="mr-2 h-4 w-4" />
                  <span>API Keys</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Resources">
                <CommandItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Documentation</span>
                  <CommandShortcut>⌘D</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Team Management</span>
                  <CommandShortcut>⌘T</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Rocket className="mr-2 h-4 w-4" />
                  <span>Roadmap</span>
                  <CommandShortcut>⌘R</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}