"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import api from "@/utils/axios";
import { useRouter } from "nextjs-toploader/app";
import {
  Bell, CheckCheck, Users, UserCheck, UserX, Clock,
  ExternalLink, Check, X, Dot
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG = {
  member_invite: {
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/30",
    label: "Invite",
  },
  invite_accepted: {
    icon: UserCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
    label: "Accepted",
  },
  invite_declined: {
    icon: UserX,
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/30",
    label: "Declined",
  },
};

function MiniNotificationItem({ notification, onAction, onRead, isActed, onActed }) {
  const config =
    TYPE_CONFIG[notification.type] || {
      icon: Bell,
      color: "text-zinc-400",
      bg: "bg-zinc-500/10",
      ring: "ring-zinc-500/30",
      label: "Notice",
    };
  const Icon = config.icon;
  const isInvite = notification.type === "member_invite";
  const data = notification.data || {};
  const [acting, setActing] = useState(false);

  const handleAccept = async (e) => {
    e.stopPropagation();
    setActing(true);
    try {
      await api.post(`/projects/invitations/accept/${data.token}`);
      toast.success("Invitation accepted!");
      onActed?.(notification.id);   // mark acted in parent BEFORE re-fetch
      onAction?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept.");
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async (e) => {
    e.stopPropagation();
    setActing(true);
    try {
      await api.post(`/projects/invitations/decline/${data.token}`);
      toast.success("Invitation declined.");
      onActed?.(notification.id);   // mark acted in parent BEFORE re-fetch
      onAction?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline.");
    } finally {
      setActing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      onClick={() => !notification.is_read && onRead?.(notification.id)}
      className={`group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.035] ${
        !notification.is_read ? "bg-white/[0.025]" : ""
      }`}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.9)]" />
      )}

      <div
        className={`shrink-0 w-8 h-8 rounded-lg ${config.bg} ring-1 ${config.ring} flex items-center justify-center`}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white leading-snug truncate">
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-[11px] text-zinc-500 leading-snug mt-0.5 line-clamp-1">
            {notification.message}
          </p>
        )}

        {isInvite && data.token && !isActed && (
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={handleAccept}
              disabled={acting}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={handleDecline}
              disabled={acting}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/15 text-zinc-300 transition-colors disabled:opacity-50"
            >
              <X className="w-3 h-3" /> Decline
            </button>
          </div>
        )}
        {isInvite && data.token && isActed && (
          <p className="text-[10px] text-zinc-500 mt-1 italic">Responded ✓</p>
        )}

        <span className="flex items-center gap-0.5 text-[10px] text-zinc-600 mt-1">
          <Clock className="w-2.5 h-2.5" />
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * NotificationBell — embeddable bell icon + floating notification panel.
 * Drop this anywhere in the nav/sidebar:
 *
 *   import NotificationBell from "@/components/notification/notificationUse";
 *   <NotificationBell />
 */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  // actedIds persists across re-fetches so buttons don't reappear
  const [actedIds, setActedIds] = useState(new Set());
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const handleActed = (id) =>
    setActedIds((prev) => new Set([...prev, id]));

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects/notifications");
      setNotifications((res.data?.data || []).slice(0, 8));
    } catch {
      /* silent — bell shouldn't crash nav */
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + every 30 s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id) => {
    try {
      await api.patch(`/projects/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/projects/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 ${
          open
            ? "bg-white/[0.08] border-white/20 text-white"
            : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.07] hover:border-white/15"
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-violet-600 text-white text-[9px] font-black px-0.5 shadow-[0_0_8px_rgba(139,92,246,0.7)]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Floating panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-11 w-80 z-[999] rounded-2xl border border-white/[0.12] bg-[#0f0f1a]/95 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-bold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> All read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-white/[0.05]">
              {loading ? (
                <div className="py-8 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-zinc-600" />
                  </div>
                  <p className="text-xs text-zinc-500">You're all caught up!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((n) => (
                    <MiniNotificationItem
                      key={n.id}
                      notification={n}
                      onRead={markRead}
                      onAction={fetchNotifications}
                      isActed={actedIds.has(n.id)}
                      onActed={handleActed}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/[0.08]">
              <button
                onClick={() => { setOpen(false); router.push("/notifications"); }}
                className="flex items-center justify-center gap-1.5 w-full text-xs text-zinc-500 hover:text-violet-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
