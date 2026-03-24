"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import api from "@/utils/axios";
import { useAuth } from "@/providers/AuthContext";
import { Zap, UserCheck, UserX, Loader2, CheckCircle, XCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <InvitePageInner />
    </Suspense>
  );
}

function InvitePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const token = searchParams.get("token");
  const autoAction = searchParams.get("action"); // 'accept' | 'decline'

  const [status, setStatus] = useState("idle"); // idle | loading | accepted | declined | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAction = async (action) => {
    if (!token) { setErrorMsg("Invalid invitation link."); setStatus("error"); return; }
    setStatus("loading");
    try {
      const res = await api.post(`/projects/invitations/${action}/${token}`);
      setResult(res.data?.data);
      setStatus(action === "accept" ? "accepted" : "declined");
    } catch (e) {
      setErrorMsg(e.response?.data?.message || "Something went wrong.");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!authLoading && user && autoAction && status === "idle") {
      handleAction(autoAction);
    }
  }, [authLoading, user, autoAction, status]);

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-card rounded-[2rem] border border-white/10 p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mx-auto mb-5 shadow-[0_0_24px_rgba(139,92,246,0.5)]">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">You have an invitation!</h1>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            You've been invited to join a RapidBase project. Sign in to accept or decline.
          </p>
          <Link href={`/login?redirect=/invite?token=${token}&action=${autoAction || "accept"}`}>
            <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold gap-2">
              <LogIn className="w-4 h-4" /> Sign in to respond
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card rounded-[2rem] border border-white/10 p-10 text-center"
      >
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.5)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-black tracking-tight text-white">RapidBase</span>
        </Link>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
            <p className="text-zinc-400">Processing your response…</p>
          </div>
        )}

        {status === "accepted" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">You're in! 🎉</h2>
            <p className="text-zinc-400 text-sm mb-8">
              You've been added to <strong className="text-white">{result?.projectName || "the project"}</strong>. Let's get building.
            </p>
            <Button
              onClick={() => router.push(`/project/${result?.projectId}/dashboard`)}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold gap-2"
            >
              Go to project →
            </Button>
          </>
        )}

        {status === "declined" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Invitation Declined</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              No worries. You've declined the invitation. The project owner has been notified.
            </p>
            <Button
              onClick={() => router.push("/project/create-project")}
              variant="outline"
              className="h-11 rounded-xl border-white/10 text-zinc-300 hover:bg-white/[0.07] hover:text-white"
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Something went wrong</h2>
            <p className="text-sm text-red-400 mb-8">{errorMsg}</p>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="h-11 rounded-xl border-white/10 text-zinc-300 hover:bg-white/[0.07]"
            >
              Go Home
            </Button>
          </>
        )}

        {status === "idle" && (
          <>
            <div className="w-16 h-16 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mx-auto mb-5">
              <Zap className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Project Invitation</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              You've been invited to collaborate on a RapidBase project. Would you like to accept or decline?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleAction("accept")}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold gap-2"
              >
                <UserCheck className="w-4 h-4" /> Accept
              </Button>
              <Button
                onClick={() => handleAction("decline")}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.07] gap-2"
              >
                <UserX className="w-4 h-4" /> Decline
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
