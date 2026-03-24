"use client";
import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Database, Key, Link as LinkIcon, Hash, Layers, RefreshCw } from "lucide-react";
import { useProjects } from "@/providers/ProjectContext";
import axios from "@/utils/axios";
import useSWR from "swr";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

const DatabaseSchemaNode = ({ data }) => {
  const schema = data?.schema || [];
  return (
    <div className="rounded-2xl border border-white/10 shadow-2xl bg-[#0A0A10]/95 backdrop-blur-xl w-[260px] overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex items-center gap-3 bg-white/[0.03] border-b border-white/10 px-4 py-3 relative z-10">
        <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 flex-shrink-0">
          <Database size={14} className="text-violet-400" />
        </div>
        <span className="font-bold text-sm text-white tracking-wide truncate">{data?.label || "Table"}</span>
        <span className="ml-auto text-[10px] text-zinc-600 font-mono flex-shrink-0">{schema.length}</span>
      </div>
      <div className="p-2 relative z-10 grid gap-0.5 max-h-[280px] overflow-y-auto">
        {schema.map((col, i) => (
          <div key={i} className="relative flex items-center justify-between text-xs py-1.5 px-3 rounded-lg hover:bg-white/[0.05] transition-colors">
            <Handle type="target" id={col.title} position={Position.Left} className="!w-2 !h-2 !bg-indigo-400 !border-2 !border-[#0A0A10] !-left-1" />
            <div className="flex items-center gap-2 min-w-0">
              {col.key === "PK" ? (
                <Key size={11} className="text-amber-400 flex-shrink-0" />
              ) : col.key === "FK" ? (
                <LinkIcon size={11} className="text-cyan-400 flex-shrink-0" />
              ) : (
                <Hash size={11} className="text-zinc-600 flex-shrink-0" />
              )}
              <span className={`font-medium truncate text-[11px] ${col.key === "PK" ? "text-amber-200" : col.key === "FK" ? "text-cyan-200" : "text-zinc-300"}`}>
                {col.title}
              </span>
            </div>
            <span className="text-zinc-600 font-mono text-[10px] ml-2 flex-shrink-0 uppercase">{col.type?.split(" ")[0]?.split("(")[0]}</span>
            <Handle type="source" id={col.title} position={Position.Right} className="!w-2 !h-2 !bg-violet-400 !border-2 !border-[#0A0A10] !-right-1" />
          </div>
        ))}
        {schema.length === 0 && (
          <div className="text-center py-3 text-xs text-zinc-600">No columns defined</div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = { databaseSchema: DatabaseSchemaNode };

export default function SchemaVisualizer() {
  const { selectedProject } = useProjects();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const projectId = selectedProject?.project_id;

  // Correct endpoint: GET /schema/:projectId
  const { data, error, isLoading, mutate } = useSWR(
    projectId ? `/schema/${projectId}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  useEffect(() => {
    if (!data) return;
    const COLS = 3;
    const COL_W = 320;
    const ROW_H = 420;

    const apiNodes = (data.nodes || []).map((node, idx) => ({
      id: node.id,
      type: "databaseSchema",
      position: {
        x: (idx % COLS) * COL_W + 40,
        y: Math.floor(idx / COLS) * ROW_H + 40,
      },
      data: {
        label: node.data?.label || node.id,
        schema: node.data?.schema || [],
      },
    }));

    const apiEdges = (data.edges || []).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      animated: true,
      type: "smoothstep",
      style: { stroke: "#8b5cf6", strokeWidth: 2, filter: "drop-shadow(0 0 5px rgba(139,92,246,0.4))" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
    }));

    setNodes(apiNodes);
    setEdges(apiEdges);
  }, [data, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
            style: { stroke: "#8b5cf6", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  if (!projectId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 min-h-[60vh]">
        <p className="text-zinc-500 text-sm">Select a project to view its schema.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-pulse">
            <Layers className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-zinc-500 text-sm">Loading schema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Layers className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Failed to load schema</h3>
            <p className="text-sm text-zinc-500">Could not fetch the database schema for this project.</p>
          </div>
          <Button onClick={() => mutate()} className="bg-violet-600 hover:bg-violet-500 rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const isEmpty = !data?.nodes?.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col p-4 sm:p-6 gap-4"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* Header */}
      <div className="glass-card px-4 sm:px-5 py-3 rounded-2xl border-white/10 flex items-center justify-between shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.08] to-indigo-500/[0.08] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">
              {data?.schemaName ? `Schema · ${data.schemaName}` : "Schema Visualization"}
            </h1>
            <p className="text-xs text-zinc-500 hidden sm:block">
              {data?.nodes?.length || 0} tables · {data?.edges?.length || 0} relationships
            </p>
          </div>
        </div>
        <button
          onClick={() => mutate()}
          className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-all text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 rounded-2xl border border-white/[0.07] relative overflow-hidden shadow-2xl min-h-[300px] bg-[#08080f]">
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mb-5">
              <Database className="w-7 h-7 text-zinc-700" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Tables Found</h3>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              Create tables in your project to see the entity-relationship diagram here.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            className="bg-[#08080f]"
          >
            <Background color="#27272a" gap={24} size={1} />
            <Controls className="[&_.react-flow\_\_controls-button]:bg-[#0d0d14] [&_.react-flow\_\_controls-button]:border-white/10 [&_.react-flow\_\_controls-button]:text-zinc-400 [&_.react-flow\_\_controls-button:hover]:bg-white/10 [&_.react-flow\_\_controls-button:hover]:text-white" />
            <MiniMap
              nodeColor="#7c3aed"
              maskColor="rgba(8,8,15,0.75)"
              className="!bg-[#0d0d14] !border !border-white/10 !rounded-xl"
            />
          </ReactFlow>
        )}
      </div>
    </motion.div>
  );
}
