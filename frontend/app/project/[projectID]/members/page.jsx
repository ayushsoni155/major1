"use client";
import React, { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthContext";
import api from "@/utils/axios";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Users, UserPlus, Crown, Shield, Eye, Trash2, Pencil, Loader2, Mail
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ROLE_META = {
  admin:  { label: "Admin",  color: "text-violet-400 bg-violet-500/15 border-violet-500/30", icon: Shield },
  editor: { label: "Editor", color: "text-blue-400 bg-blue-500/15 border-blue-500/30",     icon: Pencil },
  viewer: { label: "Viewer", color: "text-zinc-400 bg-zinc-500/15 border-zinc-500/30",     icon: Eye },
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

const fetcher = (url) => api.get(url).then(r => r.data.data);

export default function MembersPage() {
  const { projectID } = useParams();
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen]   = useState(false);
  const [editMember, setEditMember]   = useState(null);
  const [removeMember, setRemoveMember] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState("editor");
  const [newRole,     setNewRole]     = useState("editor");
  const [submitting,  setSubmitting]  = useState(false);

  const { data: members = [], mutate, isLoading } = useSWR(
    projectID ? `/projects/${projectID}/members` : null, fetcher
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Email required"); return; }
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectID}/invitations`, { email: inviteEmail.trim().toLowerCase(), role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}! They will receive an email with a link to accept.`);
      setInviteEmail(""); setInviteRole("editor"); setInviteOpen(false);
      mutate();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to send invitation"); }
    finally { setSubmitting(false); }
  };

  const handleRoleUpdate = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/projects/${projectID}/members/${editMember.id}`, { role: newRole });
      toast.success("Role updated");
      setEditMember(null); mutate();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to update role"); }
    finally { setSubmitting(false); }
  };

  const handleRemove = async () => {
    try {
      await api.delete(`/projects/${projectID}/members/${removeMember.id}`);
      toast.success(`${removeMember.name || removeMember.email} removed`);
      setRemoveMember(null); mutate();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to remove member"); }
  };

  const openEdit = (m)   => { setNewRole(m.role); setEditMember(m); };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}
      className="flex flex-1 flex-col gap-6 p-4 sm:p-6 max-w-[1200px] mx-auto w-full">

      {/* Header */}
      <motion.div variants={itemVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-[2rem] border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/8 to-indigo-500/8 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-violet-500/15 border border-violet-500/25">
            <Users className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Team Members</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""} in this project</p>
          </div>
        </div>
        <div className="relative z-10">
          <Button onClick={() => setInviteOpen(true)}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg gap-2">
            <UserPlus className="w-4 h-4" /> Invite Member
          </Button>
        </div>
      </motion.div>

      {/* Members list */}
      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] border-white/10 overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500/50 mb-3" />
            <p className="text-zinc-500 text-sm">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Users className="w-14 h-14 text-zinc-700 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No members yet</h3>
            <p className="text-zinc-500 text-sm">Invite your team to collaborate on this project.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            <AnimatePresence>
              {members.map((m, i) => {
                const RoleMeta = ROLE_META[m.role] || ROLE_META.viewer;
                const RoleIcon = RoleMeta.icon;
                const isMe = m.user_id === user?.id;
                return (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 rounded-xl flex-shrink-0">
                        <AvatarImage src={m.avatar_url || undefined} />
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-white text-sm font-bold">
                          {(m.name || m.email)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{m.name || "—"}</p>
                          {isMe && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">You</span>}
                        </div>
                        <p className="text-xs text-zinc-500 truncate flex items-center gap-1"><Mail className="w-3 h-3"/>{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${RoleMeta.color}`}>
                        <RoleIcon className="w-3 h-3" />{RoleMeta.label}
                      </span>
                      {!isMe && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(m)} title="Change role"
                            className="p-1.5 hover:bg-violet-500/20 hover:text-violet-400 rounded-lg text-zinc-500 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setRemoveMember(m)} title="Remove member"
                            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-zinc-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Role legend */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl border-white/10 p-5 shadow-xl">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Role Permissions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { role: "admin",  desc: "Full access: manage members, tables, schema, API keys, and settings." },
            { role: "editor", desc: "Can create/edit tables and data, run SQL queries, view analytics." },
            { role: "viewer", desc: "Read-only: view tables, schema, analytics, and audit logs." },
          ].map(({ role, desc }) => {
            const M = ROLE_META[role];
            const Icon = M.icon;
            return (
              <div key={role} className={`p-4 rounded-xl border ${M.color} bg-opacity-10`}>
                <div className={`flex items-center gap-2 text-sm font-bold mb-1 ${M.color.split(' ')[0]}`}>
                  <Icon className="w-4 h-4" />{M.label}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-violet-400"/>Invite Member</DialogTitle>
            <DialogDescription className="text-zinc-500">Send an invite to a registered RapidBase user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</Label>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="user@example.com" type="email"
                className="rounded-xl h-10 bg-white/5 border-white/10 text-white focus-visible:ring-violet-500/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="rounded-xl h-10 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 rounded-xl">
                  <SelectItem value="admin">Admin — full access</SelectItem>
                  <SelectItem value="editor">Editor — create & edit</SelectItem>
                  <SelectItem value="viewer">Viewer — read only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)} className="text-zinc-400 hover:text-white rounded-xl">Cancel</Button>
            <Button onClick={handleInvite} disabled={submitting} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <UserPlus className="w-4 h-4"/>} Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400"/>Change Role</DialogTitle>
            <DialogDescription className="text-zinc-500">Update the role for {editMember?.name || editMember?.email}.</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="rounded-xl h-10 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10 rounded-xl">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditMember(null)} className="text-zinc-400 hover:text-white rounded-xl">Cancel</Button>
            <Button onClick={handleRoleUpdate} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Shield className="w-4 h-4"/>} Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm */}
      <AlertDialog open={!!removeMember} onOpenChange={() => setRemoveMember(null)}>
        <AlertDialogContent className="bg-[#12121a] border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white"><Trash2 className="w-5 h-5 text-red-400"/>Remove Member</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Remove <strong className="text-white">{removeMember?.name || removeMember?.email}</strong> from this project? They will lose all access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
