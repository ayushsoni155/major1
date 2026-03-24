"use client"

import { BookOpen, HelpCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const platformLinks = [
  {
    name: "Documentation",
    url: "#",
    icon: BookOpen,
    color: "text-zinc-400",
  },
  {
    name: "Support",
    url: "#",
    icon: HelpCircle,
    color: "text-zinc-400",
  },
]

export function NavProjects() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-auto">
      <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-zinc-600 px-3 mb-1">
        Help
      </SidebarGroupLabel>
      <SidebarMenu>
        {platformLinks.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              className="rounded-xl transition-all duration-200 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]"
            >
              <Link href={item.url} className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="font-medium text-sm">{item.name}</span>
                <ExternalLink className="ml-auto w-3 h-3 text-zinc-700" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
