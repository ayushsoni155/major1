"use client"

import * as React from "react"
import { NavMain } from "@/components/project-sidebar/nav-main"
import { NavProjects } from "@/components/project-sidebar/nav-projects"
import { NavUser } from "@/components/project-sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ProjectSwitcher } from "./project-switcher"

export function AppSidebar({ ...props }) {
  return (
    <Sidebar
      collapsible="icon"
      className="bg-[#0d0d14] border-r border-white/[0.06] [&>[data-sidebar=sidebar]]:bg-[#0d0d14]"
      {...props}
    >
      <SidebarHeader className="border-b border-white/[0.06] pb-2">
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain />
        <NavProjects />
      </SidebarContent>
      <SidebarFooter className="border-t border-white/[0.06] pt-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
