"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import api from "@/utils/axios";
import { useAuth } from "@/providers/AuthContext";
import { useRouter } from "nextjs-toploader/app";
import {
  Bell, CheckCheck, Users, UserCheck, UserX, Clock, Inbox, ArrowLeft, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG = {
  member_invite: { icon: Users, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "Invitation" },
  invite_accepted: { icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Accepted" },
  invite_declined: { icon: UserX, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Declined" },
};

function NotificationItem({ notification, onRead, onAction }) {
  const config = TYPE_CONFIG[notification.type] || { icon: Bell, color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20", label: "Notice" };
  const Icon = config.icon;
  const isInvite = notification.type === "member_invite";
  const data = notification.data || {};
  const [acting, setActing] = useState(false);

  const handleAccept = async () => {
    setActing(true);
    try {
      await api.post(`/projects/invitations/accept/${data.token}`);
      toast.success("Invitation accepted! You've been added to the project.");
      onAction?.();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to accept invitation.");
    } finally { setActing(false); }
  };

  const handleDecline = async () => {
    setActing(true);
    try {
      await api.post(`/projects/invitations/decline/${data.token}`);
      toast.success("Invitation declined.");
      onAction?.();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to decline invitation.");
    } finally { setActing(false); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className={`relative rounded-2xl border p-4 transition-colors ${
        notification.is_read
          ? "bg-white/[0.01] border-white/[0.05]"
          : "bg-white/[0.04] border-white/[0.10]"
      }`}
    >
      {!notification.is_read && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
      )}
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="text-sm font-semibold text-white leading-snug">{notification.title}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} flex-shrink-0`}>
              {config.label}
            </span>
          </div>
          {notification.message && (
            <p className="text-xs text-zinc-400 mb-2 leading-relaxed">{notification.message}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-zinc-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            <div className="flex items-center gap-2">
              {isInvite && data.token && (
                <>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    disabled={acting}
                    className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-500 text-white border-0 rounded-lg gap-1.5"
                  >
                    <UserCheck className="w-3 h-3" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDecline}
                    disabled={acting}
                    className="h-7 px-3 text-xs border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg gap-1.5"
                  >
                    <UserX className="w-3 h-3" /> Decline
                  </Button>
                </>
              )}
              {!notification.is_read && (
                <button
                  onClick={() => onRead(notification.id)}
                  className="text-[11px] text-zinc-600 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" /> Mark read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return; // wait until auth resolves
    setLoading(true);
    try {
      const res = await api.get("/projects/notifications");
      setNotifications(res.data?.data || []);
    } catch (e) {
      if (e.response?.status !== 401) {
        toast.error("Failed to load notifications");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) { fetchNotifications(); }
  }, [authLoading, fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.patch(`/projects/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/projects/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark all as read"); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#08080f] text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Notifications</h1>
              <p className="text-xs text-zinc-500">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="gap-2 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.07] rounded-xl"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-5">
              <Inbox className="w-9 h-9 text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No notifications yet</h3>
            <p className="text-sm text-zinc-500 max-w-xs">
              When someone invites you to a project or responds to your invitation, it'll appear here.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markRead}
                  onAction={fetchNotifications}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
