"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import {
  Database, BarChart3, Key, FileText, Settings,
  Table, Workflow, ClipboardList, LayoutDashboard, FileCode2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const QUICK_ACCESS = [
  { label: "Dashboard",           icon: LayoutDashboard, suffix: "dashboard", color: "text-violet-400" },
  { label: "Tables",              icon: Table,           suffix: "tables",    color: "text-indigo-400" },
  { label: "SQL Editor",          icon: FileCode2,       suffix: "sql-editor",color: "text-cyan-400" },
  { label: "Analytics",           icon: BarChart3,       suffix: "analytics", color: "text-emerald-400" },
  { label: "Schema Visualization",icon: Workflow,        suffix: "schema-visualization", color: "text-yellow-400" },
  { label: "API Keys",            icon: Key,             suffix: "api-keys",  color: "text-pink-400" },
  { label: "Audit Log",           icon: ClipboardList,   suffix: "audit-log", color: "text-zinc-400" },
];

const RESOURCES = [
  { label: "Documentation", icon: FileText, href: "#", shortcut: "⌘D" },
  { label: "Settings",      icon: Settings, href: "#", shortcut: "⌘," },
];

export default function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const params = useParams();
  const router = useRouter();
  const projectID = params?.projectID;

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

  const navigate = (suffix) => {
    setOpen(false);
    if (projectID) {
      router.push(`/project/${projectID}/${suffix}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center sm:justify-between w-9 h-9 sm:w-full sm:h-9 p-0 sm:px-3 sm:py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-all duration-200 text-sm"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline text-xs truncate">Search...</span>
        </div>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-zinc-600">
          <span>⌘K</span>
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 shadow-2xl border-white/10 max-w-lg w-[90%] sm:w-full bg-[#0d0d14] rounded-2xl overflow-hidden">
          <DialogTitle className="sr-only">Command Menu</DialogTitle>
          <Command className="bg-transparent border-none rounded-2xl">
            <div className="border-b border-white/[0.06]">
              <CommandInput
                placeholder="Search features..."
                className="h-12 text-white placeholder:text-zinc-600 bg-transparent border-none focus:ring-0 text-sm"
              />
            </div>
            <CommandList className="max-h-72 overflow-y-auto py-2">
              <CommandEmpty className="py-8 text-center text-sm text-zinc-600">No results found.</CommandEmpty>
              <CommandGroup
                heading="Project Navigation"
                className="[&_[cmdk-group-heading]]:text-zinc-600 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {QUICK_ACCESS.map((item) => (
                  <CommandItem
                    key={item.suffix}
                    onSelect={() => navigate(item.suffix)}
                    className="mx-1 rounded-lg text-zinc-300 hover:text-white data-[selected=true]:bg-white/[0.07] data-[selected=true]:text-white cursor-pointer gap-3 px-3 py-2.5"
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${item.color}`} />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator className="bg-white/[0.06] my-1" />
              <CommandGroup
                heading="Resources"
                className="[&_[cmdk-group-heading]]:text-zinc-600 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {RESOURCES.map((item) => (
                  <CommandItem
                    key={item.label}
                    onSelect={() => setOpen(false)}
                    className="mx-1 rounded-lg text-zinc-300 hover:text-white data-[selected=true]:bg-white/[0.07] data-[selected=true]:text-white cursor-pointer gap-3 px-3 py-2.5"
                  >
                    <item.icon className="h-4 w-4 text-zinc-400" />
                    <span>{item.label}</span>
                    {item.shortcut && <CommandShortcut className="text-zinc-600">{item.shortcut}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}