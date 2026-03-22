"use client";

import { useProjects } from "@/providers/ProjectContext";
import { Table as TableIcon, Database, Key, Activity, Clock, ArrowUpRight, BarChart3, Layers, Copy, Check, Globe } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import useSWR from "swr";
import api, { makeProjectFetcher } from "@/utils/axios";

const fetcher = (url) => api.get(url).then((res) => res.data.data);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-all flex-shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function DashboardPage() {
  const { selectedProject } = useProjects();
  const { projectID } = useParams();
  const projectId = selectedProject?.project_id;

  // SWR for all data fetches — cached and auto-revalidated
  // Table list and API keys use standard fetcher (no project header needed)
  const standardFetcher = (url) => api.get(url).then((res) => res.data.data);
  // Analytics stats and query history require X-Project-ID header
  const projectFetcher = makeProjectFetcher(projectId);

  const { data: tables = [] }        = useSWR(projectId ? `/projects/${projectId}/tables` : null, standardFetcher, { refreshInterval: 30000 });
  const { data: keys = [] }          = useSWR(projectId ? `/projects/${projectId}/keys` : null, standardFetcher, { refreshInterval: 60000 });
  const { data: historyData }        = useSWR(projectId ? `/query/history?limit=5` : null, projectFetcher, { refreshInterval: 30000 });
  const { data: analyticsData = [] } = useSWR(projectId ? `/analytics/stats` : null, projectFetcher, { refreshInterval: 30000 });

  const recentQueries = historyData?.history || [];
  const totalRows = analyticsData.reduce((sum, t) => sum + (t.row_count || 0), 0);

  // Build the PostgREST endpoint URL
  const apiBase = (typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_API_URL || "https://your-domain.com");
  const restEndpoint = `${apiBase}/rest/v1`;

  const statCards = [
    { title: "Tables", value: tables.length, icon: TableIcon, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", href: `create-table` },
    { title: "Total Rows", value: totalRows.toLocaleString(), icon: Database, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { title: "API Keys", value: keys.length, icon: Key, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", href: `api-keys` },
    { title: "Queries Run", value: recentQueries.length, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", href: `sql-editor` },
  ];

  const quickActions = [
    { label: "Create Table", href: `/project/${projectID}/create-table`, icon: TableIcon, color: "text-violet-400" },
    { label: "SQL Editor",   href: `/project/${projectID}/sql-editor`,   icon: Activity,   color: "text-indigo-400" },
    { label: "Analytics",    href: `/project/${projectID}/analytics`,    icon: BarChart3,  color: "text-cyan-400" },
    { label: "Schema View",  href: `/project/${projectID}/schema-visualization`, icon: Layers, color: "text-emerald-400" },
  ];

  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="text-center glass-card rounded-[2rem] p-10 border border-white/10">
          <Database className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-semibold">Select a project to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent pointer-events-none" />
        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent relative z-10">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-2 relative z-10 flex items-center gap-2">
          Overview of{" "}
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-violet-300">
            {selectedProject.project_name}
          </span>
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={containerVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <div className="glass-card p-6 rounded-[2xl] group hover:bg-white/[0.05] transition-all duration-500 relative overflow-hidden h-full border border-white/[0.07]">
              <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-3xl rounded-full -mr-16 -mt-16 opacity-40 group-hover:opacity-80 transition-opacity`} />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{stat.title}</p>
                  <p className="text-3xl font-black text-white mt-1 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} border ${stat.border} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              {stat.href && (
                <Link href={`/project/${projectID}/${stat.href}`} className="relative z-10 mt-4 flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
                  View details <ArrowUpRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* API Endpoint Card */}
      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] p-6 border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">REST API Endpoint</h3>
              <p className="text-xs text-zinc-500">Use this base URL with your API key to access your data via PostgREST</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-white/10">
            <code className="text-sm font-mono text-cyan-300 flex-1 truncate">{restEndpoint}</code>
            <CopyBtn text={restEndpoint} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { method: "GET", desc: "Read rows" },
              { method: "POST", desc: "Insert row" },
              { method: "PATCH", desc: "Update row" },
              { method: "DELETE", desc: "Delete row" },
            ].map(({ method, desc }) => (
              <span key={method} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400 font-mono">
                <span className="text-cyan-400 font-bold">{method}</span> {desc}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions + Table Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="glass-card rounded-[2rem] p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <Activity className="w-4 h-4 text-indigo-400" /> Quick Actions
            </h3>
            <div className="grid gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/10 transition-all duration-200 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-full" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 rounded-lg bg-black/20 group-hover:bg-black/40 transition-colors">
                      <action.icon className={`w-4 h-4 ${action.color}`} />
                    </div>
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{action.label}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors relative z-10" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Table Overview */}
        <motion.div variants={itemVariants} className="md:col-span-2 glass-card rounded-[2rem] p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-violet-500/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                <Database className="w-4 h-4 text-violet-400" /> Table Overview
              </h3>
              <Link href={`/project/${projectID}/create-table`} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1">
                + New table
              </Link>
            </div>
            {analyticsData.length > 0 ? (
              <div className="grid gap-2">
                {analyticsData.slice(0, 5).map((t) => (
                  <Link
                    key={t.table_name}
                    href={`/project/${projectID}/tables/${t.table_name}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                        <TableIcon className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <span className="text-sm font-bold text-white tracking-wide">{t.table_name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-zinc-600 font-semibold tracking-widest uppercase">Rows</span>
                        <span className="text-sm font-mono text-zinc-200">{t.row_count}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-zinc-600 font-semibold tracking-widest uppercase">Cols</span>
                        <span className="text-sm font-mono text-zinc-200">{t.column_count}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white/[0.01] rounded-xl border border-white/[0.05] border-dashed">
                <Database className="w-8 h-8 text-zinc-700 mb-3" />
                <h4 className="text-sm font-medium text-white mb-1">No tables yet</h4>
                <p className="text-xs text-zinc-500 max-w-xs">Create your first table to see statistics here.</p>
                <Link href={`/project/${projectID}/create-table`} className="mt-4 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                  + Create first table
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Queries */}
      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] p-6 border border-white/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-400" /> Recent Queries
            </h3>
            <Link href={`/project/${projectID}/sql-editor`} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1">
              Open SQL Editor <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {recentQueries.length > 0 ? (
            <div className="grid gap-2">
              {recentQueries.map((q, i) => (
                <div key={q.id || i} className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/[0.05] hover:border-white/10 transition-colors group">
                  <code className="text-xs font-mono text-zinc-400 bg-white/5 px-2 py-1 rounded inline-block truncate max-w-[60%] border border-white/5">
                    {q.query_text}
                  </code>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {q.execution_time_ms && (
                      <span className="text-xs font-mono text-zinc-600 bg-white/5 px-2 py-1 rounded">{q.execution_time_ms}ms</span>
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      q.query_status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {q.query_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-black/20 rounded-xl border border-white/5 border-dashed">
              <Activity className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No queries yet. Open the SQL editor to run your first query.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
