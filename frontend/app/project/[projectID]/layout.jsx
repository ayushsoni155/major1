"use client";

import ProjectTopNav from "@/components/project/ProjectTopNav";

export default function ProjectLayout({ children }) {
  return (
    <div className="dashboard-dark min-h-screen bg-[#08080f]">
      <ProjectTopNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
