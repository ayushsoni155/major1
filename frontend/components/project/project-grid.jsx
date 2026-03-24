"use client";

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard, NewProjectCard } from '@/components/project/project-card';
import { motion, AnimatePresence } from "motion/react";
import { Search, FolderOpen } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between bg-white/[0.02] p-4 sm:p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Your Projects
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-56 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 w-full text-sm"
            />
          </div>
          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="w-full xs:w-auto">
            <TabsList className="h-10 bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl w-full xs:w-auto">
              <TabsTrigger
                value="active"
                className="rounded-lg text-xs font-semibold text-zinc-500 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-none transition-all flex-1 xs:flex-none"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="rounded-lg text-xs font-semibold text-zinc-500 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-none transition-all flex-1 xs:flex-none"
              >
                Archived
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Project Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {tab === 'active' && (
          <motion.div variants={cardVariants}>
            <NewProjectCard onSuccess={() => mutate()} />
          </motion.div>
        )}
        <AnimatePresence>
          {filteredProjects.map((project) => (
            <motion.div
              key={project.project_id}
              variants={cardVariants}
              layout
            >
              <ProjectCard project={project} mutate={mutate} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-full flex flex-col items-center justify-center py-20 px-6 glass-card rounded-2xl border border-dashed border-white/10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5">
            <FolderOpen className="w-7 h-7 text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No projects found</h3>
          <p className="text-sm text-zinc-500 max-w-xs">
            {search
              ? `No ${tab} projects matching "${search}".`
              : `You have no ${tab} projects yet.`}
          </p>
        </motion.div>
      )}
    </div>
  );
}
