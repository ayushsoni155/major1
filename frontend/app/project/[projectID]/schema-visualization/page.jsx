"use client";
import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Database, Key, Link as LinkIcon, Hash, Layers } from "lucide-react";
import { useProjects } from "@/providers/ProjectContext";
import axios from "@/utils/axios";
import useSWR from "swr";
import { motion } from "motion/react";

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

const DatabaseSchemaNode = ({ data }) => {
  const schema = data?.schema || [];
  return (
    <div className="glass-card rounded-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] bg-[#0A0A10]/80 backdrop-blur-xl w-[280px] overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex items-center gap-3 bg-white/[0.03] border-b border-white/10 px-4 py-3 relative z-10">
        <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Database size={16} className="text-violet-400" />
        </div>
        <span className="font-bold text-sm text-white tracking-wide">{data?.label || "No Name"}</span>
      </div>
      
      <div className="p-3 relative z-10 grid gap-1">
        {schema.map((col, i) => (
          <div
            key={i}
            className="group/col relative flex items-center justify-between text-xs py-2 px-3 rounded-xl hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/[0.05]"
          >
            <Handle
              type="target"
              id={col.title}
              position={Position.Left}
              className="w-2 h-2 !bg-indigo-400 !border-2 !border-[#0A0A10] group-hover/col:!w-3 group-hover/col:!h-3 transition-all -ml-1"
            />
            <div className="flex items-center gap-2">
              {col.key === "PK" ? (
                <Key size={14} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              ) : col.key === "FK" ? (
                <LinkIcon size={14} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              ) : (
                <Hash size={14} className="text-zinc-500" />
              )}
              <span className="font-medium text-zinc-300 group-hover/col:text-white transition-colors">{col.title}</span>
            </div>
            <span className="text-zinc-500 font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">{col.type}</span>
            <Handle
              type="source"
              id={col.title}
              position={Position.Right}
              className="w-2 h-2 !bg-violet-400 !border-2 !border-[#0A0A10] group-hover/col:!w-3 group-hover/col:!h-3 transition-all -mr-1"
            />
          </div>
        ))}
        {schema.length === 0 && (
          <div className="text-center py-4 text-xs text-zinc-500">
            No columns defined
          </div>
        )}
      </div>
    </div>
  );
};

export default function SchemaVisualizer() {
  const { selectedProject } = useProjects();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const projectId = selectedProject?.project_id;
  const { data, error, isLoading } = useSWR(
    projectId ? `/schema/${projectId}/schema-structure` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  useEffect(() => {
    if (!data) return;
    const apiNodes = (data.nodes || []).map((node) => ({
      id: node.id,
      type: node.type || "databaseSchema",
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node.data?.label || "No Name",
        schema: node.data?.schema || [],
      },
    }));

    const apiEdges = (data.edges || []).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      animated: edge.animated ?? true,
      type: edge.type || "smoothstep",
      style: edge.style || { stroke: "#8b5cf6", strokeWidth: 2, filter: "drop-shadow(0 0 5px rgba(139,92,246,0.5))" },
      markerEnd: edge.markerEnd || {
        type: MarkerType.ArrowClosed,
        color: "#8b5cf6",
      },
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
            style: { stroke: "#8b5cf6", strokeWidth: 2, filter: "drop-shadow(0 0 5px rgba(139,92,246,0.5))" },
          },
          eds
        )
      ),
    [setEdges]
  );

  if (isLoading)
    return (
      <div className="flex flex-1 items-center justify-center p-6 h-[calc(100vh-4rem)]">
        <div className="glass-card flex flex-col items-center justify-center w-full h-full rounded-[2rem] border-white/10 animate-pulse bg-white/[0.02]">
          <Layers className="w-12 h-12 text-violet-500/50 mb-4 animate-bounce" />
          <div className="text-zinc-500 text-lg font-medium">Loading Schema Visualization...</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-1 items-center justify-center p-6 h-[calc(100vh-4rem)]">
        <div className="glass-card flex flex-col items-center justify-center w-full max-w-lg p-8 rounded-[2rem] border-red-500/20 bg-red-500/5">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <Layers className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-white text-lg font-bold mb-2">Failed to load schema</div>
          <div className="text-zinc-400 text-center text-sm">There was a problem loading the database schema for this project.</div>
        </div>
      </div>
    );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-1 flex-col p-6 h-[calc(100vh-4rem)]"
    >
      {/* Header */}
      <div className="glass-card px-6 py-4 rounded-2xl border-white/10 flex items-center justify-between mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30">
            <Layers className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              {data?.schemaName || "Database Schema"}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Visual representation of your tables and relationships</p>
          </div>
        </div>
      </div>

      {/* Visualizer Area */}
      <div className="glass-card flex-1 rounded-[2rem] border-white/10 relative overflow-hidden shadow-2xl">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ databaseSchema: DatabaseSchemaNode }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          className="bg-[#08080f]"
        >
          <Background color="#3f3f46" gap={20} size={1.5} />
        </ReactFlow>
      </div>
    </motion.div>
  );
}
