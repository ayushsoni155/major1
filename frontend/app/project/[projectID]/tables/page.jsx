"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTables } from "@/providers/TableContext";
import { useProjects } from "@/providers/ProjectContext";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Database, Plus, Search, Table2, Hash, Loader2,
  AlertCircle, ChevronRight, Layers, X, MoreVertical,
  Trash2, ExternalLink, RefreshCw, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import api from "@/utils/axios";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 280, damping: 22 } }
};

function TableCard({ table, projectID, onDelete }) {
  const colCount = table.columns?.length ?? table.column_count ?? "?";
  const rowCount = table.row_count ?? table.rowCount ?? null;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div variants={cardVariants} className="relative group">
      <Link
        href={`/project/${projectID}/tables/${table.table_name}`}
        className="flex flex-col p-5 rounded-2xl border border-white/[0.07] hover:border-violet-500/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors duration-300">
            <Table2 className="w-5 h-5 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">
              {table.table_name}
            </h3>
            <p className="text-[10px] text-zinc-600 font-mono">{table.table_type || "BASE TABLE"}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-violet-400 flex-shrink-0 transition-all group-hover:translate-x-0.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-lg">
            <Hash className="w-3 h-3 text-indigo-400" />
            <span className="text-[11px] text-zinc-400 font-medium">{colCount} cols</span>
          </div>
          {rowCount !== null && (
            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-lg">
              <Database className="w-3 h-3 text-cyan-400" />
              <span className="text-[11px] text-zinc-400 font-medium">{rowCount} rows</span>
            </div>
          )}
        </div>
      </Link>

      {/* 3-dot menu — overlaid on card top-right */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(true); }}
              className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-[#0d0d14] border border-white/10 rounded-xl shadow-2xl min-w-[160px] py-1"
            align="end"
            sideOffset={4}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem asChild>
              <Link
                href={`/project/${projectID}/tables/${table.table_name}`}
                className="flex items-center gap-2 mx-1 rounded-lg px-2.5 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.07] cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> View Data
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link
                  href={`/project/${projectID}/tables/${table.table_name}/alter`}
                  className="flex items-center gap-2 mx-1 rounded-lg px-2.5 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.07] cursor-pointer"
                >
                  <Settings2 className="w-4 h-4" /> Alter Table
                </Link>
              </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06] my-1 mx-1" />
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onDelete(table.table_name); }}
              className="mx-1 rounded-lg px-2.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 cursor-pointer gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default function TablesPage() {
  const { projectID } = useParams();
  const { tables, isLoading, error, mutate } = useTables();
  const { selectedProject } = useProjects();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = (tables || []).filter((t) =>
    t.table_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Backend: DELETE /:projectId/tables/:tableId with body { tableName }
      await api.delete(`/projects/${projectID}/tables/${deleteTarget}`, {
        data: { tableName: deleteTarget },
      });
      toast.success(`Table "${deleteTarget}" deleted`);
      mutate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete table");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
        <p className="text-sm text-zinc-500">Loading tables...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Failed to load tables</h3>
          <p className="text-sm text-zinc-500">Check your connection and try again.</p>
        </div>
        <Button onClick={() => mutate()} className="bg-violet-600 hover:bg-violet-500 rounded-xl gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white/[0.02] p-4 sm:p-5 rounded-2xl border border-white/[0.07] mb-5"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Tables
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            <span className="text-violet-400 font-mono">{(tables || []).length}</span> table{(tables || []).length !== 1 ? "s" : ""} in{" "}
            <span className="text-zinc-500 font-medium">{selectedProject?.project_name}</span>
          </p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables..."
              className="pl-9 h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-700 rounded-xl focus:border-violet-500/50 w-full text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            onClick={() => mutate()}
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded-xl flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link href={`/project/${projectID}/create-table`} className="flex-shrink-0">
            <Button className="h-10 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl gap-2 text-sm w-full">
              <Plus className="w-4 h-4" /> New Table
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-dashed border-white/[0.07] text-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mb-5">
            <Layers className="w-7 h-7 text-zinc-700" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {search ? `No results for "${search}"` : "No tables yet"}
          </h3>
          <p className="text-sm text-zinc-600 max-w-xs mb-6">
            {search ? "Try a different search term." : "Create your first table to start building your schema."}
          </p>
          {!search && (
            <Link href={`/project/${projectID}/create-table`}>
              <Button className="bg-violet-600 hover:bg-violet-500 rounded-xl gap-2 font-bold">
                <Plus className="w-4 h-4" /> Create First Table
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
        >
          <AnimatePresence>
            {filtered.map((table) => (
              <TableCard
                key={table.table_name}
                table={table}
                projectID={projectID}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Table Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#0d0d14] border border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" /> Delete Table
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently drop the table{" "}
              <strong className="text-white font-mono bg-white/[0.05] px-1.5 py-0.5 rounded">{deleteTarget}</strong>{" "}
              and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 text-white border-0 rounded-xl gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
