"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Play, AlertTriangle, TerminalSquare, Key, Link2, Database, Code2, History, Download, Clock, ChevronRight } from "lucide-react";
import axios from "@/utils/axios";
import { useProjects } from "@/providers/ProjectContext";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { autocompletion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url) => axios.get(url).then((r) => r.data.data);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function exportCSV(headers, rows, filename = "query-results") {
  const head = headers.join(",");
  const body = rows.map(row =>
    headers.map(h => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  );
  const blob = new Blob([[head, ...body].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
}

export default function SqlEditorPage() {
  const { selectedProject } = useProjects();
  const [query, setQuery] = useState("SELECT * FROM customers LIMIT 10;");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [showHistory, setShowHistory] = useState(false);

  const projectId = selectedProject?.project_id;

  // SWR for query history — inject X-Project-ID header (required by database service)
  const projectHistoryFetcher = useCallback(
    (url) =>
      projectId
        ? axios
            .get(url, { headers: { "X-Project-ID": projectId } })
            .then((r) => r.data.data)
        : Promise.resolve({ history: [], total: 0 }),
    [projectId]
  );

  const { data: historyData, mutate: mutateHistory } = useSWR(
    projectId ? `/query/history?limit=20` : null,
    projectHistoryFetcher,
    { refreshInterval: 10000 }
  );
  const history = historyData?.history || [];

  const handleRunQuery = useCallback(async () => {
    if (!query.trim()) { toast.error("Please enter a SQL query"); return; }
    if (!projectId) { toast.error("No project selected"); return; }
    setLoading(true);
    setError(null);
    setOutput(null);
    setExecutionTime(null);
    setStatusMessage("Executing...");

    const start = performance.now();
    try {
      // Correct endpoint: POST /query/execute with X-Project-ID header
      const res = await axios.post(
        `/query/execute`,
        { query },
        { headers: { "X-Project-ID": projectId } }
      );
      const elapsed = ((performance.now() - start) / 1000).toFixed(3);
      // Backend: { data: { executionTimeMs, data: <rows|summary>, statementsExecuted } }
      const payload = res.data?.data;
      setOutput(payload?.data ?? payload);
      setExecutionTime(elapsed);
      setStatusMessage(`Success · ${payload?.statementsExecuted ?? 1} stmt`);
      mutateHistory();
    } catch (err) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(3);
      setExecutionTime(elapsed);
      const msg = err.response?.data?.data?.error || err.response?.data?.message || "Query error";
      setError(msg);
      setStatusMessage(msg.slice(0, 60));
    } finally {
      setLoading(false);
    }
  }, [query, projectId, mutateHistory]);

  // Ctrl+Enter keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunQuery();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRunQuery]);

  const renderOutput = () => {
    if (error) return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-sm">
        <div className="flex items-center gap-2 font-bold mb-2"><AlertTriangle size={14} /> Query Error</div>
        <div className="whitespace-pre-wrap text-red-300/80 text-xs leading-relaxed">{error}</div>
        <div className="mt-3 pt-3 border-t border-red-500/20 text-xs opacity-70">Execution time: {executionTime}s</div>
      </motion.div>
    );

    if (!output) return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
        <Database className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">Execute a query to see results</p>
        <p className="text-xs mt-1 opacity-60">Tip: Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">Ctrl</kbd>+<kbd className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">Enter</kbd> to run</p>
      </div>
    );

    // Non-SELECT result (INSERT, UPDATE, DELETE, CREATE, etc.)
    if (!Array.isArray(output) && typeof output === "object" && (output.message || output.command)) return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-sm">
        <div className="flex items-center gap-2 font-bold mb-1"><TerminalSquare size={14} /> {output.message || `${output.command} successful`}</div>
        {output.rowCount !== undefined && <div className="text-xs opacity-70 mt-1">{output.rowCount} row(s) affected</div>}
        <div className="text-xs opacity-70 mt-2">Execution time: {executionTime}s</div>
      </motion.div>
    );

    const rows = Array.isArray(output) ? output : (output.data || []);
    if (!Array.isArray(rows) || rows.length === 0) return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-sm">
        <div className="flex items-center gap-2 font-bold mb-1"><TerminalSquare size={14} /> Query successful (0 rows returned)</div>
        <div className="text-xs opacity-70 mt-2">Execution time: {executionTime}s</div>
      </motion.div>
    );

    const headers = Object.keys(rows[0] || {});
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-auto rounded-xl border border-white/10 bg-black/40 shadow-inner">
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5 sticky top-0 z-10">
          <span className="text-xs font-mono text-zinc-500">{rows.length} rows • {executionTime}s</span>
          <button
            onClick={() => exportCSV(headers, rows)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg transition-all"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
              {headers.map((h, i) => (
                <TableHead key={h} className="text-zinc-400 font-semibold tracking-wider whitespace-nowrap bg-black/30 py-2">
                  <div className="flex items-center gap-1.5">
                    {h.toLowerCase().includes("id") && <Key size={11} className="text-amber-400" />}
                    {h.toLowerCase().includes("fk") && <Link2 size={11} className="text-blue-400" />}
                    <span className="uppercase text-xs">{h}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx} className="border-white/5 hover:bg-white/[0.04] transition-colors">
                {headers.map(h => (
                  <TableCell key={h} className="text-xs font-mono text-zinc-300 px-4 py-2.5 whitespace-nowrap max-w-[200px] truncate">
                    {row[h] === null ? (
                      <span className="text-zinc-600 italic">null</span>
                    ) : typeof row[h] === "boolean" ? (
                      <span className={row[h] ? "text-emerald-400" : "text-red-400"}>{String(row[h])}</span>
                    ) : String(row[h])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex flex-1 flex-col p-4 sm:p-6 max-w-[1600px] mx-auto w-full gap-4 sm:gap-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 sm:p-5 rounded-2xl border-white/10 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25">
            <TerminalSquare className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">SQL Editor</h1>
            <p className="text-zinc-500 text-xs mt-0.5 hidden sm:block">Execute raw SQL •{" "}
              <kbd className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-zinc-400">Ctrl</kbd>+
              <kbd className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-zinc-400">Enter</kbd> to run
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="hidden md:flex flex-col items-end mr-1">
            <span className={`text-xs font-semibold ${error ? "text-red-400" : statusMessage === "Ready" ? "text-zinc-600" : "text-emerald-400"}`}>
              {statusMessage}
            </span>
            {executionTime && <span className="text-xs text-zinc-600">in {executionTime}s</span>}
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`hidden md:flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-xl border text-sm font-medium transition-all ${showHistory ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/8"}`}
          >
            <History className="w-4 h-4" /> <span className="hidden sm:inline">History</span>
          </button>
          <Button
            onClick={handleRunQuery}
            disabled={loading || !projectId}
            className="h-9 sm:h-10 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg gap-2 transition-all flex-1 sm:flex-none"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {loading ? "Running..." : "Run"}
          </Button>
        </div>
      </motion.div>

      {/* Editor + Results — stacked on mobile, side-by-side on desktop */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-4 sm:gap-5 flex-1">
        {/* Editor */}
        <div className="glass-card rounded-2xl border-white/10 overflow-hidden flex flex-col shadow-2xl min-h-[260px] sm:min-h-[320px] lg:flex-1">
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Editor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto w-full bg-[#1e1e2e] min-h-[200px]">
            <CodeMirror
              value={query}
              onChange={setQuery}
              extensions={[sql(), autocompletion()]}
              theme={oneDark}
              placeholder={"-- Write your SQL query here...\nSELECT * FROM users LIMIT 10;"}
              basicSetup={{ lineNumbers: true, highlightActiveLine: true, bracketMatching: true, tabSize: 2 }}
              className="h-full text-[13px] sm:text-[14px] [&_.cm-scroller]:font-mono [&_.cm-editor]:h-full"
            />
          </div>
        </div>

        {/* Results */}
        <div className="glass-card rounded-2xl border-white/10 overflow-hidden flex flex-col shadow-2xl min-h-[200px] sm:min-h-[280px] lg:flex-1">
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Results</span>
            </div>
            {output && !error && (() => {
              const rows = Array.isArray(output) ? output : (output.data || []);
              return Array.isArray(rows) && rows.length > 0 ? (
                <span className="text-xs font-mono text-zinc-600 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                  {rows.length} rows
                </span>
              ) : null;
            })()}
          </div>
          <div className="flex-1 overflow-auto p-3 sm:p-4">
            {renderOutput()}
          </div>
        </div>

        {/* History Panel — desktop only */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: 20 }}
              animate={{ opacity: 1, width: 260, x: 0 }}
              exit={{ opacity: 0, width: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:flex glass-card rounded-2xl border-white/10 overflow-hidden flex-col shadow-2xl shrink-0"
            >
              <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Query History</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-xs">No history yet</div>
                ) : history.map((h, i) => (
                  <button
                    key={h.id || i}
                    onClick={() => setQuery(h.query_text)}
                    className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                  >
                    <code className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors line-clamp-2 block">
                      {h.query_text}
                    </code>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${h.query_status === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {h.query_status}
                      </span>
                      {h.execution_time_ms && <span className="text-[10px] text-zinc-600">{h.execution_time_ms}ms</span>}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}