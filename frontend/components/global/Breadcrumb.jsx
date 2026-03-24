"use client";

import * as React from "react";
import { Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Breadcrumb({ className }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Map path segments to friendly display names
  const segmentLabels = {
    project: "Projects",
    "create-project": "All Projects",
    dashboard: "Dashboard",
    tables: "Tables",
    "sql-editor": "SQL Editor",
    analytics: "Analytics",
    "schema-visualization": "Schema",
    "api-keys": "API Keys",
    "audit-log": "Audit Log",
    "create-table": "Create Table",
  };

  const getLabel = (segment) =>
    segmentLabels[segment] || decodeURIComponent(segment)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-xs">
        {/* Home — RapidBase logo */}
        <li>
          <Link
            href="/"
            className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.4)] hover:shadow-[0_0_15px_rgba(139,92,246,0.6)] transition-all"
          >
            <Zap className="h-3.5 w-3.5 text-white" />
          </Link>
        </li>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = getLabel(segment);

          // Skip showing raw project IDs in the breadcrumb
          const isProjectId =
            index > 0 &&
            segments[index - 1] === "project" &&
            segment !== "create-project";

          if (isProjectId) return null;

          return (
            <React.Fragment key={href}>
              {/* Mobile: show ellipsis after first item if path is long */}
              {index === 0 && segments.length > 2 && (
                <li className="flex items-center gap-0.5 md:hidden text-zinc-600">
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>…</span>
                </li>
              )}

              <li
                className={cn("flex items-center gap-0.5", {
                  "hidden md:flex": !isLast && segments.length > 2,
                  flex: isLast || segments.length <= 2,
                })}
              >
                <ChevronRight className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                {!isLast ? (
                  <Link
                    href={href}
                    className="capitalize text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    {label}
                  </Link>
                ) : (
                  <span className="capitalize text-zinc-200 font-medium">
                    {label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}