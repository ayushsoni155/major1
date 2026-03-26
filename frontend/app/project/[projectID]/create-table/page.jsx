"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import axios from "@/utils/axios";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Table as TableIcon, Columns, Sparkles, Settings2 } from "lucide-react";
import { useTables } from "@/providers/TableContext";
import { motion, AnimatePresence } from "motion/react";

const generateId = () => {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const DATA_TYPES = [
  { value: "UUID", description: "Unique identifier." },
  { value: "VARCHAR(255)", description: "Short text up to 255 chars." },
  { value: "TEXT", description: "Unlimited text." },
  { value: "INTEGER", description: "Whole numbers." },
  { value: "BIGINT", description: "Large integers." },
  { value: "BOOLEAN", description: "True/false values." },
  { value: "TIMESTAMP WITH TIME ZONE", description: "Date & time with timezone." },
  { value: "JSONB", description: "Semi-structured JSON data." },
  { value: "ARRAY", description: "Array of base type values." },
  { value: "ENUM", description: "Enum with predefined values." },
];

const CONSTRAINTS = {
  isPrimaryKey: { label: "Primary Key", description: "Unique row identifier." },
  isUnique: { label: "Unique", description: "No duplicate values allowed." },
  isNullable: { label: "Allow Nulls", description: "Can be empty (NULL)." },
  hasDefault: { label: "Default Value", description: "Auto-filled if none provided." },
  isForeignKey: { label: "Foreign Key", description: "References another table/column." },
  hasCheck: { label: "Check Constraint", description: "Custom check expression." },
};

export default function CreateTablePage() {
  const params = useParams();
  const projectId = params?.projectID;
  const { mutate } = useTables();
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([
    {
      id: generateId(),
      name: "",
      dataType: "VARCHAR(255)",
      baseType: "",
      enumValues: [],
      isPrimaryKey: false,
      isUnique: false,
      isNullable: true,
      hasDefault: false,
      defaultValue: "",
      hasCheck: false,
      check: "",
      isForeignKey: false,
      referencesTable: "",
      referencesColumn: "",
      onDelete: "",
      onUpdate: "",
    },
  ]);

  const handleColumnChange = (id, field, value) => {
    setColumns(cols => cols.map(col => {
      if (col.id === id) {
        const updatedCol = { ...col, [field]: value };
        if (field === "isPrimaryKey" && value) updatedCol.isNullable = false;
        return updatedCol;
      }
      return col;
    }));
  };

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        id: generateId(),
        name: "",
        dataType: "VARCHAR(255)",
        baseType: "",
        enumValues: [],
        isPrimaryKey: false,
        isUnique: false,
        isNullable: true,
        hasDefault: false,
        defaultValue: "",
        hasCheck: false,
        check: "",
        isForeignKey: false,
        referencesTable: "",
        referencesColumn: "",
        onDelete: "",
        onUpdate: "",
      },
    ]);
  };

  const removeColumn = (id) => setColumns(columns.filter((col) => col.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) return toast.error("No project ID found.");
    if (!tableName.trim()) return toast.error("Table name is required.");

    const filteredColumns = columns.filter((c) => c.name.trim() !== "");
    if (filteredColumns.length === 0) return toast.error("Add at least one column.");

    setLoading(true);
    const payload = {
      tableName,
      columns: filteredColumns.map((c) => ({
        ...c,
        defaultValue: c.hasDefault ? c.defaultValue : null,
        referencesTable: c.isForeignKey ? c.referencesTable : null,
        referencesColumn: c.isForeignKey ? c.referencesColumn : null,
        check: c.hasCheck ? c.check : null,
        baseType: c.dataType === "ARRAY" ? c.baseType : null,
        enumValues: c.dataType === "ENUM" ? c.enumValues.filter((v) => v) : null,
      })),
    };

    try {
      await axios.post(`/projects/${projectId}/tables`, payload);
      toast.success(`Table "${tableName}" created successfully!`);
      await mutate();
      setTableName("");
      setColumns([
        {
          id: generateId(),
          name: "",
          dataType: "VARCHAR(255)",
          baseType: "",
          enumValues: [],
          isPrimaryKey: false,
          isUnique: false,
          isNullable: true,
          hasDefault: false,
          defaultValue: "",
          hasCheck: false,
          check: "",
          isForeignKey: false,
          referencesTable: "",
          referencesColumn: "",
          onDelete: "",
          onUpdate: "",
        },
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create table.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="flex flex-1 flex-col p-6 max-w-5xl mx-auto w-full gap-8"
    >
      {/* Header */}
      <div className="glass-card px-8 py-10 rounded-[2.5rem] border-white/10 relative overflow-hidden shadow-2xl text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-indigo-500/10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <TableIcon className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Create Table
          </h1>
          <p className="text-zinc-400 text-lg">
            Define your database schema for project <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-blue-300 text-sm">{projectId}</span>
          </p>
        </div>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Table Name */}
        <div className="glass-card p-6 rounded-[2rem] border border-white/10 relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <Label htmlFor="tableName" className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Table Name
            </Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g., users, posts, products"
              required
              className="bg-black/40 border-white/10 text-white rounded-xl h-14 text-lg px-5 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 transition-all font-mono"
            />
          </div>
        </div>

        {/* Columns Builder */}
        <div className="space-y-4 relative">
          <div className="absolute top-8 bottom-8 left-8 w-px bg-gradient-to-b from-blue-500/50 via-indigo-500/20 to-transparent pointer-events-none hidden md:block" />
          
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Columns className="w-5 h-5 text-indigo-400" /> Columns
             </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {columns.map((col, index) => (
              <motion.div 
                key={col.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-6 sm:p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group/col"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/col:opacity-100 transition-opacity z-20">
                    {columns.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeColumn(col.id)} className="h-10 w-10 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                </div>

                <div className="relative z-10 grid gap-8 md:pl-8">
                  <div className="absolute left-[-2.5rem] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#0A0A10] hidden md:block shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                  
                  {/* Name & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Column Name</Label>
                      <Input
                        value={col.name}
                        onChange={(e) => handleColumnChange(col.id, "name", e.target.value.toLowerCase())}
                        placeholder="e.g., id, email, created_at"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-12 px-4 focus-visible:ring-indigo-500/50 font-mono"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data Type</Label>
                      <Select onValueChange={(v) => handleColumnChange(col.id, "dataType", v)} value={col.dataType}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-12 px-4 focus:ring-indigo-500/50">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10 text-white rounded-xl max-h-80">
                          {DATA_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="focus:bg-white/10 rounded-lg cursor-pointer my-1">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-indigo-300">{t.value}</span>
                                <span className="text-xs text-zinc-500">{t.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ARRAY & ENUM */}
                  <AnimatePresence>
                    {col.dataType === "ARRAY" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2.5 overflow-hidden">
                        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Array Base Type</Label>
                        <Input value={col.baseType} onChange={(e) => handleColumnChange(col.id, "baseType", e.target.value)} placeholder="e.g., INTEGER, TEXT" className="bg-white/5 border-white/10 text-white rounded-xl h-12 px-4 focus-visible:ring-indigo-500/50 font-mono uppercase" />
                      </motion.div>
                    )}
                    {col.dataType === "ENUM" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2.5 overflow-hidden">
                        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Enum Values <span className="normal-case font-normal text-zinc-500 tracking-normal">(comma-separated)</span></Label>
                        <Input value={col.enumValues.join(",")} onChange={(e) => handleColumnChange(col.id, "enumValues", e.target.value.split(","))} placeholder="active,inactive,pending" className="bg-white/5 border-white/10 text-white rounded-xl h-12 px-4 focus-visible:ring-indigo-500/50 font-mono" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Constraints */}
                  <div className="p-5 rounded-[1.5rem] bg-black/40 border border-white/5">
                    <Label className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Settings2 className="w-4 h-4 text-zinc-400" /> Constraints
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(CONSTRAINTS).map(([key, { label, description }]) => (
                        <div key={key} className="flex items-start space-x-3 group cursor-pointer">
                          <Checkbox
                            id={`${col.id}-${key}`}
                            className="mt-1 border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:text-white rounded"
                            checked={col[key]}
                            onCheckedChange={(v) => handleColumnChange(col.id, key, v)}
                            disabled={key === "isNullable" && col.isPrimaryKey}
                          />
                          <Label htmlFor={`${col.id}-${key}`} className={`grid gap-0.5 leading-none cursor-pointer ${key === "isNullable" && col.isPrimaryKey ? 'opacity-50' : 'group-hover:text-blue-200 transition-colors'}`}>
                            <span className="text-sm font-medium text-zinc-200">{label}</span>
                            <span className="text-[10px] text-zinc-500">{description}</span>
                          </Label>
                        </div>
                      ))}
                    </div>

                    <AnimatePresence>
                      {/* Default Value Input */}
                      {col.hasDefault && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4 mt-4 border-t border-white/5 space-y-2.5 overflow-hidden">
                          <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Default Value</Label>
                          <Input value={col.defaultValue} onChange={(e) => handleColumnChange(col.id, "defaultValue", e.target.value)} placeholder="e.g., CURRENT_TIMESTAMP, false, 'active'" className="bg-white/5 border-white/10 text-white rounded-xl h-11 px-4 focus-visible:ring-blue-500/50 font-mono" />
                        </motion.div>
                      )}
                      
                      {/* Check Constraint Input */}
                      {col.hasCheck && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4 mt-4 border-t border-white/5 space-y-2.5 overflow-hidden">
                          <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Check Expression</Label>
                          <Input value={col.check} onChange={(e) => handleColumnChange(col.id, "check", e.target.value)} placeholder="e.g., age > 18" className="bg-white/5 border-white/10 text-white rounded-xl h-11 px-4 focus-visible:ring-blue-500/50 font-mono text-orange-200" />
                        </motion.div>
                      )}

                      {/* Foreign Key Inputs */}
                      {col.isForeignKey && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4 mt-4 border-t border-white/5 overflow-hidden">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2.5">
                                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">References Table</Label>
                                <Input value={col.referencesTable} onChange={(e) => handleColumnChange(col.id, "referencesTable", e.target.value)} placeholder="e.g., users" className="bg-white/5 border-white/10 text-white rounded-xl h-11 px-4 focus-visible:ring-blue-500/50 font-mono" />
                              </div>
                              <div className="space-y-2.5">
                                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">References Column</Label>
                                <Input value={col.referencesColumn} onChange={(e) => handleColumnChange(col.id, "referencesColumn", e.target.value)} placeholder="e.g., id" className="bg-white/5 border-white/10 text-white rounded-xl h-11 px-4 focus-visible:ring-blue-500/50 font-mono" />
                              </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Form Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 md:pl-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={addColumn} 
            className="h-14 px-8 rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white w-full sm:w-auto font-medium transition-all gap-2"
          >
            <Plus className="h-5 w-5 text-indigo-400" /> Add Another Column
          </Button>
          <Button 
            type="submit" 
            disabled={loading} 
            className="h-14 px-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25 transition-all duration-200 w-full sm:w-auto font-bold text-lg hidden sm:flex"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <TableIcon className="h-5 w-5 mr-3" />}
            {loading ? "Creating..." : "Create Table"}
          </Button>
        </div>
        
        {/* Mobile Sticky Footer */}
        <div className="sm:hidden fixed bottom-6 left-6 right-6 z-50">
          <Button 
            type="submit" 
            disabled={loading} 
            className="h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/50 border border-blue-400/20 w-full font-bold text-lg text-white"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <TableIcon className="h-5 w-5 mr-3" />}
            {loading ? "Creating..." : "Create Table"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
