"use client";

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  User,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/AuthContext";

export function NavUser() {
  const { user, loading, signOut } = useAuth();
  const { isMobile } = useSidebar();

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/10" />
              <div className="flex flex-col flex-1 space-y-1">
                <div className="h-3 w-24 bg-white/10 rounded" />
                <div className="h-2 w-32 bg-white/10 rounded" />
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-white/[0.08] hover:bg-white/[0.06] text-white transition-colors rounded-xl"
            >
              <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                <AvatarImage
                  src={user.avatar_url || undefined}
                  alt={user.name || "User"}
                />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-violet-500/40 to-indigo-500/40 text-white text-xs font-bold border border-violet-500/20">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">
                  {user.name || "Anonymous"}
                </span>
                <span className="truncate text-xs text-zinc-500">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-zinc-500 flex-shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-[14rem] bg-[#0d0d14] border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-1"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            {/* User Info Header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 border-b border-white/[0.06]">
                <Avatar className="h-9 w-9 rounded-lg flex-shrink-0">
                  <AvatarImage
                    src={user.avatar_url || undefined}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-violet-500/40 to-indigo-500/40 text-white text-xs font-bold border border-violet-500/20">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold text-white">
                    {user.name || "Anonymous"}
                  </span>
                  <span className="truncate text-xs text-zinc-500">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup className="py-1">
              <DropdownMenuItem className="mx-1 rounded-lg gap-2.5 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer transition-colors">
                <BadgeCheck className="h-4 w-4 text-violet-400" />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-white/[0.06] my-1 mx-1" />

            <DropdownMenuItem
              onClick={signOut}
              className="mx-1 rounded-lg gap-2.5 px-2.5 py-2 text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
