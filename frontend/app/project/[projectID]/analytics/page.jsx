"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// react-grid-layout is CommonJS — using dynamic import of our wrapper
// component (DashboardGrid.jsx) is the only production-safe approach.
// The wrapper does: import RGL from 'react-grid-layout'; const GridLayout = WidthProvider(Responsive);
const GridLayout = dynamic(
  () => import("@/components/analytics/DashboardGrid"),
  { ssr: false, loading: () => null }
);
import {
  BarChart2, LineChart as LineIcon, PieChart as PieIcon,
  ScatterChart, AreaChart as AreaIcon, Radar as RadarIcon,
  Hash, Plus, Save, Download, RefreshCw, Settings2,
  Trash2, Lock, Unlock, X, ChevronDown, Palette,
  TrendingUp, Database, LayoutDashboard, Eye, EyeOff,
  FileDown, Loader2, GripVertical, Info,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart as ReScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LabelList,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useProjects } from "@/providers/ProjectContext";
import axios from "@/utils/axios";
import useSWR from "swr";


// ─── Colour Palettes ────────────────────────────────────────────────────────
const PALETTES = {
  Violet:  ["#8b5cf6","#a78bfa","#7c3aed","#c084fc","#ddd6fe","#6d28d9","#ede9fe","#4c1d95","#f5f3ff","#5b21b6"],
  Ocean:   ["#0ea5e9","#38bdf8","#0284c7","#7dd3fc","#0369a1","#bae6fd","#0c4a6e","#e0f2fe","#075985","#f0f9ff"],
  Sunset:  ["#f59e0b","#fbbf24","#d97706","#fde68a","#b45309","#fef3c7","#92400e","#fffbeb","#78350f","#f97316"],
  Emerald: ["#10b981","#34d399","#059669","#6ee7b7","#047857","#a7f3d0","#065f46","#d1fae5","#064e3b","#14b8a6"],
  Rose:    ["#f43f5e","#fb7185","#e11d48","#fda4af","#be123c","#fecdd3","#9f1239","#fff1f2","#881337","#f97316"],
  Slate:   ["#64748b","#94a3b8","#475569","#cbd5e1","#334155","#e2e8f0","#1e293b","#f1f5f9","#0f172a","#6366f1"],
  Neon:    ["#22d3ee","#a3e635","#f472b6","#fb923c","#facc15","#4ade80","#f87171","#818cf8","#34d399","#e879f9"],
  Mono:    ["#ffffff","#d4d4d8","#a1a1aa","#71717a","#52525b","#3f3f46","#27272a","#18181b","#09090b","#000000"],
};

const CHART_TYPES = [
  { value: "bar",     label: "Bar",     Icon: BarChart2   },
  { value: "line",    label: "Line",    Icon: LineIcon    },
  { value: "area",    label: "Area",    Icon: AreaIcon    },
  { value: "pie",     label: "Pie",     Icon: PieIcon     },
  { value: "donut",   label: "Donut",   Icon: PieIcon     },
  { value: "scatter", label: "Scatter", Icon: ScatterChart},
  { value: "radar",   label: "Radar",   Icon: RadarIcon   },
  { value: "kpi",     label: "KPI",     Icon: Hash        },
];

const AGGREGATIONS = ["COUNT", "SUM", "AVG", "MIN", "MAX"];
const NUMERIC_TYPES = ["integer","bigint","numeric","real","double precision","smallint","decimal","float","float4","float8","int2","int4","int8"];

const DEFAULT_WIDGET_CONFIG = {
  title: "New Chart",
  subtitle: "",
  table: "",
  xField: "",
  yField: "",
  aggregation: "COUNT",
  palette: "Violet",
  showLegend: true,
  showGrid: true,
  showDataLabels: false,
  showTooltip: true,
  limit: 20,
  barLayout: "vertical",   // vertical | horizontal
  areaFill: true,
};

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b]/95 border border-white/10 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-xs">
      {label !== undefined && <p className="text-zinc-400 mb-1 font-medium">{String(label)}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-zinc-300">{p.name}:</span>
          <span className="text-white font-bold">{typeof p.value === "number" ? p.value.toLocaleString() : String(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Chart Renderer ──────────────────────────────────────────────────────────
function ChartRenderer({ type, data, config }) {
  const colors = PALETTES[config.palette] || PALETTES.Violet;
  const { showLegend, showGrid, showDataLabels, showTooltip, title } = config;

  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
      <Database className="w-8 h-8 opacity-40" />
      <p className="text-xs">No data — configure the widget</p>
    </div>
  );

  const numericData = data.map(d => ({ ...d, value: parseFloat(d.value) || 0 }));

  const commonTooltip = showTooltip ? <Tooltip content={<CustomTooltip />} /> : null;
  const commonLegend = showLegend ? <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} /> : null;
  const commonGrid = showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" /> : null;
  const xAxisProps = { dataKey: "label", tick: { fontSize: 10, fill: "#71717a" }, axisLine: false, tickLine: false };
  const yAxisProps = { tick: { fontSize: 10, fill: "#71717a" }, axisLine: false, tickLine: false, width: 50 };

  if (type === "kpi") {
    const total = numericData.reduce((s, d) => s + d.value, 0);
    const displayVal = config.aggregation === "AVG" && numericData.length
      ? (total / numericData.length).toFixed(2)
      : total;
    const formatted = parseFloat(displayVal).toLocaleString(undefined, { maximumFractionDigits: 2 });
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
        <p className="text-4xl font-black text-white tracking-tight" style={{ color: colors[0] }}>{formatted}</p>
        <p className="text-xs text-zinc-500 uppercase tracking-widest">{config.aggregation} · {numericData.length} entries</p>
      </div>
    );
  }

  if (type === "pie" || type === "donut") {
    const total = numericData.reduce((s, d) => s + d.value, 0);
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {commonTooltip}
          {commonLegend}
          <Pie
            data={numericData} dataKey="value" nameKey="label"
            cx="50%" cy="50%"
            innerRadius={type === "donut" ? "45%" : 0}
            outerRadius="75%"
            paddingAngle={2}
            labelLine={showDataLabels}
            label={showDataLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
          >
            {numericData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} stroke="transparent" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "radar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={numericData}>
          <PolarGrid stroke="#ffffff15" />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "#71717a" }} />
          <PolarRadiusAxis tick={{ fontSize: 9, fill: "#52525b" }} />
          {commonTooltip}
          {commonLegend}
          <Radar name={title || "Value"} dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "scatter") {
    const scatterData = numericData.map((d, i) => ({ x: i, y: d.value, label: d.label }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ReScatterChart>
          {commonGrid}
          {commonTooltip}
          <XAxis dataKey="x" type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={50} />
          <Scatter name={title || "Data"} data={scatterData} fill={colors[0]}>
            {scatterData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Scatter>
        </ReScatterChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={numericData}>
          {commonGrid}
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          {commonTooltip}
          {commonLegend}
          <defs>
            <linearGradient id={`areaGrad-${config.palette}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.35} />
              <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" name={title || "Value"}
            stroke={colors[0]} strokeWidth={2.5}
            fill={config.areaFill ? `url(#areaGrad-${config.palette})` : "transparent"}
          >
            {showDataLabels && <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: "#a1a1aa" }} />}
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={numericData}>
          {commonGrid}
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          {commonTooltip}
          {commonLegend}
          <Line type="monotone" dataKey="value" name={title || "Value"}
            stroke={colors[0]} strokeWidth={2.5} dot={{ r: 4, fill: colors[0], strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          >
            {showDataLabels && <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: "#a1a1aa" }} />}
          </Line>
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar
  if (config.barLayout === "horizontal") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={numericData} layout="vertical">
          {commonGrid}
          <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
          {commonTooltip}
          {commonLegend}
          <Bar dataKey="value" name={title || "Value"} radius={[0, 6, 6, 0]}>
            {numericData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            {showDataLabels && <LabelList dataKey="value" position="right" style={{ fontSize: 9, fill: "#a1a1aa" }} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={numericData}>
        {commonGrid}
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        {commonTooltip}
        {commonLegend}
        <Bar dataKey="value" name={title || "Value"} radius={[6, 6, 0, 0]}>
          {numericData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          {showDataLabels && <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: "#a1a1aa" }} />}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Widget Card ─────────────────────────────────────────────────────────────
function WidgetCard({ widget, isEditing, onDelete, onOpenConfig, data, loading }) {
  const colors = PALETTES[widget.config.palette] || PALETTES.Violet;
  return (
    <div className="h-full flex flex-col glass-card rounded-2xl border border-white/10 overflow-hidden group relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] shrink-0 bg-white/[0.02]">
        {isEditing && (
          <div className="drag-handle cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors mr-2 shrink-0">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{widget.config.title || "Untitled"}</p>
          {widget.config.subtitle && <p className="text-[10px] text-zinc-500 truncate">{widget.config.subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {loading && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
          {data?.length > 0 && !loading && (
            <span className="text-[10px] text-zinc-600 bg-white/5 border border-white/5 px-1.5 rounded font-mono">{data.length}</span>
          )}
          <button onClick={() => onOpenConfig(widget)}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          {isEditing && (
            <button onClick={() => onDelete(widget.id)}
              className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 overflow-hidden p-2" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400/50" />
          </div>
        ) : (
          <ChartRenderer type={widget.type} data={data || []} config={widget.config} />
        )}
      </div>

      {/* Colour bar accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[2] || colors[0]})` }} />
    </div>
  );
}

// ─── Config Panel ─────────────────────────────────────────────────────────────
function ConfigPanel({ widget, tables, projectId, onSave, onClose }) {
  const [cfg, setCfg] = useState(widget.config);
  const [type, setType] = useState(widget.type);
  const [columns, setColumns] = useState([]);
  const [loadingCols, setLoadingCols] = useState(false);
  const [activeTab, setActiveTab] = useState("data"); // data | style | display

  useEffect(() => {
    if (!cfg.table || !projectId) return;
    setLoadingCols(true);
    axios.get(`/analytics/tables/${cfg.table}/columns`, { headers: { "X-Project-ID": projectId } })
      .then(r => setColumns(r.data.data || []))
      .catch(() => setColumns([]))
      .finally(() => setLoadingCols(false));
  }, [cfg.table, projectId]);

  const numericCols = columns.filter(c => NUMERIC_TYPES.includes(c.data_type));
  const set = (key, val) => setCfg(p => ({ ...p, [key]: val }));

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed right-0 top-0 bottom-0 w-80 z-50 flex flex-col glass-card border-l border-white/10 shadow-2xl backdrop-blur-2xl bg-[#0f0f1a]/95"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Configure Widget</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        {[["data","Data"],["style","Style"],["display","Display"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all ${activeTab === tab
              ? "text-violet-400 border-b-2 border-violet-500" : "text-zinc-500 hover:text-zinc-300"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* DATA TAB */}
        {activeTab === "data" && (
          <>
            {/* Chart type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Chart Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {CHART_TYPES.map(({ value, label, Icon }) => (
                  <button key={value} onClick={() => setType(value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[9px] font-semibold transition-all ${type === value
                      ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
                      : "bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10"}`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Title</label>
              <input value={cfg.title} onChange={e => set("title", e.target.value)}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-violet-500/50 placeholder-zinc-600"
                placeholder="Widget title" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Subtitle</label>
              <input value={cfg.subtitle} onChange={e => set("subtitle", e.target.value)}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-violet-500/50 placeholder-zinc-600"
                placeholder="Optional subtitle" />
            </div>

            {/* Table */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Table *</label>
              <select value={cfg.table} onChange={e => { set("table", e.target.value); set("xField",""); set("yField",""); }}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-violet-500/50">
                <option value="" className="bg-[#18181b]">Select table…</option>
                {tables.map(t => <option key={t} value={t} className="bg-[#18181b]">{t}</option>)}
              </select>
            </div>

            {/* X Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">X / Group By *</label>
              <select value={cfg.xField} onChange={e => set("xField", e.target.value)} disabled={!columns.length}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-violet-500/50 disabled:opacity-50">
                <option value="" className="bg-[#18181b]">Select field…</option>
                {columns.map(c => <option key={c.column_name} value={c.column_name} className="bg-[#18181b]">{c.column_name} ({c.data_type})</option>)}
              </select>
            </div>

            {/* Y Field */}
            {type !== "kpi" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Y / Value (optional)</label>
                <select value={cfg.yField} onChange={e => set("yField", e.target.value)} disabled={!numericCols.length}
                  className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-violet-500/50 disabled:opacity-50">
                  <option value="" className="bg-[#18181b]">None (count rows)</option>
                  {numericCols.map(c => <option key={c.column_name} value={c.column_name} className="bg-[#18181b]">{c.column_name}</option>)}
                </select>
              </div>
            )}

            {/* Aggregation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Aggregation</label>
              <div className="flex gap-1.5 flex-wrap">
                {AGGREGATIONS.map(a => (
                  <button key={a} onClick={() => set("aggregation", a)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${cfg.aggregation === a
                      ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                      : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Top N Results: {cfg.limit}</label>
              <input type="range" min={5} max={200} step={5} value={cfg.limit} onChange={e => set("limit", parseInt(e.target.value))}
                className="w-full accent-violet-500" />
            </div>
          </>
        )}

        {/* STYLE TAB */}
        {activeTab === "style" && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Colour Palette</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PALETTES).map(([name, cols]) => (
                  <button key={name} onClick={() => set("palette", name)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${cfg.palette === name
                      ? "border-violet-500/60 bg-violet-500/10" : "border-white/10 bg-white/5 hover:bg-white/8"}`}>
                    <div className="flex gap-0.5">
                      {cols.slice(0, 5).map((c, i) => (
                        <div key={i} className="w-3 h-5 rounded-sm first:rounded-l last:rounded-r" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {(type === "bar") && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bar Orientation</label>
                <div className="flex gap-2">
                  {[["vertical","Vertical"],["horizontal","Horizontal"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => set("barLayout", val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${cfg.barLayout === val
                        ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
                        : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type === "area" && (
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-xs text-zinc-300">Area Fill</span>
                <button onClick={() => set("areaFill", !cfg.areaFill)}
                  className={`w-9 h-5 rounded-full transition-all ${cfg.areaFill ? "bg-violet-600" : "bg-white/10"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${cfg.areaFill ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            )}
          </>
        )}

        {/* DISPLAY TAB */}
        {activeTab === "display" && (
          <div className="space-y-3">
            {[
              ["showLegend", "Show Legend"],
              ["showGrid", "Show Grid Lines"],
              ["showDataLabels", "Show Data Labels"],
              ["showTooltip", "Show Tooltip"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-xs text-zinc-300">{label}</span>
                <button onClick={() => set(key, !cfg[key])}
                  className={`w-9 h-5 rounded-full transition-all ${cfg[key] ? "bg-violet-600" : "bg-white/10"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${cfg[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <button onClick={() => onSave({ ...widget, type, config: cfg })}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-500/25">
          Apply Changes
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { selectedProject } = useProjects();
  const projectId = selectedProject?.project_id;
  const containerRef = useRef(null);  // measures grid container width
  const gridRef      = useRef(null);  // targets the actual grid div for PNG export

  const [widgets, setWidgets] = useState([]);
  const [layouts, setLayouts] = useState({});
  const [widgetData, setWidgetData] = useState({});
  const [widgetLoading, setWidgetLoading] = useState({});
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isEditing, setIsEditing] = useState(false);
  const [configWidget, setConfigWidget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const saveTimer = useRef(null);

  // Client-side mount guard (grid reads window)
  useEffect(() => { setMounted(true); }, []);

  // Measure container width for react-grid-layout v2 (no WidthProvider)
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width || 1200);
    });
    ro.observe(containerRef.current);
    setContainerWidth(containerRef.current.offsetWidth || 1200);
    return () => ro.disconnect();
  }, [mounted]);

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const projectFetcher = useCallback(
    (url) =>
      projectId
        ? axios.get(url, { headers: { "X-Project-ID": projectId } }).then(r => r.data.data)
        : Promise.resolve([]),
    [projectId]
  );

  const { data: tables = [] } = useSWR(projectId ? "/analytics/tables" : null, projectFetcher);
  const { data: tableStats = [] } = useSWR(projectId ? "/analytics/stats" : null, projectFetcher, { refreshInterval: 60000 });

  // ── Load dashboard on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    axios.get("/analytics/dashboard", { headers: { "X-Project-ID": projectId } })
      .then(r => {
        const { layout, widgets: ws } = r.data.data;
        if (ws?.length) {
          setWidgets(ws);
          if (layout) setLayouts({ lg: layout });
        }
      })
      .catch(() => {});
  }, [projectId]);

  // ── Fetch data for a widget ───────────────────────────────────────────────
  const fetchWidgetData = useCallback(async (widget) => {
    if (!projectId || !widget.config.table || !widget.config.xField) return;
    setWidgetLoading(p => ({ ...p, [widget.id]: true }));
    try {
      const params = new URLSearchParams({
        tableName: widget.config.table,
        xField: widget.config.xField,
        aggregation: widget.config.aggregation || "COUNT",
        limit: widget.config.limit || 20,
      });
      if (widget.config.yField) params.append("yField", widget.config.yField);
      const res = await axios.get(`/analytics/chart?${params}`, { headers: { "X-Project-ID": projectId } });
      setWidgetData(p => ({ ...p, [widget.id]: res.data.data || [] }));
    } catch {
      setWidgetData(p => ({ ...p, [widget.id]: [] }));
    } finally {
      setWidgetLoading(p => ({ ...p, [widget.id]: false }));
    }
  }, [projectId]);

  // Fetch data for all widgets on load
  useEffect(() => {
    widgets.forEach(w => fetchWidgetData(w));
  }, [widgets.length, fetchWidgetData]); // eslint-disable-line

  // ── Add widget ────────────────────────────────────────────────────────────
  const addWidget = useCallback((type = "bar") => {
    const id = uuidv4();
    const newWidget = {
      id,
      type,
      config: { ...DEFAULT_WIDGET_CONFIG, title: `${CHART_TYPES.find(c=>c.value===type)?.label || "New"} Chart` },
    };
    const newLayout = { i: id, x: (widgets.length * 4) % 12, y: Infinity, w: 6, h: 8, minW: 3, minH: 5 };
    setWidgets(p => [...p, newWidget]);
    setLayouts(p => ({ ...p, lg: [...(p.lg || []), newLayout] }));
    setConfigWidget(newWidget);
    setIsEditing(true);
  }, [widgets.length]);

  // ── Delete widget ─────────────────────────────────────────────────────────
  const deleteWidget = useCallback((id) => {
    setWidgets(p => p.filter(w => w.id !== id));
    setLayouts(p => ({ ...p, lg: (p.lg || []).filter(l => l.i !== id) }));
    setWidgetData(p => { const n = { ...p }; delete n[id]; return n; });
    if (configWidget?.id === id) setConfigWidget(null);
  }, [configWidget]);

  // ── Save config changes ───────────────────────────────────────────────────
  const handleSaveConfig = useCallback((updated) => {
    setWidgets(p => p.map(w => w.id === updated.id ? updated : w));
    setConfigWidget(null);
    setTimeout(() => fetchWidgetData(updated), 100);
  }, [fetchWidgetData]);

  // ── Layout change ─────────────────────────────────────────────────────────
  const handleLayoutChange = useCallback((layout, allLayouts) => {
    setLayouts(allLayouts);
  }, []);

  // ── Auto-save (debounced) ─────────────────────────────────────────────────
  const triggerAutoSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!projectId || !widgets.length) return;
      axios.post("/analytics/dashboard",
        { layout: layouts.lg || [], widgets },
        { headers: { "X-Project-ID": projectId } }
      ).catch(() => {});
    }, 1500);
  }, [projectId, widgets, layouts]);

  useEffect(() => { if (widgets.length) triggerAutoSave(); }, [widgets, layouts, triggerAutoSave]);

  // ── Manual save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await axios.post("/analytics/dashboard",
        { layout: layouts.lg || [], widgets },
        { headers: { "X-Project-ID": projectId } }
      );
      toast.success("Dashboard saved!");
    } catch { toast.error("Failed to save dashboard"); }
    finally { setSaving(false); }
  };

  // ── Refresh all ───────────────────────────────────────────────────────────
  const handleRefreshAll = () => {
    widgets.forEach(w => fetchWidgetData(w));
    toast.success("Refreshed all widgets");
  };

  // ── Download PNG ──────────────────────────────────────────────────────────
  const handleDownloadPNG = async () => {
    const target = gridRef.current;
    if (!target) { toast.error("Nothing to export"); return; }
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(target, {
        backgroundColor: "#08080f",
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: false,
        filter: (node) =>
          !(node.tagName === "LINK" && node.rel === "stylesheet"),
      });
      const link = document.createElement("a");
      link.download = `${selectedProject?.project_name || "dashboard"}-analytics.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Dashboard exported as PNG");
    } catch (err) {
      console.error("[PNG export]", err);
      toast.error(`Export failed: ${err?.message || "unknown error"}`);
    } finally { setDownloading(false); }
  };

  // ── Download CSV ──────────────────────────────────────────────────────────
  const handleDownloadCSV = () => {
    const rows = [];
    widgets.forEach(w => {
      const data = widgetData[w.id] || [];
      if (data.length) {
        rows.push([`# ${w.config.title}`]);
        rows.push(["Label", "Value"]);
        data.forEach(d => rows.push([String(d.label), String(d.value)]));
        rows.push([]);
      }
    });
    if (!rows.length) { toast.error("No data to export"); return; }
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedProject?.project_name || "dashboard"}-data.csv`;
    a.click();
    toast.success("Data exported as CSV");
  };

  const hasWidgets = widgets.length > 0;

  // ─── CSS for react-grid-layout grid lines in edit mode ──────────────────
  const gridCSS = `
    .react-grid-item.react-grid-placeholder { background: rgba(139,92,246,0.15) !important; border-radius: 16px; border: 2px dashed #8b5cf680; }
    .react-grid-item > .react-resizable-handle { opacity: 0; transition: opacity 0.2s; }
    .react-grid-item:hover > .react-resizable-handle { opacity: 1; }
    .react-resizable-handle::after { border-color: #8b5cf6 !important; }
  `;

  return (
    <>

      <style>{gridCSS}</style>
      {/* Full-height flex column — toolbar pinned at top, canvas scrolls below */}
      <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.07] bg-[#08080f]/90 backdrop-blur-md shrink-0 z-40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/25">
              <LayoutDashboard className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Analytics</h1>
              <p className="text-[10px] text-zinc-600">{selectedProject?.project_name} · {widgets.length} widget{widgets.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit mode */}
            <button onClick={() => setIsEditing(e => !e)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border transition-all ${isEditing
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"}`}>
              {isEditing ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {isEditing ? "Editing" : "Locked"}
            </button>

            {/* Add widget */}
            <div className="relative group">
              <button onClick={() => addWidget("bar")}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                <Plus className="w-3.5 h-3.5" />
                Add Widget
              </button>
              {/* Dropdown on hover */}
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-[#18181b]/98 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 p-1.5
                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                {CHART_TYPES.map(({ value, label, Icon }) => (
                  <button key={value} onClick={() => addWidget(value)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh */}
            <button onClick={handleRefreshAll}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Save */}
            <button onClick={handleSave} disabled={saving || !hasWidgets}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>

            {/* Download PNG */}
            <button onClick={handleDownloadPNG} disabled={downloading || !hasWidgets}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 transition-all disabled:opacity-50">
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              PNG
            </button>

            {/* Download CSV */}
            <button onClick={handleDownloadCSV} disabled={!hasWidgets}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition-all disabled:opacity-50">
              <FileDown className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        {tableStats.length > 0 && (
          <div className="flex gap-3 px-5 py-3 overflow-x-auto border-b border-white/[0.05] shrink-0 scrollbar-none">
            {tableStats.map(t => (
              <div key={t.table_name} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2 shrink-0 hover:bg-white/[0.05] transition-all cursor-default">
                <Database className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-500">{t.table_name}</p>
                  <p className="text-sm font-bold text-white">{t.row_count.toLocaleString()} <span className="text-[10px] font-normal text-zinc-600">rows</span></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Dashboard canvas — flex-1 so it fills remaining height and scrolls ── */}
        <div className="flex-1 overflow-auto relative" ref={containerRef}>
          {!hasWidgets ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 text-center px-6">
              <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                <LayoutDashboard className="w-10 h-10 text-zinc-700" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-2">No widgets yet</h2>
                <p className="text-sm text-zinc-500 max-w-sm">Add your first widget to start building your analytics dashboard. Drag, resize, and arrange charts freely.</p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                {CHART_TYPES.slice(0, 4).map(({ value, label, Icon }) => (
                  <button key={value} onClick={() => addWidget(value)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="p-4" ref={gridRef}>
              {!mounted ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400/50" />
                </div>
              ) : (
                <GridLayout
                  className="layout"
                  layouts={layouts}
                  width={containerWidth}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                  rowHeight={44}
                  isDraggable={isEditing}
                  isResizable={isEditing}
                  draggableHandle=".drag-handle"
                  onLayoutChange={handleLayoutChange}
                  margin={[12, 12]}
                  containerPadding={[0, 0]}
                  useCSSTransforms={true}
                >
                  {widgets.map(widget => (
                    <div key={widget.id} style={{ height: "100%" }}>
                      <WidgetCard
                        widget={widget}
                        isEditing={isEditing}
                        onDelete={deleteWidget}
                        onOpenConfig={setConfigWidget}
                        data={widgetData[widget.id]}
                        loading={!!widgetLoading[widget.id]}
                      />
                    </div>
                  ))}
                </GridLayout>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Config slide-over ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {configWidget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfigWidget(null)} />
            <ConfigPanel
              key={configWidget.id}
              widget={configWidget}
              tables={tables}
              projectId={projectId}
              onSave={handleSaveConfig}
              onClose={() => setConfigWidget(null)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
