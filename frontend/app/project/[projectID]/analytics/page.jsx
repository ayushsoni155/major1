"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, PieChart, LineChart, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import api from "@/utils/axios";
import { toast } from "sonner";

// Simple bar chart component (no external library needed for basic rendering)
const SimpleBarChart = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data to display</p>;
  const maxValue = Math.max(...data.map(d => parseFloat(d.value) || 0));

  return (
    <div className="space-y-2 mt-4">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-24 truncate text-right">{String(item.label)}</span>
          <div className="flex-1 bg-muted/30 rounded-full h-7 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary flex items-center justify-end px-2 transition-all duration-700 ease-out"
              style={{ width: `${maxValue > 0 ? (parseFloat(item.value) / maxValue) * 100 : 0}%`, minWidth: '2rem' }}
            >
              <span className="text-[10px] font-medium text-primary-foreground">{parseFloat(item.value).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SimplePieChart = ({ data }) => {
  if (!data?.length) return <p className="text-sm text-muted-foreground text-center py-8">No data</p>;
  const total = data.reduce((a, b) => a + (parseFloat(b.value) || 0), 0);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          {(() => {
            let cumulative = 0;
            return data.slice(0, 8).map((item, i) => {
              const val = (parseFloat(item.value) || 0) / total;
              const dashArray = `${val * 314.16} 314.16`;
              const offset = cumulative * 314.16;
              cumulative += val;
              return (
                <circle key={i} cx="50" cy="50" r="50" fill="none" stroke={colors[i % colors.length]}
                  strokeWidth="20" strokeDasharray={dashArray} strokeDashoffset={-offset}
                  className="transition-all duration-700" />
              );
            });
          })()}
        </svg>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {data.slice(0, 8).map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-muted-foreground">{String(item.label)}: {parseFloat(item.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [xField, setXField] = useState("");
  const [yField, setYField] = useState("");
  const [aggregation, setAggregation] = useState("COUNT");
  const [chartType, setChartType] = useState("bar");
  const [chartData, setChartData] = useState([]);
  const [tableStats, setTableStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tablesRes, statsRes] = await Promise.allSettled([
          api.get('/analytics/tables'),
          api.get('/analytics/stats'),
        ]);
        if (tablesRes.status === 'fulfilled') setTables(tablesRes.value.data.data || []);
        if (statsRes.status === 'fulfilled') setTableStats(statsRes.value.data.data || []);
      } catch {} finally { setStatsLoading(false); }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedTable) return;
    const loadColumns = async () => {
      try {
        const res = await api.get(`/analytics/tables/${selectedTable}/columns`);
        setColumns(res.data.data || []);
        setXField('');
        setYField('');
      } catch { setColumns([]); }
    };
    loadColumns();
  }, [selectedTable]);

  const generateChart = async () => {
    if (!selectedTable || !xField) { toast.error("Select table and X field"); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ tableName: selectedTable, xField, aggregation });
      if (yField) params.append('yField', yField);
      const res = await api.get(`/analytics/chart?${params}`);
      setChartData(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load chart data");
    } finally { setLoading(false); }
  };

  const chartTypes = [
    { value: "bar", icon: BarChart3, label: "Bar" },
    { value: "pie", icon: PieChart, label: "Pie" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize your data with dynamic charts</p>
      </div>

      {/* Table Stats Overview */}
      {!statsLoading && tableStats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tableStats.map((t) => (
            <Card key={t.table_name} className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <p className="text-sm font-medium truncate">{t.table_name}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {t.row_count} rows</span>
                  <span>{t.column_count} columns</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart Builder */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Chart Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select table" /></SelectTrigger>
                <SelectContent>{tables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">X Field (Group By)</Label>
              <Select value={xField} onValueChange={setXField}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>{columns.map(c => <SelectItem key={c.column_name} value={c.column_name}>{c.column_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Y Field (optional)</Label>
              <Select value={yField} onValueChange={setYField}>
                <SelectTrigger className="h-9"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns.filter(c => ['integer', 'bigint', 'numeric', 'real', 'double precision'].includes(c.data_type)).map(c => (
                    <SelectItem key={c.column_name} value={c.column_name}>{c.column_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Aggregation</Label>
              <Select value={aggregation} onValueChange={setAggregation}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Chart Type</Label>
              <div className="flex gap-1">
                {chartTypes.map(ct => (
                  <Button key={ct.value} variant={chartType === ct.value ? "default" : "outline"} size="sm"
                    onClick={() => setChartType(ct.value)} className="flex-1 h-9 gap-1">
                    <ct.icon className="w-3.5 h-3.5" />{ct.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={generateChart} disabled={loading || !selectedTable || !xField} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Generate Chart
          </Button>
        </CardContent>
      </Card>

      {/* Chart Display */}
      {chartData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {aggregation} of {yField && yField !== 'none' ? yField : 'records'} by {xField}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartType === 'bar' ? <SimpleBarChart data={chartData} /> : <SimplePieChart data={chartData} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
