"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, PieChart, TrendingUp, Loader2, RefreshCw, Database, LineChart } from "lucide-react";
import api from "@/utils/axios";
import { toast } from "sonner";
import { motion } from "motion/react";
import useSWR from "swr";
import { useProjects } from "@/providers/ProjectContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Simple bar chart component (no external library needed for basic rendering)
const SimpleBarChart = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-sm text-zinc-500 text-center py-8">No data to display</p>;
  const maxValue = Math.max(...data.map(d => parseFloat(d.value) || 0));

  return (
    <div className="space-y-3 mt-4">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-4 group">
          <span className="text-xs font-medium text-zinc-400 w-24 truncate text-right group-hover:text-white transition-colors">{String(item.label)}</span>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl h-8 overflow-hidden shadow-inner relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${maxValue > 0 ? (parseFloat(item.value) / maxValue) * 100 : 0}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
              className="h-full rounded-r-xl bg-gradient-to-r from-violet-600 to-indigo-500 flex items-center justify-end px-3 relative overflow-hidden"
              style={{ minWidth: '2.5rem' }}
            >
              <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="text-xs font-bold text-white tracking-wide relative z-10">{parseFloat(item.value).toLocaleString()}</span>
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SimplePieChart = ({ data }) => {
  if (!data?.length) return <p className="text-sm text-zinc-500 text-center py-8">No data</p>;
  const total = data.reduce((a, b) => a + (parseFloat(b.value) || 0), 0);
  const colors = ['#8b5cf6', '#6366f1', '#a78bfa', '#818cf8', '#c084fc', '#e879f9', '#2dd4bf', '#38bdf8'];

  return (
    <div className="flex flex-col items-center gap-8 mt-4">
      <div className="relative w-48 h-48 drop-shadow-[0_0_15px_rgba(139,92,246,0.2)]">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full overflow-visible">
          {(() => {
            let cumulative = 0;
            return data.slice(0, 8).map((item, i) => {
              const val = (parseFloat(item.value) || 0) / total;
              const dashArray = `${val * 314.16} 314.16`;
              const offset = cumulative * 314.16;
              cumulative += val;
              return (
                <motion.circle 
                  key={i} cx="50" cy="50" r="50" fill="none" stroke={colors[i % colors.length]}
                  strokeWidth="24" strokeDasharray={dashArray} strokeDashoffset={-offset}
                  className="hover:stroke-[28] transition-all duration-300 origin-center cursor-pointer" 
                  initial={{ strokeDasharray: "0 314.16" }}
                  animate={{ strokeDasharray: dashArray }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              );
            });
          })()}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 justify-center max-w-md">
        {data.slice(0, 8).map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: colors[i % colors.length], boxShadow: `0 0 8px ${colors[i % colors.length]}80` }} />
            <span className="text-xs font-medium text-zinc-300">
              {String(item.label)}: <span className="text-white font-bold ml-1">{parseFloat(item.value).toLocaleString()}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};const SimpleLineChart = ({ data }) => {
  if (!data?.length) return <p className="text-sm text-zinc-500 text-center py-8">No data to display</p>;
  const values = data.map(d => parseFloat(d.value) || 0);
  const maxV = Math.max(...values) || 1;
  const minV = Math.min(...values);
  const W = 600; const H = 200; const PAD = 32;
  const pts = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((parseFloat(d.value) - minV) / (maxV - minV || 1)) * (H - PAD * 2);
    return { x, y, label: String(d.label), value: parseFloat(d.value) };
  });
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#lineGrad)" />
        <motion.path
          d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#8b5cf6" stroke="#12121a" strokeWidth="2" className="hover:r-6 transition-all" />
            <text x={p.x} y={H - 6} textAnchor="middle" fontSize="10" fill="#71717a" className="font-mono">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};


export default function AnalyticsPage() {
  const { selectedProject } = useProjects();
  const [columns, setColumns] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [xField, setXField] = useState("");
  const [yField, setYField] = useState("");
  const [aggregation, setAggregation] = useState("COUNT");
  const [chartType, setChartType] = useState("bar");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const projectId = selectedProject?.project_id;

  // Project-aware fetcher that injects X-Project-ID header for analytics service
  const projectFetcher = useCallback(
    (url) =>
      projectId
        ? api
            .get(url, { headers: { "X-Project-ID": projectId } })
            .then((r) => r.data.data)
        : Promise.resolve([]),
    [projectId]
  );

  // SWR for tables list and stats — cached with 60s refresh
  const { data: tables = [] } = useSWR(
    projectId ? `/analytics/tables` : null,
    projectFetcher,
    { refreshInterval: 60000 }
  );
  const { data: tableStats = [], isLoading: statsLoading } = useSWR(
    projectId ? `/analytics/stats` : null,
    projectFetcher,
    { refreshInterval: 60000 }
  );

  // Load columns when table changes (still async since it's dependent)
  const handleTableChange = async (tbl) => {
    setSelectedTable(tbl);
    setXField(''); setYField('');
    try {
      const res = await api.get(`/analytics/tables/${tbl}/columns`, {
        headers: { "X-Project-ID": projectId },
      });
      setColumns(res.data.data || []);
    } catch { setColumns([]); }
  };

  const generateChart = async () => {
    if (!selectedTable || !xField) { toast.error("Select table and X field"); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ tableName: selectedTable, xField, aggregation });
      if (yField && yField !== "none") params.append('yField', yField);
      const res = await api.get(`/analytics/chart?${params}`, {
        headers: { "X-Project-ID": projectId },
      });
      setChartData(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load chart data");
    } finally { setLoading(false); }
  };

  const chartTypes = [
    { value: "bar", icon: BarChart3, label: "Bar" },
    { value: "pie", icon: PieChart, label: "Pie" },
    { value: "line", icon: TrendingUp, label: "Line" },
  ];

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full"
    >
      <motion.div variants={itemVariants} className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 pointer-events-none" />
        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent flex items-center gap-3 relative z-10">
          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
            <TrendingUp className="w-6 h-6 text-violet-400" />
          </div>
          Analytics
        </h1>
        <p className="text-zinc-400 text-sm mt-2 relative z-10 pl-14">Visualize your data with dynamic charts and metrics</p>
      </motion.div>

      {/* Table Stats Overview */}
      {!statsLoading && tableStats.length > 0 && (
        <motion.div variants={containerVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tableStats.map((t) => (
            <motion.div key={t.table_name} variants={itemVariants} className="glass-card p-5 rounded-2xl border border-white/10 hover:bg-white/[0.04] transition-all group overflow-hidden relative">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-colors" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <Database className="w-4 h-4 text-violet-400" />
                <p className="text-sm font-bold text-white truncate">{t.table_name}</p>
              </div>
              <div className="flex items-center gap-6 mt-2 relative z-10">
                <div>
                  <span className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Rows</span>
                  <span className="text-lg font-mono text-zinc-200">{t.row_count}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <span className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Columns</span>
                  <span className="text-lg font-mono text-zinc-200">{t.column_count}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Chart Builder Sidebar */}
        <motion.div variants={itemVariants} className="lg:col-span-4 h-fit">
          <div className="glass-card rounded-[2rem] p-6 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-400" /> Chart Builder
            </h3>
            
            <div className="space-y-5 relative z-10">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Table <span className="text-red-400">*</span></Label>
                <Select value={selectedTable} onValueChange={handleTableChange}>
                  <SelectTrigger className="h-11 bg-white/[0.05] border-white/10 text-white rounded-xl focus:ring-violet-500/30">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white rounded-xl">
                    {tables.map(t => <SelectItem key={t} value={t} className="focus:bg-white/10 rounded-lg cursor-pointer">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">X Field (Group By) <span className="text-red-400">*</span></Label>
                <Select value={xField} onValueChange={setXField} disabled={!selectedTable}>
                  <SelectTrigger className="h-11 bg-white/[0.05] border-white/10 text-white rounded-xl disabled:opacity-50 focus:ring-violet-500/30">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white rounded-xl">
                    {columns.map(c => <SelectItem key={c.column_name} value={c.column_name} className="focus:bg-white/10 rounded-lg cursor-pointer">{c.column_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Y Field (Scale)</Label>
                <Select value={yField} onValueChange={setYField} disabled={!selectedTable}>
                  <SelectTrigger className="h-11 bg-white/[0.05] border-white/10 text-white rounded-xl disabled:opacity-50 focus:ring-violet-500/30">
                    <SelectValue placeholder="None (Count Rows)" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white rounded-xl">
                    <SelectItem value="none" className="focus:bg-white/10 rounded-lg cursor-pointer text-zinc-400">None (Count Rows)</SelectItem>
                    {columns.filter(c => ['integer', 'bigint', 'numeric', 'real', 'double precision'].includes(c.data_type)).map(c => (
                      <SelectItem key={c.column_name} value={c.column_name} className="focus:bg-white/10 rounded-lg cursor-pointer">{c.column_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Aggregation</Label>
                <Select value={aggregation} onValueChange={setAggregation}>
                  <SelectTrigger className="h-11 bg-white/[0.05] border-white/10 text-white rounded-xl focus:ring-violet-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white rounded-xl">
                    {['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].map(a => 
                      <SelectItem key={a} value={a} className="focus:bg-white/10 rounded-lg cursor-pointer">{a}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Chart Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {chartTypes.map(ct => (
                    <Button 
                      key={ct.value} 
                      variant="ghost" 
                      onClick={() => setChartType(ct.value)} 
                      className={`h-11 flex justify-center items-center gap-2 rounded-xl border transition-all ${
                        chartType === ct.value 
                        ? "bg-violet-600/20 border-violet-500/50 text-violet-300" 
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <ct.icon className="w-4 h-4" /> {ct.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
              <Button 
                onClick={generateChart} 
                disabled={loading || !selectedTable || !xField} 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/25 transition-all duration-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Generate Chart
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Chart Display Area */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col">
          {chartData.length > 0 ? (
            <div className="glass-card rounded-[2rem] p-6 border border-white/10 relative overflow-hidden flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">
                  <span className="text-violet-400">{aggregation}</span> {yField && yField !== 'none' ? `of ${yField}` : 'Records'} 
                  <span className="text-zinc-500 font-normal mx-2">by</span> 
                  <span className="text-indigo-400">{xField}</span>
                </h3>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-zinc-400">
                  {chartData.length} records
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center bg-black/20 rounded-2xl border border-white/5 p-6 shadow-inner">
                {chartType === 'bar' ? <SimpleBarChart data={chartData} /> :
                 chartType === 'pie' ? <SimplePieChart data={chartData} /> :
                 <SimpleLineChart data={chartData} />}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-[2rem] p-6 border border-white/10 border-dashed flex flex-col items-center justify-center flex-1 min-h-[400px] text-center bg-white/[0.01]">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <PieChart className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-300 mb-2">No Chart Generated</h3>
              <p className="text-sm text-zinc-500 max-w-sm">Use the builder on the left to select a table, fields, and aggregation method to visualize your data.</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
