"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ClipboardList, Clock, User, Globe, Activity, FileText } from "lucide-react";
import api from "@/utils/axios";
import { motion, AnimatePresence } from "motion/react";
import { useProjects } from "@/providers/ProjectContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AuditLogPage() {
  const { selectedProject } = useProjects();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const projectId = selectedProject?.project_id;

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    const fetchLogs = async () => {
      try {
        setLoading(true);
        // Nginx gateway maps /api/auditlog/ to database-service/query/audit-logs/
        const res = await api.get("/auditlog/", {
          headers: { "X-Project-ID": projectId },
        });
        setLogs(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [projectId]);

  const filteredLogs = logs.filter((log) =>
    log.action_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex flex-1 flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-[2rem] border-white/10 shrink-0 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-rose-500/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500/20 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <ClipboardList className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-wide">Audit Log</h1>
            <p className="text-zinc-400 text-sm mt-1">Track and monitor all administrative actions and system events</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-72 z-10 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-orange-400 transition-colors" />
          <Input
            type="text"
            placeholder="Search by action type..."
            className="pl-12 bg-black/40 border-white/10 text-white rounded-xl h-12 w-full focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] border-white/10 relative overflow-hidden flex-1 flex flex-col min-h-[500px] shadow-2xl">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500/50 mb-4" />
            <p className="text-zinc-500 font-medium">Loading security logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-24 bg-white/[0.01]">
            <div className="w-24 h-24 rounded-full bg-orange-500/5 flex items-center justify-center mb-6">
              <ClipboardList className="w-12 h-12 text-orange-500/30 gap-2" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Audit Logs Found</h3>
            <p className="text-sm text-zinc-500 max-w-md text-center">There are no records matching your current filter. System actions will appear here automatically.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto w-full p-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
                    <TableHead className="text-zinc-400 font-semibold tracking-wider rounded-tl-xl w-24">ID</TableHead>
                    <TableHead className="text-zinc-400 font-semibold tracking-wider"><div className="flex items-center gap-2"><User className="w-4 h-4"/> Actor</div></TableHead>
                    <TableHead className="text-zinc-400 font-semibold tracking-wider"><div className="flex items-center gap-2"><Activity className="w-4 h-4"/> Action Type</div></TableHead>
                    <TableHead className="text-zinc-400 font-semibold tracking-wider"><div className="flex items-center gap-2"><FileText className="w-4 h-4"/> Details</div></TableHead>
                    <TableHead className="text-zinc-400 font-semibold tracking-wider"><div className="flex items-center gap-2"><Globe className="w-4 h-4"/> IP Address</div></TableHead>
                    <TableHead className="text-zinc-400 font-semibold tracking-wider rounded-tr-xl"><div className="flex items-center gap-2"><Clock className="w-4 h-4"/> Date / Time</div></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredLogs.map((log) => (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="border-white/5 hover:bg-white/[0.04] transition-colors"
                      >
                        <TableCell className="font-mono text-zinc-500 px-4 py-4">{log.id}</TableCell>
                        <TableCell className="px-4 py-4">
                          <code className="text-sm font-mono text-orange-200 bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20 truncate max-w-[160px] inline-block">
                            {log.actor_id || "System"}
                          </code>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge variant="outline" className="capitalize bg-white/5 text-zinc-300 border-white/10 px-3 py-1 font-medium tracking-wide">
                            {log.action_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 max-w-sm">
                          <div className="text-xs font-mono bg-black/40 text-zinc-400 p-2.5 rounded-lg border border-white/5 max-h-24 overflow-y-auto custom-scrollbar">
                            {log.details ? JSON.stringify(log.details, null, 2) : "No additional details"}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span className="text-sm font-mono text-zinc-400 flex items-center gap-2">
                            {log.ip_address || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-zinc-300">{new Date(log.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="text-xs text-zinc-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4">
              <AnimatePresence>
                {filteredLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/40 border border-white/10 rounded-2xl p-5 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="capitalize bg-orange-500/10 text-orange-400 border-orange-500/20 px-3 py-1">
                        {log.action_type}
                      </Badge>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-sm text-zinc-300 font-medium">{new Date(log.created_at).toLocaleDateString()}</span>
                        <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Clock className="w-3 h-3"/>{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 flex items-center gap-2"><User className="w-4 h-4"/> Actor</span>
                        <code className="text-xs font-mono text-orange-200 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{log.actor_id || "System"}</code>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 flex items-center gap-2"><Globe className="w-4 h-4"/> IP Address</span>
                        <span className="text-zinc-300 font-mono text-xs">{log.ip_address || "—"}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <span className="text-zinc-500 text-xs font-medium flex items-center gap-2 mb-2"><FileText className="w-3.5 h-3.5"/> Details</span>
                      <div className="text-xs font-mono bg-black/60 text-zinc-400 p-3 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
                        {log.details ? JSON.stringify(log.details, null, 2) : "No additional details"}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
