"use client";
import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/axios";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Settings2, Plus, Pencil, Trash2, ArrowRightLeft, Loader2,
  Hash, Type, Database, ArrowLeft, Key, Link2
} from "lucide-react";

const DATA_TYPES = ["TEXT","VARCHAR(255)","INTEGER","BIGINT","BOOLEAN","NUMERIC","DECIMAL(10,2)","DATE","TIMESTAMPTZ","JSONB","UUID","SERIAL","BIGSERIAL"];

const fetcher = (url) => api.get(url).then(r => r.data.data);

function getIcon(dataType, colName) {
  if (colName?.toLowerCase() === "id" || colName?.includes("_id")) return <Key className="w-3.5 h-3.5 text-amber-400" />;
  const t = (dataType || "").toLowerCase();
  if (["integer","bigint","smallint","numeric","decimal","serial","bigserial"].some(d => t.includes(d))) return <Hash className="w-3.5 h-3.5 text-indigo-400" />;
  return <Type className="w-3.5 h-3.5 text-zinc-400" />;
}

export default function AlterTablePage() {
  const { projectID, tableName } = useParams();
  const router = useRouter();

  const { data: details, mutate, isLoading } = useSWR(
    projectID && tableName ? `/projects/${projectID}/tables/${tableName}` : null, fetcher
  );
  const columns = details?.columns || [];

  const [modal,     setModal]     = useState(null); // 'add' | 'rename' | 'drop' | 'set-default' | 'drop-default' | 'set-not-null' | 'drop-not-null'
  const [target,    setTarget]    = useState(null); // column
  const [newName,   setNewName]   = useState("");
  const [dataType,  setDataType]  = useState("TEXT");
  const [defValue,  setDefValue]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  const runAlteration = useCallback(async (alterations) => {
    setSubmitting(true);
    try {
      await api.patch(`/projects/${projectID}/tables/${tableName}`, { alterations });
      toast.success("Table altered successfully");
      setModal(null); setTarget(null); setNewName(""); setDataType("TEXT"); setDefValue("");
      mutate();
    } catch (e) { toast.error(e.response?.data?.message || "Alteration failed"); }
    finally { setSubmitting(false); }
  }, [projectID, tableName, mutate]);

  const openModal = (type, col = null) => {
    setTarget(col);
    setNewName(col?.column_name || "");
    setDataType("TEXT");
    setDefValue("");
    setModal(type);
  };

  const handleSubmit = () => {
    switch (modal) {
      case "add":
        return runAlteration([{ operation: "ADD_COLUMN", columnName: newName, dataType, defaultValue: defValue || undefined }]);
      case "rename":
        return runAlteration([{ operation: "RENAME_COLUMN", columnName: target?.column_name, newColumnName: newName }]);
      case "drop":
        return runAlteration([{ operation: "DROP_COLUMN", columnName: target?.column_name }]);
      case "set-default":
        return runAlteration([{ operation: "SET_DEFAULT", columnName: target?.column_name, defaultValue: defValue }]);
      case "drop-default":
        return runAlteration([{ operation: "DROP_DEFAULT", columnName: target?.column_name }]);
      case "set-not-null":
        return runAlteration([{ operation: "SET_NOT_NULL", columnName: target?.column_name }]);
      case "drop-not-null":
        return runAlteration([{ operation: "DROP_NOT_NULL", columnName: target?.column_name }]);
    }
  };

  const modalConfig = {
    add: {          title: "Add Column",          desc: "Append a new column to the table.", btnLabel: "Add Column",          btnClass: "from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500" },
    rename: {       title: "Rename Column",       desc: `Rename "${target?.column_name}" to a new name.`, btnLabel: "Rename",  btnClass: "from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" },
    drop: {         title: "Drop Column",         desc: `Permanently remove column "${target?.column_name}". Any data in this column will be lost.`, btnLabel: "Drop Column", btnClass: "from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500" },
    "set-default":  { title: "Set Default",        desc: "Set a default expression for this column.",                     btnLabel: "Set Default",  btnClass: "from-amber-600 to-orange-600" },
    "drop-default": { title: "Drop Default",        desc: "Remove the default value for this column.",                    btnLabel: "Drop Default", btnClass: "from-amber-600 to-orange-600" },
    "set-not-null": { title: "Set NOT NULL",        desc: "Enforce non-null constraint on this column (table must have no nulls in this column).", btnLabel: "Set NOT NULL", btnClass: "from-emerald-600 to-teal-600" },
    "drop-not-null":{ title: "Drop NOT NULL",       desc: "Allow null values in this column.",                            btnLabel: "Allow NULLs", btnClass: "from-emerald-600 to-teal-600" },
  };
  const mc = modal ? modalConfig[modal] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col gap-6 p-4 sm:p-6 max-w-[1200px] mx-auto w-full">
      
      {/* Header */}
      <div className="glass-card rounded-[2rem] border-white/10 p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/8 to-indigo-500/8 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-3 rounded-2xl bg-violet-500/15 border border-violet-500/25">
              <Settings2 className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Alter Table</h1>
              <p className="text-zinc-500 text-sm font-mono mt-0.5">{tableName}</p>
            </div>
          </div>
          <Button onClick={() => openModal("add")}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg gap-2">
            <Plus className="w-4 h-4" /> Add Column
          </Button>
        </div>
      </div>

      {/* Columns table */}
      <div className="glass-card rounded-[2rem] border-white/10 overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center gap-2">
          <Database className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{columns.length} columns</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500/50" /></div>
        ) : columns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <Database className="w-12 h-12 opacity-20 mb-3" />
            <p>No columns found. The table may not exist.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent bg-[#12121a]">
                <TableHead className="bg-[#12121a] text-zinc-500 text-xs uppercase font-semibold py-3 px-5">Column</TableHead>
                <TableHead className="bg-[#12121a] text-zinc-500 text-xs uppercase font-semibold py-3">Type</TableHead>
                <TableHead className="bg-[#12121a] text-zinc-500 text-xs uppercase font-semibold py-3">Nullable</TableHead>
                <TableHead className="bg-[#12121a] text-zinc-500 text-xs uppercase font-semibold py-3">Default</TableHead>
                <TableHead className="bg-[#12121a] text-zinc-500 text-xs uppercase font-semibold py-3 text-right pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {columns.map((col, i) => (
                  <motion.tr key={col.column_name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors group">
                    <TableCell className="px-5 py-3 font-mono text-sm font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {getIcon(col.data_type, col.column_name)}
                        {col.column_name}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-zinc-400 uppercase">{col.data_type}</TableCell>
                    <TableCell className="py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${col.is_nullable === "NO" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
                        {col.is_nullable === "NO" ? "NOT NULL" : "NULL"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-zinc-500">
                      {col.column_default ? <code className="bg-white/5 px-1.5 py-0.5 rounded text-violet-300">{col.column_default}</code> : <span className="text-zinc-700">—</span>}
                    </TableCell>
                    <TableCell className="py-3 pr-5">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal("rename", col)} title="Rename" className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-zinc-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openModal("set-default", col)} title="Set Default" className="p-1.5 hover:bg-amber-500/20 hover:text-amber-400 rounded-lg text-zinc-500 transition-colors"><ArrowRightLeft className="w-3.5 h-3.5" /></button>
                        {col.is_nullable === "YES"
                          ? <button onClick={() => openModal("set-not-null", col)} title="Set NOT NULL" className="p-1.5 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg text-zinc-500 transition-colors text-[10px] font-bold px-2">NN</button>
                          : <button onClick={() => openModal("drop-not-null", col)} title="Allow NULLs" className="p-1.5 hover:bg-zinc-500/20 hover:text-zinc-300 rounded-lg text-zinc-600 transition-colors text-[10px] font-bold px-2">N?</button>
                        }
                        <button onClick={() => openModal("drop", col)} title="Drop Column" className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-zinc-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </div>

      {/* Action Modal */}
      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white rounded-2xl max-w-md">
          {mc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white"><Settings2 className="w-5 h-5 text-violet-400"/>{mc.title}</DialogTitle>
                <DialogDescription className="text-zinc-500">{mc.desc}</DialogDescription>
              </DialogHeader>
              <div className="py-3 space-y-4">
                {(modal === "add") && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Column Name</Label>
                      <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="column_name"
                        className="rounded-xl h-10 bg-white/5 border-white/10 text-white focus-visible:ring-violet-500/50 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data Type</Label>
                      <Select value={dataType} onValueChange={setDataType}>
                        <SelectTrigger className="rounded-xl h-10 bg-white/5 border-white/10 text-white font-mono"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10 rounded-xl">
                          {DATA_TYPES.map(t => <SelectItem key={t} value={t} className="font-mono">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Default Value <span className="text-zinc-600 normal-case">(optional)</span></Label>
                      <Input value={defValue} onChange={e => setDefValue(e.target.value)} placeholder="e.g. 0, 'pending', NOW()"
                        className="rounded-xl h-10 bg-white/5 border-white/10 text-white focus-visible:ring-violet-500/50 font-mono" />
                    </div>
                  </>
                )}
                {modal === "rename" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Column Name</Label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="new_name"
                      className="rounded-xl h-10 bg-white/5 border-white/10 text-white focus-visible:ring-violet-500/50 font-mono" />
                  </div>
                )}
                {modal === "set-default" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Default Expression</Label>
                    <Input value={defValue} onChange={e => setDefValue(e.target.value)} placeholder="e.g. 'active', NOW(), 0"
                      className="rounded-xl h-10 bg-white/5 border-white/10 text-white focus-visible:ring-violet-500/50 font-mono" />
                  </div>
                )}
                {(modal === "drop" || modal === "drop-default" || modal === "set-not-null" || modal === "drop-not-null") && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${modal === "drop" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"}`}>
                    Column: <code className="font-mono font-bold">{target?.column_name}</code>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setModal(null)} className="text-zinc-400 hover:text-white rounded-xl">Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting}
                  className={`bg-gradient-to-r ${mc.btnClass} rounded-xl gap-2 text-white font-bold`}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />} {mc.btnLabel}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
