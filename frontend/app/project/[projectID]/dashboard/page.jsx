"use client";

import { useEffect, useState } from "react";
import { useProjects } from "@/providers/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table as TableIcon, Database, Key, Activity, Clock, ArrowUpRight, BarChart3, Layers } from "lucide-react";
import api from "@/utils/axios";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DashboardPage() {
  const { selectedProject } = useProjects();
  const { projectID } = useParams();
  const [stats, setStats] = useState({ tables: 0, totalRows: 0, apiKeys: 0, recentQueries: [] });
  const [tableStats, setTableStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [tablesRes, keysRes, historyRes] = await Promise.allSettled([
          api.get(`/projects/${selectedProject.project_id}/tables`),
          api.get(`/projects/${selectedProject.project_id}/keys`),
          api.get(`/query/history?limit=5`),
        ]);

        const tables = tablesRes.status === 'fulfilled' ? tablesRes.value.data.data : [];
        const keys = keysRes.status === 'fulfilled' ? keysRes.value.data.data : [];
        const history = historyRes.status === 'fulfilled' ? historyRes.value.data.data?.history || [] : [];

        setStats({
          tables: tables.length,
          totalRows: 0,
          apiKeys: keys.length,
          recentQueries: history,
        });

        // Get per-table stats from analytics
        try {
          const analyticsRes = await api.get('/analytics/stats');
          setTableStats(analyticsRes.data.data || []);
          const totalRows = (analyticsRes.data.data || []).reduce((sum, t) => sum + t.row_count, 0);
          setStats(prev => ({ ...prev, totalRows }));
        } catch {}
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedProject]);

  const statCards = [
    { title: "Tables", value: stats.tables, icon: TableIcon, color: "text-primary", bg: "bg-primary/10", href: `create-table` },
    { title: "Total Rows", value: stats.totalRows.toLocaleString(), icon: Database, color: "text-foreground", bg: "bg-muted/50" },
    { title: "API Keys", value: stats.apiKeys, icon: Key, color: "text-foreground", bg: "bg-muted/50", href: `api-keys` },
    { title: "Queries Run", value: stats.recentQueries.length, icon: Activity, color: "text-foreground", bg: "bg-muted/50", href: `sql-editor` },
  ];

  const quickActions = [
    { label: "Create Table", href: `/project/${projectID}/create-table`, icon: TableIcon },
    { label: "SQL Editor", href: `/project/${projectID}/sql-editor`, icon: Activity },
    { label: "Analytics", href: `/project/${projectID}/analytics`, icon: BarChart3 },
    { label: "Schema View", href: `/project/${projectID}/schema-visualization`, icon: Layers },
  ];

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of <span className="font-medium text-foreground">{selectedProject?.project_name || 'your project'}</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} transition-transform group-hover:scale-110 duration-300`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Table Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Table Overview */}
        <Card className="md:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Table Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {tableStats.length > 0 ? (
              <div className="space-y-3">
                {tableStats.map((t) => (
                  <div key={t.table_name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <TableIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.table_name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{t.row_count} rows</span>
                      <span>{t.column_count} cols</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tables yet. Create your first table to see stats.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Queries */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentQueries.length > 0 ? (
            <div className="space-y-2">
              {stats.recentQueries.map((q) => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-mono text-muted-foreground truncate block">{q.query_text}</code>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${q.query_status === 'success' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                      {q.query_status}
                    </span>
                    {q.execution_time_ms && (
                      <span className="text-xs text-muted-foreground">{q.execution_time_ms}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No queries yet. Open the SQL editor to run your first query.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
