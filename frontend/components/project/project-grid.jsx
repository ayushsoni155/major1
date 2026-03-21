"use client";

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard, NewProjectCard } from '@/components/project/project-card';

export function ProjectGrid({ projects, mutate }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active");

  // Filter projects based on the current search term and active tab
  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      p.project_status === tab &&
      p.project_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search, tab]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tab === 'active' && <NewProjectCard onSuccess={() => mutate()} />}
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.project_id}
            project={project}
            mutate={mutate}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-10 col-span-full">
          <p className="text-muted-foreground">No {tab} projects found.</p>
        </div>
      )}
    </div>
  );
}
