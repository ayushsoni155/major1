"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Database, Key, List, Server,
  ChevronLeft, ChevronRight, Hash, Type, Link2, Search,
  Plus, Edit2, Trash2, ListOrdered, RefreshCw, Download, X
} from "lucide-react";
import api from "@/utils/axios";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Determine input type for a column
function getInputType(dataType) {
  if (!dataType) return "text";
  const t = dataType.toLowerCase();
  if (["integer","bigint","smallint","numeric","decimal","real","double precision"].includes(t)) return "number";
  if (t === "boolean") return "checkbox";
  if (t.includes("date")) return "date";
  if (t.includes("time")) return "datetime-local";
  return "text";
}

function getColumnIcon(colName, dataType, isFk) {
  if (isFk) return <Link2 className="w-3.5 h-3.5 text-blue-400" />;
  if (colName.toLowerCase() === "id" || colName.includes("_id")) return <Key className="w-3.5 h-3.5 text-amber-400" />;
  const t = dataType?.toLowerCase() || "";
  if (["integer","bigint","smallint","numeric","decimal","real","double precision"].includes(t)) return <Hash className="w-3.5 h-3.5 text-indigo-400" />;
  if (t === "boolean") return <ListOrdered className="w-3.5 h-3.5 text-emerald-400" />;
  return <Type className="w-3.5 h-3.5 text-zinc-400" />;
}

function exportCSV(columns, data, tableName) {
  const headers = columns.map(c => c.column_name).join(",");
  const rows = data.map(row =>
    columns.map(c => {
      const v = row[c.column_name];
      if (v === null || v === undefined) return "";
      const str = String(v);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${tableName}.csv`;
  a.click();
}

export default function TableDataGridPage() {
  const { projectID, tableName } = useParams();

  const [loading, setLoading] = useState(true);
  const [tableDetails, setTableDetails] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 50;

  // Modal state
  const [insertOpen, setInsertOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Derive PK column: prefer column named 'id', then first column
  const getPKColumn = (details) => {
    if (!details?.columns?.length) return "id";
    return details.columns.find(c => c.column_name === "id")?.column_name
      || details.columns[0]?.column_name
      || "id";
  };

  // Returns true if a column should be excluded from the insert form
  // (auto-generated: UUID default, serial, or the primary key)
  const isAutoColumn = (col) => {
    if (!col) return false;
    const isUUID = col.data_type?.toLowerCase() === "uuid";
    const hasDefault = col.column_default &&
      (col.column_default.includes("gen_random_uuid") ||
       col.column_default.includes("uuid_generate") ||
       col.column_default.includes("nextval"));
    const isPK = col.is_primary_key ||
      col.column_name === getPKColumn(tableDetails);
    return isPK || (isUUID && hasDefault);
  };

  const isPKColumn = (col, details) => col.column_name === getPKColumn(details);

  const fetchTableData = useCallback(async () => {
    if (!projectID || !tableName) return;
    setLoading(true);
    try {
      const [detailsRes, dataRes] = await Promise.all([
        api.get(`/projects/${projectID}/tables/${tableName}`),
        api.get(`/projects/${projectID}/tables/${tableName}/data`, { params: { page, limit } }),
      ]);
      setTableDetails(detailsRes.data?.data || null);
      setTableData(dataRes.data?.data?.rows || []);
      setTotalRows(dataRes.data?.data?.total || 0);
    } catch (err) {
      toast.error("Failed to load table data");
    } finally {
      setLoading(false);
    }
  }, [projectID, tableName, page]);

  useEffect(() => { fetchTableData(); }, [fetchTableData]);

  // Build empty form for insert (exclude auto-generated columns)
  const openInsert = () => {
    const initial = {};
    tableDetails?.columns?.forEach(col => {
      if (isAutoColumn(col)) return; // skip UUID defaults, PKs, serials
      initial[col.column_name] = "";
    });
    setFormData(initial);
    setInsertOpen(true);
  };

  // Open edit with row data
  const openEdit = (row) => {
    setEditRow(row);
    setFormData({ ...row });
    setEditOpen(true);
  };

  // Open delete
  const openDelete = (row) => {
    setDeleteRow(row);
    setDeleteOpen(true);
  };

  const handleInsert = async () => {
    setSubmitting(true);
    try {
      // Strip empty-string values for UUID and numeric columns so DB uses defaults
      const cleanRow = {};
      Object.entries(formData).forEach(([key, val]) => {
        if (val === "" || val === null || val === undefined) {
          // Find the column definition
          const col = tableDetails?.columns?.find(c => c.column_name === key);
          const t = col?.data_type?.toLowerCase() || "";
          const isUUID = t === "uuid";
          const isNum = ["integer","bigint","smallint","numeric","decimal"].includes(t);
          if (col?.is_nullable === "YES" || isUUID || isNum) {
            cleanRow[key] = null; // Let DB handle nulls/defaults
          }
          // If NOT NULL and no default, still include as "" so backend validation can report clearly
          else { cleanRow[key] = val; }
        } else {
          cleanRow[key] = val;
        }
      });
      await api.post(`/projects/${projectID}/tables/${tableName}/data`, { row: cleanRow });
      toast.success("Row inserted successfully");
      setInsertOpen(false);
      fetchTableData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to insert row");
    } finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    setSubmitting(true);
    try {
      const pk = getPKColumn(tableDetails);
      const pkVal = editRow?.[pk];
      const updates = Object.fromEntries(
        Object.entries(formData).filter(([k]) => k !== pk)
      );
      await api.patch(`/projects/${projectID}/tables/${tableName}/rows`, {
        primaryKey: pk,
        primaryValue: pkVal,
        updates,
      });
      toast.success("Row updated successfully");
      setEditOpen(false);
      fetchTableData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update row");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      const pk = getPKColumn(tableDetails);
      await api.delete(`/projects/${projectID}/tables/${tableName}/rows`, {
        data: { primaryKey: pk, primaryValue: deleteRow?.[pk] }
      });
      toast.success("Row deleted successfully");
      setDeleteOpen(false);
      fetchTableData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete row");
    }
  };

  const totalPages = Math.ceil(totalRows / limit) || 1;

  // Columns for forms
  const pkCol = getPKColumn(tableDetails);
  const editableColumns = tableDetails?.columns?.filter(c => !isPKColumn(c, tableDetails)) || [];
  const insertableColumns = tableDetails?.columns?.filter(c => !isAutoColumn(c)) || [];
  const allColumns = tableDetails?.columns || [];

  const renderFormField = (col, isInsert = true) => {
    const isFk = tableDetails?.foreignKeys?.some(fk => fk.column_name === col.column_name);
    const inputType = getInputType(col.data_type);
    const readOnly = !isInsert && isPKColumn(col, tableDetails);

    return (
      <div key={col.column_name} className="space-y-1.5">
        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          {getColumnIcon(col.column_name, col.data_type, isFk)}
          {col.column_name}
          {col.is_nullable === "NO" && !readOnly && <span className="text-red-400">*</span>}
          <span className="text-zinc-600 font-normal normal-case tracking-normal ml-auto">{col.data_type}</span>
        </Label>
        {inputType === "checkbox" ? (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formData[col.column_name]}
              onChange={e => setFormData(prev => ({ ...prev, [col.column_name]: e.target.checked }))}
              disabled={readOnly}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-zinc-400">{formData[col.column_name] ? "true" : "false"}</span>
          </div>
        ) : (
          <Input
            type={inputType}
            value={formData[col.column_name] ?? ""}
            onChange={e => !readOnly && setFormData(prev => ({ ...prev, [col.column_name]: e.target.value }))}
            placeholder={readOnly ? "(auto-generated)" : `Enter ${col.column_name}...`}
            readOnly={readOnly}
            className={`rounded-xl h-10 text-sm font-mono ${
              readOnly
                ? "bg-white/[0.02] border-white/5 text-zinc-600 cursor-not-allowed"
                : "bg-white/5 border-white/10 text-white focus-visible:ring-violet-500/50"
            }`}
          />
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto w-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-[2rem] border-white/10 shrink-0 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 to-indigo-500/8 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/25">
            <Database className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">{tableName}</h1>
              <span className="bg-white/10 text-zinc-300 border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono">
                {totalRows} rows
              </span>
            </div>
            <p className="text-zinc-500 text-sm mt-0.5">Manage, update, and explore data</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative group flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
              placeholder="Search rows..."
              className="pl-9 pr-9 bg-black/40 border-white/10 text-white rounded-xl h-10 focus-visible:ring-blue-500/50 text-sm"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Export */}
          <Button
            onClick={() => tableDetails && exportCSV(tableDetails.columns, tableData, tableName)}
            variant="outline"
            size="icon"
            title="Export CSV"
            className="h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <Download className="w-4 h-4" />
          </Button>
          {/* Refresh */}
          <Button
            onClick={fetchTableData}
            variant="outline"
            size="icon"
            title="Refresh"
            className="h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          {/* Insert */}
          <Button
            onClick={openInsert}
            disabled={!tableDetails}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg gap-2"
          >
            <Plus className="w-4 h-4" /> Insert Row
          </Button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] border-white/10 relative overflow-hidden flex-1 flex flex-col min-h-0 shadow-2xl">
        {loading ? (
          <div className="flex-1 flex flex-col p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.03] border border-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : !tableDetails ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20">
            <Server className="w-14 h-14 text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Table Not Found</h3>
            <p className="text-zinc-500 text-sm">The requested table could not be found.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="border-b border-white/10 hover:bg-transparent bg-[#12121a]">
                    <TableHead className="w-[80px] text-zinc-500 font-semibold text-xs uppercase bg-[#12121a] px-4 py-3 border-r border-white/5">
                      Actions
                    </TableHead>
                    {allColumns.map((col) => {
                      const isFk = tableDetails.foreignKeys?.some(fk => fk.column_name === col.column_name);
                      const isPk = col.column_name.toLowerCase() === "id" || col.is_primary_key;
                      return (
                        <TableHead key={col.column_name} className="bg-[#12121a] px-4 py-3 whitespace-nowrap border-r border-white/5 last:border-r-0">
                          <div className="flex items-center gap-1.5">
                            {getColumnIcon(col.column_name, col.data_type, isFk)}
                            <span className="text-zinc-300 font-semibold text-xs tracking-wider">{col.column_name}</span>
                            {isPk && <span className="text-[10px] font-bold text-amber-500/70 bg-amber-500/10 px-1 py-0.5 rounded ml-1">PK</span>}
                            {isFk && <span className="text-[10px] font-bold text-blue-500/70 bg-blue-500/10 px-1 py-0.5 rounded ml-1">FK</span>}
                          </div>
                          <div className="text-[10px] text-zinc-600 font-mono mt-0.5 tracking-wider uppercase">
                            {col.data_type}{col.is_nullable === "NO" ? " · NOT NULL" : ""}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {tableData.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={(allColumns.length || 0) + 1} className="h-48 text-center">
                          <div className="flex flex-col items-center justify-center text-zinc-600">
                            <List className="w-10 h-10 opacity-20 mb-3" />
                            <p className="text-sm">No rows found. Click "Insert Row" to add data.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableData.map((row, rowIndex) => (
                        <motion.tr
                          key={row.id || rowIndex}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: rowIndex * 0.02 }}
                          className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                        >          {/* Actions */}
                          <TableCell className="px-3 py-2 border-r border-white/5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(row)}
                                title="Edit Row"
                                className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-zinc-500 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openDelete(row)}
                                title="Delete Row"
                                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-zinc-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                          {/* Data */}
                          {allColumns.map((col) => {
                            const val = row[col.column_name];
                            return (
                              <TableCell key={col.column_name} className="px-4 py-3 border-r border-white/5 last:border-r-0 max-w-[240px]">
                                {val === null ? (
                                  <span className="text-zinc-600 italic text-xs font-mono">null</span>
                                ) : typeof val === "boolean" ? (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${val ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                                    {val ? "TRUE" : "FALSE"}
                                  </span>
                                ) : typeof val === "object" ? (
                                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 truncate block">
                                    {JSON.stringify(val)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-zinc-300 font-mono truncate block">{String(val)}</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20 shrink-0">
              <span className="text-xs text-zinc-500 font-medium">
                Showing {tableData.length > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalRows)} of {totalRows} rows
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 h-8 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-bold text-white bg-violet-500/20 border border-violet-500/30 px-3 py-1 rounded-lg min-w-[60px] text-center">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 h-8 rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Insert Dialog */}
      <Dialog open={insertOpen} onOpenChange={setInsertOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white rounded-2xl max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" /> Insert Row into <span className="font-mono text-blue-400">{tableName}</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-500">Fill in the values for the new row. Primary keys are auto-generated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {insertableColumns.map(col => renderFormField(col, true))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInsertOpen(false)} className="text-zinc-400 hover:text-white rounded-xl">Cancel</Button>
            <Button onClick={handleInsert} disabled={submitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Insert Row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white rounded-2xl max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-violet-400" /> Edit Row
            </DialogTitle>
            <DialogDescription className="text-zinc-500">Grayed fields are read-only (primary key or auto-managed).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {allColumns.map(col => renderFormField(col, false))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-zinc-400 hover:text-white rounded-xl">Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#12121a] border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <Trash2 className="w-5 h-5 text-red-400" /> Delete Row
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete row with ID <strong className="text-white font-mono">{deleteRow?.id}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl">
              Delete Row
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
