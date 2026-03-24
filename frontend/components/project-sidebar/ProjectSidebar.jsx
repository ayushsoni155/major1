"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard, Table, FileCode2, BarChart3,
  Workflow, Key, ClipboardList, Users,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",   icon: LayoutDashboard, suffix: "dashboard" },
  { label: "Tables",      icon: Table,           suffix: "tables" },
  { label: "SQL Editor",  icon: FileCode2,        suffix: "sql-editor" },
  { label: "Analytics",   icon: BarChart3,        suffix: "analytics" },
  { label: "Schema",      icon: Workflow,         suffix: "schema-visualization" },
  { label: "Members",     icon: Users,            suffix: "members" },
  { label: "API Keys",    icon: Key,              suffix: "api-keys" },
  { label: "Audit Log",   icon: ClipboardList,    suffix: "audit-log" },
];

export default function ProjectSidebar() {
  const pathname = usePathname();
  const { projectID } = useParams();

  const isActive = (suffix) => pathname.startsWith(`/project/${projectID}/${suffix}`);

  return (
    <aside className="hidden lg:flex flex-col w-[200px] xl:w-[220px] flex-shrink-0 border-r border-white/[0.06] min-h-[calc(100vh-56px)] bg-[#0a0a11] sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.suffix);
          return (
            <Link
              key={item.suffix}
              href={`/project/${projectID}/${item.suffix}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20 shadow-[inset_0_1px_0_rgba(139,92,246,0.1)]"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] border border-transparent"
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-violet-400" : ""}`} />
              <span className="truncate">{item.label}</span>
              {active && <div className="ml-auto w-1 h-4 rounded-full bg-violet-500/60" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
