"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useProjects } from "@/providers/ProjectContext";
import { useAuth } from "@/providers/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, LayoutDashboard, Table, FileCode2, BarChart3,
  Workflow, Key, ClipboardList, Plus, ChevronDown,
  LogOut, User, Menu, X, Database, ChevronLeft, ChevronRight, Users, HelpCircle,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "nextjs-toploader/app";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import NotificationBell from "@/components/notification/notificationUse";

const NAV_ITEMS = [
  { label: "Dashboard",   icon: LayoutDashboard, suffix: "dashboard" },
  { label: "Tables",      icon: Table,           suffix: "tables" },
  { label: "SQL Editor",  icon: FileCode2,        suffix: "sql-editor" },
  { label: "Analytics",   icon: BarChart3,        suffix: "analytics" },
  { label: "Schema",      icon: Workflow,         suffix: "schema-visualization" },
  { label: "Members",     icon: Users,            suffix: "members" },
  { label: "API Keys",    icon: Key,              suffix: "api-keys" },
  { label: "Audit Log",   icon: ClipboardList,    suffix: "audit-log" },
];

export default function ProjectTopNav() {
  const pathname = usePathname();
  const { projectID } = useParams();
  const { projects, selectedProject, selectProject, mutate } = useProjects();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const isActive = (suffix) => pathname.startsWith(`/project/${projectID}/${suffix}`);

  const handleProjectSwitch = async (project) => {
    await selectProject(project.project_id);
    router.push(`/project/${project.project_id}/dashboard`);
  };

  const sidebarWidth = collapsed ? "w-[60px]" : "w-[220px]";

  return (
    <>
      {/* ---- TOP BAR ---- */}
      <header className="sticky top-0 z-50 bg-[#0d0d14]/90 backdrop-blur-xl border-b border-white/[0.06] h-14 flex items-center justify-between px-4 lg:px-5 gap-3">
        {/* Left: logo + project switcher */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)]">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-black tracking-tight text-white">RapidBase</span>
          </Link>

          <div className="h-4 w-px bg-white/10 flex-shrink-0 hidden sm:block" />

          {/* Project Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-sm min-w-0 max-w-[180px]">
                <Database className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="truncate font-medium text-white text-xs">
                  {selectedProject?.project_name || "Select project"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0d0d14] border border-white/10 rounded-xl shadow-2xl min-w-[200px] py-1" align="start" sideOffset={6}>
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-3 py-2">
                Switch Project
              </DropdownMenuLabel>
              {(projects || []).map((p) => (
                <DropdownMenuItem key={p.project_id} onClick={() => handleProjectSwitch(p)}
                  className="mx-1 rounded-lg gap-2.5 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-violet-300">{p.project_name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm truncate">{p.project_name}</span>
                  {p.project_id === selectedProject?.project_id && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/[0.06] my-1 mx-1" />
              <DropdownMenuItem onClick={() => setCreateOpen(true)}
                className="mx-1 rounded-lg gap-2.5 px-2.5 py-2 text-zinc-400 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer">
                <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm">New project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <NotificationBell />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors">
                  <Avatar className="h-7 w-7 rounded-lg flex-shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-violet-500/40 to-indigo-500/40 text-white text-[10px] font-bold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-xs text-zinc-400 max-w-[80px] truncate">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-600 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0d0d14] border border-white/10 rounded-xl shadow-2xl min-w-[180px] py-1" align="end" sideOffset={6}>
                <div className="px-3 py-2.5 border-b border-white/[0.06]">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={() => router.push('/profile')}
                  className="mx-1 mt-1 rounded-lg gap-2 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer">
                  <User className="w-4 h-4" /> Profile &amp; Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/support')}
                  className="mx-1 rounded-lg gap-2 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer">
                  <HelpCircle className="w-4 h-4" /> Help &amp; Support
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06] my-1 mx-1" />
                <DropdownMenuItem onClick={signOut}
                  className="mx-1 mb-1 rounded-lg gap-2 px-2.5 py-2 text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer">
                  <LogOut className="w-4 h-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* ---- MOBILE SIDEBAR OVERLAY ---- */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[220px] bg-[#0d0d14] border-r border-white/[0.06] z-50 flex flex-col pt-4 pb-6 px-3"
            >
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-black text-white">RapidBase</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.suffix);
                  return (
                    <Link
                      key={item.suffix}
                      href={`/project/${projectID}/${item.suffix}`}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-violet-400" : ""}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={() => mutate()} />
    </>
  );
}
