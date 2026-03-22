"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight, BarChart3, Table, FileCode2, Shield,
  ClipboardList, Plus, Workflow, Loader2, MoreHorizontal,
  Trash2, LayoutDashboard, Key,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useProjects } from "@/providers/ProjectContext";
import { useTables } from "@/providers/TableContext";
import axios from "@/utils/axios";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup, SidebarGroupLabel, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const navMain = [
  { title: "Dashboard",            icon: LayoutDashboard, routeSuffix: "dashboard" },
  { title: "Tables",               icon: Table,            hasSubMenu: true },
  { title: "SQL Editor",           icon: FileCode2,        routeSuffix: "sql-editor" },
  { title: "Analytics",            icon: BarChart3,        routeSuffix: "analytics" },
  { title: "Schema Visualization", icon: Workflow,         routeSuffix: "schema-visualization" },
  { title: "API Keys",             icon: Key,              routeSuffix: "api-keys" },
  { title: "Audit Logs",           icon: ClipboardList,    routeSuffix: "audit-log" },
];

const SkeletonLoader = () => (
  <div className="space-y-2 p-2">
    {[0.8, 0.6, 0.7].map((w, i) => (
      <div key={i} className="h-4 rounded-md bg-white/10 animate-pulse" style={{ width: `${w * 100}%` }} />
    ))}
  </div>
);

export function NavMain() {
  const { selectedProject } = useProjects();
  const { tables, isLoading, mutate } = useTables();
  const router = useRouter();
  const pathname = usePathname();
  const [isTablesOpen, setIsTablesOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (tables && tables.length > 0) setIsTablesOpen(true);
  }, [tables]);

  const isActive = (suffix) => selectedProject && pathname === `/project/${selectedProject.project_id}/${suffix}`;
  const isTableActive = (tname) => selectedProject && pathname === `/project/${selectedProject.project_id}/tables/${tname}`;

  const handleDeleteClick = (table) => {
    setTableToDelete(table);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (confirmName !== tableToDelete.table_name) {
      toast.error("The table name does not match.");
      return;
    }
    try {
      await axios.delete(
        `/projects/${selectedProject.project_id}/tables/${tableToDelete.table_name}`,
        { data: { tableName: tableToDelete.table_name } }
      );
      toast.success("Table deleted successfully.");
      setIsDeleteModalOpen(false);
      setTableToDelete(null);
      setConfirmName("");
      mutate();
      router.push(`/project/${selectedProject.project_id}/dashboard`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to delete table.");
    }
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-3 mb-1">
          Project
        </SidebarGroupLabel>
        <SidebarMenu>
          {navMain.map((item) => {
            if (item.hasSubMenu && item.title === "Tables") {
              const isTablesSection = selectedProject && pathname.includes(`/project/${selectedProject.project_id}/tables`);
              return (
                <Collapsible
                  key={item.title}
                  open={isTablesOpen}
                  onOpenChange={setIsTablesOpen}
                  asChild
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={`rounded-xl transition-all duration-200 ${
                          isTablesSection
                            ? "bg-white/10 text-white"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <Table className="w-4 h-4" />
                        <span className="font-medium">{item.title}</span>
                        {isLoading && <Loader2 className="h-3.5 w-3.5 ml-auto animate-spin text-zinc-500" />}
                        {!isLoading && (
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-zinc-600" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l border-white/[0.08] ml-3">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={`/project/${selectedProject?.project_id}/create-table`}
                              className="flex items-center gap-2 font-semibold text-violet-400 hover:text-violet-300 transition-colors py-1.5"
                            >
                              <Plus size={14} />
                              <span>Create Table</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {isLoading ? (
                          <SkeletonLoader />
                        ) : tables && tables.length > 0 ? (
                          tables.map((table) => (
                            <SidebarMenuSubItem key={table.table_name}>
                              <SidebarMenuSubButton asChild>
                                <div className={`flex w-full items-center justify-between group/table rounded-lg transition-colors ${
                                  isTableActive(table.table_name) ? "bg-white/10" : ""
                                }`}>
                                  <Link
                                    href={`/project/${selectedProject?.project_id}/tables/${table.table_name}`}
                                    className={`truncate flex-grow text-sm py-1 ${
                                      isTableActive(table.table_name) ? "text-white font-medium" : "text-zinc-400 hover:text-white"
                                    }`}
                                  >
                                    <span>{table.table_name}</span>
                                  </Link>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="h-5 w-5 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-300 opacity-0 group-hover/table:opacity-100 transition-all">
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="glass border-white/10 text-white rounded-xl">
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteClick(table)}
                                        className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer rounded-lg"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete Table</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))
                        ) : (
                          <SidebarMenuSubItem>
                            <span className="text-zinc-600 text-xs p-2 block">No tables yet.</span>
                          </SidebarMenuSubItem>
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            const href = selectedProject ? `/project/${selectedProject.project_id}/${item.routeSuffix}` : "#";
            const active = isActive(item.routeSuffix);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={`rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  } ${!selectedProject ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
                >
                  <Link href={href} className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
                    <span className={`font-medium text-sm ${active ? "text-white" : ""}`}>{item.title}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="glass border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <Trash2 className="w-5 h-5 text-red-400" /> Delete Table
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action <strong className="text-red-400">cannot be undone</strong>. This will permanently delete{" "}
              <strong className="text-white">{tableToDelete?.table_name}</strong> and all its data.
              Type the table name to confirm:
            </AlertDialogDescription>
            <div className="mt-3">
              <Input
                type="text"
                placeholder={`Type "${tableToDelete?.table_name}" to confirm`}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-red-500/50 mt-2"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={confirmName !== tableToDelete?.table_name}
              className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl disabled:opacity-40"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
