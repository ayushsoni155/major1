"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Breadcrumb({ className }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-xs text-muted-foreground">
        {/* Home link */}
        <li>
          <Link href="/" className="hover:text-foreground transition">
            <Bot className="h-5 w-5"/>
          </Link>
        </li>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;

          return (
            <React.Fragment key={href}>
              {/* Render ellipsis on mobile after Home if path is long enough */}
              {index === 0 && segments.length > 1 && (
                <li className="flex items-center gap-1 md:hidden">
                  <ChevronRight className="h-4 w-4" />
                  <span>...</span>
                </li>
              )}

              {/* Render each segment. Hide all but the last on mobile. */}
              <li
                className={cn("items-center gap-1", {
                  "hidden md:flex": !isLast, // Hide intermediate links on mobile
                  flex: isLast, // Always show the last segment
                })}
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                {!isLast ? (
                  <Link
                    href={href}
                    className="capitalize hover:text-foreground transition"
                  >
                    {decodeURIComponent(segment)}
                  </Link>
                ) : (
                  <span className="capitalize text-foreground font-medium">
                    {decodeURIComponent(segment)}
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