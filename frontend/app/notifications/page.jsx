"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import api from "@/utils/axios";
import { useAuth } from "@/providers/AuthContext";
import { useRouter } from "nextjs-toploader/app";
import {
  Bell, CheckCheck, Users, UserCheck, UserX, Clock,
  Inbox, ArrowLeft, Check, X, Filter, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";

// ── Type Config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  member_invite: {
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.08)]",
    label: "Invitation",
    labelColor: "bg-violet-500/15 text-violet-400",
  },
  invite_accepted: {
    icon: UserCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.08)]",
    label: "Accepted",
    labelColor: "bg-emerald-500/15 text-emerald-400",
  },
  invite_declined: {
    icon: UserX,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.08)]",
    label: "Declined",
    labelColor: "bg-red-500/15 text-red-400",
  },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "member_invite", label: "Invitations" },
];

// ── Group notifications by date ───────────────────────────────────────────────
function groupByDate(notifications) {
  const groups = {};
  for (const n of notifications) {
    const d = new Date(n.created_at);
    const key = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return Object.entries(groups);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 flex gap-3"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="shrink-0 w-11 h-11 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-2/3 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-2.5 w-5/6 rounded bg-white/[0.04] animate-pulse" />
            <div className="h-2 w-1/4 rounded bg-white/[0.03] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Notification Card ─────────────────────────────────────────────────────────
function NotificationCard({ notification, onRead, onAction, isActed, onActed }) {
  const config =
    TYPE_CONFIG[notification.type] || {
      icon: Bell,
      color: "text-zinc-400",
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/20",
      glow: "",
      label: "Notice",
      labelColor: "bg-zinc-500/15 text-zinc-400",
    };
  const Icon = config.icon;
  const isInvite = notification.type === "member_invite";
  const data = notification.data || {};
  const [acting, setActing] = useState(false);

  const handleAccept = async () => {
    setActing(true);
    try {
      await api.post(`/projects/invitations/accept/${data.token}`);
      toast.success("You've joined the project!");
      onActed?.(notification.id);   // mark in parent BEFORE re-fetch
      onAction?.();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to accept invitation.");
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    setActing(true);
    try {
      await api.post(`/projects/invitations/decline/${data.token}`);
      toast.success("Invitation declined.");
      onActed?.(notification.id);   // mark in parent BEFORE re-fetch
      onAction?.();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to decline invitation.");
    } finally {
      setActing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, height: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={`relative rounded-2xl border transition-all duration-300 ${config.border} ${
        notification.is_read
          ? "bg-white/[0.01]"
          : `bg-white/[0.035] ${config.glow}`
      }`}
    >
      {/* Unread indicator stripe */}
      {!notification.is_read && (
        <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${config.color.replace("text-", "bg-")}`} />
      )}

      <div className="p-4 pl-5">
        <div className="flex gap-3.5">
          {/* Icon */}
          <div
            className={`shrink-0 w-11 h-11 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className={`text-sm font-semibold leading-snug ${notification.is_read ? "text-zinc-300" : "text-white"}`}>
                {notification.title}
              </p>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${config.labelColor}`}
              >
                {config.label}
              </span>
            </div>

            {/* Message */}
            {notification.message && (
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                {notification.message}
              </p>
            )}

            {/* Actions + meta row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>

              <div className="flex items-center gap-2">
                {/* Invite accept/decline */}
                {isInvite && data.token && !isActed && (
                  <>
                    <button
                      onClick={handleAccept}
                      disabled={acting}
                      className="flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50 shadow-lg shadow-violet-500/20"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={handleDecline}
                      disabled={acting}
                      className="flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg border border-white/[0.12] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </>
                )}
                {isInvite && data.token && isActed && (
                  <span className="text-[11px] font-semibold text-zinc-500 italic px-2">
                    Responded ✓
                  </span>
                )}

                {/* Mark as read */}
                {!notification.is_read && (
                  <button
                    onClick={() => onRead(notification.id)}
                    className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  // actedIds persists across re-fetches so buttons stay hidden after responding
  const [actedIds, setActedIds] = useState(new Set());

  const handleActed = (id) =>
    setActedIds((prev) => new Set([...prev, id]));

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/projects/notifications");
      setNotifications(res.data?.data || []);
    } catch (e) {
      if (e.response?.status !== 401) toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) fetchNotifications();
  }, [authLoading, fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.patch(`/projects/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/projects/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All caught up!");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === "unread") return !n.is_read;
    if (activeFilter !== "all") return n.type === activeFilter;
    return true;
  });

  const groups = groupByDate(filtered);

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      {/* Hero gradient strip */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-violet-950/30 via-[#0d0d1a] to-[#08080f]">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="pointer-events-none absolute -top-10 right-10 w-48 h-48 rounded-full bg-indigo-600/8 blur-3xl" />

        <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-8 pb-7">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-7 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.15)]">
                  <Bell className="w-6 h-6 text-violet-400" />
                </div>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-black px-1 shadow-[0_0_10px_rgba(139,92,246,0.7)]"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Notifications
                </h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : "You're all caught up!"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllRead}
                className="shrink-0 gap-2 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.07] rounded-xl border border-white/[0.08]"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 mt-6">
            {FILTERS.map((f) => {
              const count =
                f.id === "all"
                  ? notifications.length
                  : f.id === "unread"
                  ? notifications.filter((n) => !n.is_read).length
                  : notifications.filter((n) => n.type === f.id).length;
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    active
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                      : "bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {f.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-black px-1 py-0.5 rounded-full min-w-[18px] text-center ${
                        active ? "bg-white/20 text-white" : "bg-white/[0.08] text-zinc-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6">
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
                <Inbox className="w-10 h-10 text-zinc-700" />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-violet-500/5 to-transparent" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {activeFilter === "unread" ? "No unread notifications" : "Nothing here yet"}
            </h3>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              {activeFilter === "unread"
                ? "You've read everything. Check back later."
                : "When someone invites you to a project or responds to your invitation, it'll appear here."}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all notifications →
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-7">
              {groups.map(([dateLabel, items]) => (
                <motion.div
                  key={dateLabel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Date divider */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.05]" />
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5">
                    <AnimatePresence>
                      {items.map((n) => (
                        <NotificationCard
                          key={n.id}
                          notification={n}
                          onRead={markRead}
                          onAction={fetchNotifications}
                          isActed={actedIds.has(n.id)}
                          onActed={handleActed}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
