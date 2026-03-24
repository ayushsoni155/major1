"use client";

import {
  LogOut,
  User,
  HelpCircle,
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
import { useAuth } from "@/providers/AuthContext";
import { useRouter } from "nextjs-toploader/app";

export function ProfilePopup({ notificationCount = 0 }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Skeleton while loading
  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  // If no user logged in → return nothing
  if (!user) return null;

  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    || user?.email?.[0]?.toUpperCase()
    || "U";

  return (
    <div className="flex items-center justify-center p-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative rounded-lg hover:ring-2 hover:ring-violet-500/30 transition-all">
            <Avatar className="h-9 w-9 rounded-lg cursor-pointer">
              <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email || "User"} />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-violet-500/40 to-indigo-500/40 text-white text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] text-white font-bold flex items-center justify-center">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-60 rounded-xl bg-[#0d0d14] border border-white/10 shadow-2xl shadow-black/40 py-1"
          side="bottom"
          align="end"
          sideOffset={6}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/[0.06]">
              <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name || "User"} />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-violet-500/40 to-indigo-500/40 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-white">{user.name || "Anonymous"}</span>
                <span className="truncate text-xs text-zinc-500">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuGroup className="py-1">
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="mx-1 rounded-lg gap-2.5 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer text-sm"
            >
              <User className="h-4 w-4 text-zinc-400" />
              Profile &amp; Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/support")}
              className="mx-1 rounded-lg gap-2.5 px-2.5 py-2 text-zinc-300 hover:text-white focus:text-white hover:bg-white/[0.07] focus:bg-white/[0.07] cursor-pointer text-sm"
            >
              <HelpCircle className="h-4 w-4 text-zinc-400" />
              Help &amp; Support
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-white/[0.06] my-0.5 mx-1" />

          <DropdownMenuItem
            onClick={signOut}
            className="mx-1 mb-1 rounded-lg gap-2.5 px-2.5 py-2 text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
