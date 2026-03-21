"use client"

import { BookOpen, HelpCircle, MessageSquare, Bot, Lightbulb } from "lucide-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Hardcoded platform features
const platformLinks = [
  {
    name: "Documentation",
    url: "#",
    icon: BookOpen,
  },
  {
    name: "Support",
    url: "#",
    icon: HelpCircle,
  },
  {
    name: "Feedback",
    url: "#",
    icon: MessageSquare,
  },
  {
    name: "AI Assistant",
    url: "#",
    icon: Bot,
  },
  {
    name: "Roadmap / Ideas",
    url: "#",
    icon: Lightbulb,
  },
]

export function NavProjects() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {platformLinks.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
