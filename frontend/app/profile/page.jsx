"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthContext";
import api from "@/utils/axios";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Lock, ShieldAlert, LogOut, Save, KeyRound, Trash2, Loader2, ArrowLeft
} from "lucide-react";
import { useRouter } from "nextjs-toploader/app";

const cardClass = "glass-card rounded-[2rem] border-white/10 p-6 sm:p-8 shadow-2xl";
const inputClass = "rounded-xl h-10 bg-white/5 border-white/10 text-white focus-visible:ring-violet-500/50";
const labelClass = "text-xs font-semibold text-zinc-400 uppercase tracking-wider";

export default function ProfilePage() {
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const [name, setName]           = useState(user?.name || "");
  const [saving, setSaving]       = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    try {
      await api.patch("/auth/profile", { name: name.trim() });
      await refreshUser?.();
      toast.success("Profile updated!");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to update profile"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { toast.error("Please fill all password fields"); return; }
    if (newPw !== confirmPw) { toast.error("New passwords don't match"); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    setChangingPw(true);
    try {
      await api.post("/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      toast.success("Password changed! Please log in again.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => signOut(), 2000);
    } catch (e) { toast.error(e.response?.data?.message || "Failed to change password"); }
    finally { setChangingPw(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { toast.error("Password required"); return; }
    setDeleting(true);
    try {
      await api.delete("/auth/account", { data: { password: deletePassword } });
      toast.success("Account deleted. Goodbye!");
      router.push("/login");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to delete account"); }
    finally { setDeleting(false); setDeleteOpen(false); }
  };

  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-[#08080f] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back button */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Avatar + name header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className={cardClass + " relative overflow-hidden"}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-indigo-500/8 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-5">
            <Avatar className="h-20 w-20 rounded-2xl flex-shrink-0">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-violet-500/40 to-indigo-500/40 text-white text-2xl font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-black text-white">{user?.name}</h1>
              <p className="text-zinc-400 text-sm mt-0.5">{user?.email}</p>
              <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full capitalize">
                {user?.role || "user"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Profile Details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className={cardClass}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/25">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Profile Details</h2>
              <p className="text-zinc-500 text-sm">Update your display name</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Display Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Email Address</Label>
              <Input value={user?.email || ""} disabled
                className={inputClass + " opacity-50 cursor-not-allowed"} />
              <p className="text-xs text-zinc-600">Email cannot be changed.</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
            </Button>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
          className={cardClass}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Change Password</h2>
              <p className="text-zinc-500 text-sm">Choose a strong password</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Current Password</Label>
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelClass}>New Password</Label>
                <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="••••••••" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Confirm New Password</Label>
                <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••" className={inputClass} />
              </div>
            </div>
            {newPw && confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-400">Passwords don&apos;t match</p>
            )}
            <Button onClick={handleChangePassword} disabled={changingPw}
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold gap-2">
              {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Change Password
            </Button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className={cardClass + " border-red-500/20"}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/25">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Danger Zone</h2>
              <p className="text-zinc-500 text-sm">Actions here are irreversible</p>
            </div>
          </div>
          <Separator className="bg-white/5 mb-5" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
            <div>
              <p className="text-sm font-semibold text-white">Delete Account</p>
              <p className="text-xs text-zinc-500 mt-0.5">Permanently delete your account and all owned projects.</p>
            </div>
            <Button variant="outline" onClick={() => setDeleteOpen(true)}
              className="h-9 px-4 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 gap-2 flex-shrink-0">
              <Trash2 className="w-4 h-4" /> Delete Account
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] mt-3">
            <div>
              <p className="text-sm font-semibold text-white">Sign Out</p>
              <p className="text-xs text-zinc-500 mt-0.5">Sign out of your current session.</p>
            </div>
            <Button variant="outline" onClick={signOut}
              className="h-9 px-4 rounded-xl border-white/10 text-zinc-400 hover:bg-white/[0.07] hover:text-white gap-2 flex-shrink-0">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </motion.div>

      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#12121a] border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Delete Your Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete your account, all owned projects, and all data. This action cannot be undone. Enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
              placeholder="Enter your password to confirm" className={inputClass} autoFocus />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl gap-2">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
