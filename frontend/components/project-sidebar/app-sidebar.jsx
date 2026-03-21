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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* Project-related features */}
        <NavMain/>

        {/* Platform-level features */}
        <NavProjects />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
