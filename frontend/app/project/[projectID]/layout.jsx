"use client";

import ProjectTopNav from "@/components/project/ProjectTopNav";
import ProjectSidebar from "@/components/project-sidebar/ProjectSidebar";

export default function ProjectLayout({ children }) {
  return (
    <div className="dashboard-dark min-h-screen bg-[#08080f] flex flex-col">
      <ProjectTopNav />
      <div className="flex flex-1 min-h-0">
        <ProjectSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
