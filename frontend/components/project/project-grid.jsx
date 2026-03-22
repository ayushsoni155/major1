"use client";

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard, NewProjectCard } from '@/components/project/project-card';
import { motion } from "motion/react";
import { Search } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export function ProjectGrid({ projects, mutate }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active");

  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      p.project_status === tab &&
      p.project_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search, tab]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto mt-4 px-2">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between bg-white/[0.02] p-5 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md"
      >
        <h1 className="text-3xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
          Your Projects
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 w-full"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
            <TabsList className="h-11 bg-white/[0.05] border border-white/10 p-1 rounded-xl">
              <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white">Active</TabsTrigger>
              <TabsTrigger value="archived" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {tab === 'active' && (
          <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
            <NewProjectCard onSuccess={() => mutate()} />
          </motion.div>
        )}
        {filteredProjects.map((project) => (
          <motion.div key={project.project_id} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
            <ProjectCard
              project={project}
              mutate={mutate}
            />
          </motion.div>
        ))}
      </motion.div>

      {filteredProjects.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 col-span-full glass-card rounded-[2rem] border-dashed border-2 flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
          <p className="text-zinc-500">We couldn't find any {tab} projects matching your search.</p>
        </motion.div>
      )}
    </div>
  );
}
