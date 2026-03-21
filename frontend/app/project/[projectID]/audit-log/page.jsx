"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import api from "@/utils/axios";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/auditlog");
        setLogs(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.action_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-md border border-border">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-xl md:text-2xl font-semibold">
              Audit Log
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by action type..."
                className="pl-8 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm md:text-base">
              No audit logs found.
            </p>
          ) : (
            <>
              {/* ✅ Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.id}</TableCell>
                        <TableCell className="truncate max-w-[160px]">
                          {log.actor_id || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {log.action_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <pre className="text-xs bg-muted p-2 rounded-md max-w-[260px] overflow-x-auto">
                            {log.details
                              ? JSON.stringify(log.details, null, 2)
                              : "—"}
                          </pre>
                        </TableCell>
                        <TableCell>{log.ip_address || "—"}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ✅ Mobile Cards */}
              <div className="block md:hidden space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 bg-card shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline" className="capitalize">
                        {log.action_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">Actor:</span>{" "}
                      {log.actor_id || "—"}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">IP:</span>{" "}
                      {log.ip_address || "—"}
                    </p>
                    <div className="mt-2">
                      <span className="font-semibold text-sm">Details:</span>
                      <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto mt-1">
                        {log.details
                          ? JSON.stringify(log.details, null, 2)
                          : "—"}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
