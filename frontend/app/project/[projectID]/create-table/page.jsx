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
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Trash2, Info, Loader2 } from "lucide-react";
import { useTables } from "@/providers/TableContext";
import { useMediaQuery } from "react-responsive";

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

const CreateTablePage = () => {
  const params = useParams();
  const projectId = params?.projectID;
  const { mutate } = useTables();
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([
    {
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

  const isDesktop = useMediaQuery({ minWidth: 768 });

  const handleColumnChange = (index, field, value) => {
    const newCols = [...columns];
    if (field === "isPrimaryKey") {
      newCols[index].isPrimaryKey = value;
      if (value) newCols[index].isNullable = false;
    } else {
      newCols[index][field] = value;
    }
    setColumns(newCols);
  };

  const addColumn = () => {
    setColumns([
      ...columns,
      {
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

  const removeColumn = (index) => setColumns(columns.filter((_, i) => i !== index));

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
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Create a New Table</h1>
          <p className="text-muted-foreground text-lg">
            Define schema for project: <span className="font-mono text-primary">{projectId}</span>
          </p>
        </header>

        {/* Table Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="tableName">Table Name</Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g., users, posts"
              required
              className="w-full"
            />
          </div>

          {/* Columns */}
          <div className="space-y-8">
            {columns.map((col, index) => (
              <div key={index} className="p-6 border rounded-xl bg-muted/30 space-y-6">
                {/* Column Name & Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Column Name</Label>
                    <Input
                      value={col.name}
                      onChange={(e) =>
                        handleColumnChange(index, "name", e.target.value.toLowerCase())
                      }
                      placeholder="id, email, created_at"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Type</Label>
                    <Select
                      onValueChange={(v) => handleColumnChange(index, "dataType", v)}
                      defaultValue={col.dataType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ARRAY baseType */}
                {col.dataType === "ARRAY" && (
                  <div className="space-y-2">
                    <Label>Array Base Type</Label>
                    <Input
                      value={col.baseType}
                      onChange={(e) => handleColumnChange(index, "baseType", e.target.value)}
                      placeholder="e.g., INTEGER, TEXT"
                      className="w-full"
                    />
                  </div>
                )}

                {/* ENUM values */}
                {col.dataType === "ENUM" && (
                  <div className="space-y-2">
                    <Label>Enum Values (comma-separated)</Label>
                    <Input
                      value={col.enumValues.join(",")}
                      onChange={(e) =>
                        handleColumnChange(index, "enumValues", e.target.value.split(","))
                      }
                      placeholder="active,inactive,pending"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Constraints */}
                <div className="space-y-2">
                  <Label>Constraints</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(CONSTRAINTS).map(([key, { label }]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          checked={col[key]}
                          onCheckedChange={(v) => handleColumnChange(index, key, v)}
                          disabled={key === "isNullable" && col.isPrimaryKey}
                        />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Default & Check */}
                {col.hasDefault && (
                  <div className="space-y-2">
                    <Label>Default Value</Label>
                    <Input
                      value={col.defaultValue}
                      onChange={(e) => handleColumnChange(index, "defaultValue", e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                {col.hasCheck && (
                  <div className="space-y-2">
                    <Label>Check Expression</Label>
                    <Input
                      value={col.check}
                      onChange={(e) => handleColumnChange(index, "check", e.target.value)}
                      placeholder="e.g., age > 18"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Foreign Key */}
                {col.isForeignKey && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>References Table</Label>
                      <Input
                        value={col.referencesTable}
                        onChange={(e) => handleColumnChange(index, "referencesTable", e.target.value)}
                        placeholder="e.g., users"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>References Column</Label>
                      <Input
                        value={col.referencesColumn}
                        onChange={(e) => handleColumnChange(index, "referencesColumn", e.target.value)}
                        placeholder="e.g., id"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Remove Column */}
                {columns.length > 1 && (
                  <div className="flex justify-end">
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeColumn(index)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove Column
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form Footer */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button type="button" variant="outline" onClick={addColumn} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" /> Add Column
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Create Table"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CreateTablePage;
