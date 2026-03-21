"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Play, AlertTriangle, TerminalSquare, Key, Link2 } from "lucide-react";
import axios from "@/utils/axios";
import { useProjects } from "@/providers/ProjectContext";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { autocompletion } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';


export default function SqlEditorPage() {
  const { selectedProject } = useProjects();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Ready");
  // Change: State to hold the CodeMirror theme object directly
  const [editorTheme, setEditorTheme] = useState(oneDark);

  const projectId = selectedProject?.project_id;

  // Change: Replaced theme detection to be more robust.
  // This effect now checks localStorage and observes the <html> element for class changes (e.g., class="dark").
  // This ensures the editor theme syncs with your app's theme toggle.
  useEffect(() => {
    const applyTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setEditorTheme(isDark ? oneDark : EditorView.theme({}, { dark: false }));
    };

    applyTheme(); // Set initial theme on mount

    // Observe changes to the <html> element's class attribute
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          applyTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true, // we are interested in attribute changes
    });

    // Cleanup observer on component unmount
    return () => observer.disconnect();
  }, []);


  const handleRunQuery = async () => {
    if (!query.trim()) {
      setStatusMessage("Please enter a valid SQL query");
      return;
    }
    setLoading(true);
    setError(null);
    setOutput(null);
    setExecutionTime(null);
    setStatusMessage("Executing query...");

    const startTime = performance.now();
    try {
      const res = await axios.post(`/query/${projectId}/sql/execute`, { query });
      const endTime = performance.now();
      setOutput(res.data.data);
      setExecutionTime(((endTime - startTime) / 1000).toFixed(3));
      setStatusMessage("Query executed successfully");
    } catch (err) {
      const endTime = performance.now();
      setExecutionTime(((endTime - startTime) / 1000).toFixed(3));
      const errorMsg = err.response?.data?.data?.error || err.response?.data?.message || "Error executing query";
      setError(errorMsg);
      setStatusMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderOutput = () => {
    if (error) {
      return (
        <Alert variant="destructive" className="mt-2 border-destructive bg-destructive/10 text-destructive-foreground">
          <AlertTitle className="flex items-center gap-2">
            <AlertTriangle size={18} /> Error
          </AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
          <AlertDescription className="text-sm mt-1">
            Execution Time: <span>{executionTime} s</span>
          </AlertDescription>
        </Alert>
      );
    }

    if (!output) return null;

    if (Array.isArray(output.data || output)) {
      const rows = output.data || output;
      // Handle case with no results gracefully
      if (rows.length === 0) {
        return (
          <Alert variant="default" className="mt-2 border-primary bg-primary/10">
            <AlertTitle className="flex items-center gap-2 text-primary">
              <TerminalSquare size={18} /> Empty Result
            </AlertTitle>
            <AlertDescription className="text-sm">
              The query executed successfully but returned no rows.
            </AlertDescription>
            <AlertDescription className="text-sm mt-1">
              Execution Time: <span className="text-primary">{executionTime} s</span>
            </AlertDescription>
          </Alert>
        );
      }
      const headers = Object.keys(rows[0] || {});

      return (
        // Change: Removed the intermediate <div className="min-w-max">.
        // The `overflow-auto` on this parent div is now sufficient to handle the table's width,
        // preventing the entire page from scrolling horizontally.
        <div className="overflow-auto rounded-md border border-border bg-transparent flex-1">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-primary/10 dark:bg-primary/20 sticky top-0 z-10">
                  {headers.map((header) => (
                    <TableHead
                      key={header}
                      className="capitalize text-sm font-semibold px-4 py-2 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {header.toLowerCase().includes("id") && <Key size={14} className="text-primary-foreground" />}
                        {header.toLowerCase().includes("fk") && <Link2 size={14} className="text-secondary-foreground" />}
                        {header}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-muted/50 dark:bg-muted/30" : ""
                    } hover:bg-muted/80 dark:hover:bg-muted/50 transition-colors`}
                  >
                    {headers.map((header) => (
                      <TableCell
                        key={header}
                        className="text-sm px-4 py-2 truncate max-w-[250px] whitespace-nowrap"
                      >
                        {String(row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      );
    }

    return (
      <Alert
        variant="default"
        className={`mt-2 border-l-4 ${
          output.message?.toLowerCase().includes("warning")
            ? "border-amber-500 bg-amber-500/10 text-amber-500"
            : "border-primary bg-primary/10 text-primary"
        }`}
      >
        <AlertTitle className="flex items-center gap-2">
          <TerminalSquare size={18} /> Output
        </AlertTitle>
        <AlertDescription className="text-sm text-foreground">
          {typeof output === "string" ? output : output.message || JSON.stringify(output, null, 2)}
        </AlertDescription>
        <AlertDescription className="text-sm mt-1 text-foreground">
          Execution Time: <span className="text-primary">{executionTime} s</span>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="flex flex-col h-[94vh] bg-background dark:bg-background p-2">
      <Card className="flex flex-col flex-1 shadow-xl border-border rounded-xl overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b border-border">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <TerminalSquare size={24} className="text-primary" /> SQL Editor
          </CardTitle>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex flex-col flex-1 gap-2 p-2 overflow-hidden">
          {/* Editor */}
          <div className="flex-[0.4] border border-border rounded-md overflow-hidden">
            <CodeMirror
              value={query}
              onChange={setQuery}
              extensions={[sql(), autocompletion()]}
              // Change: Switched to the new 'editorTheme' state
              theme={editorTheme}
              placeholder="Write your SQL query here..."
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                bracketMatching: true,
              }}
              className="h-full text-sm"
            />
          </div>

          {/* Run button + status */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              error
                ? "text-destructive"
                : statusMessage === "Ready"
                ? "text-muted-foreground"
                : "text-primary"
            }`}>
              {statusMessage}{executionTime && ` | Execution Time: ${executionTime}s`}
            </span>

            <Button
              onClick={handleRunQuery}
              disabled={loading || !projectId}
              className="flex items-center gap-2 px-6 py-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />} Run Query
            </Button>
          </div>

          {/* Output */}
          <div className="flex-1 overflow-auto bg-muted/10 dark:bg-muted/20 rounded-md p-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/50">
            {renderOutput()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}