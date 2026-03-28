"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import {
  Loader2, Mail, Lock, ArrowRight, Zap, Eye, EyeOff,
  KeyRound, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import api from "@/utils/axios";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP+password, 3 = success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = {};
    if (!otp) errs.otp = "Verification code is required";
    else if (otp.length !== 6) errs.otp = "Code must be 6 digits";
    if (!newPassword) errs.newPassword = "New password is required";
    else if (newPassword.length < 8) errs.newPassword = "Password must be at least 8 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password. Please try again.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setServerError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setServerError(""); // clear
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend code.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#08080f] text-white">
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative z-10 w-full lg:w-1/2 max-w-2xl mx-auto lg:mx-0">
        <Link href="/" className="absolute top-8 left-8 sm:left-12 flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight">RapidBase</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Step 1: Enter email */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <KeyRound className="w-6 h-6 text-orange-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Forgot Password</h1>
              </div>
              <p className="text-zinc-400 mb-8 text-sm sm:text-base">
                Enter your email address and we&apos;ll send you a verification code to reset your password.
              </p>

              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{serverError}</p>
                </motion.div>
              )}

              <form onSubmit={handleSendCode} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email Address</Label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({...p, email: ""})); }}
                      placeholder="you@example.com"
                      className={`pl-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl ${errors.email ? "border-red-500/60 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />{errors.email}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-[0_0_20px_rgba(249,115,22,0.25)] border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>

              <p className="mt-8 text-sm text-center text-zinc-500">
                Remember your password?{" "}
                <Link href="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">Back to login</Link>
              </p>
            </>
          )}

          {/* Step 2: OTP + New Password */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <ShieldCheck className="w-6 h-6 text-violet-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Reset Password</h1>
              </div>
              <p className="text-zinc-400 mb-2 text-sm sm:text-base">
                We sent a 6-digit code to <span className="text-violet-400 font-medium">{email}</span>
              </p>
              <p className="text-zinc-600 mb-8 text-xs">
                Enter the code and your new password below.
              </p>

              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{serverError}</p>
                </motion.div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
                {/* OTP */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Verification Code</Label>
                  <div className="relative group">
                    <KeyRound className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.otp ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                    <Input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); if (errors.otp) setErrors(p => ({...p, otp: ""})); }}
                      placeholder="000000"
                      className={`pl-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl text-center text-2xl tracking-[0.5em] font-mono ${errors.otp ? "border-red-500/60 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`}
                    />
                  </div>
                  {errors.otp && (
                    <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />{errors.otp}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">New Password</Label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.newPassword ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(p => ({...p, newPassword: ""})); }}
                      placeholder="••••••••"
                      className={`pl-11 pr-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl ${errors.newPassword ? "border-red-500/60 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />{errors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.confirmPassword ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({...p, confirmPassword: ""})); }}
                      placeholder="••••••••"
                      className={`pl-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl ${errors.confirmPassword ? "border-red-500/60 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />{errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between">
                <button onClick={() => { setStep(1); setServerError(""); setErrors({}); }} className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Change email
                </button>
                <button onClick={handleResendCode} disabled={loading} className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Resend code
                </button>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-3">Password Reset!</h1>
              <p className="text-zinc-400 text-sm mb-8">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Link href="/login">
                <Button className="h-12 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] gap-2">
                  <ArrowRight className="w-4 h-4" /> Go to Login
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Right Column - Visuals */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-[#08080f] to-[#08080f] z-0" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute inset-0 opacity-[0.05] z-0" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

        <div className="relative z-10 w-full max-w-lg glass-card border-white/10 rounded-[2rem] p-10 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black mb-6">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Secure reset.</span>
          </h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Enter Your Email", desc: "We'll send a 6-digit verification code to your registered email address." },
              { step: "2", title: "Enter the Code", desc: "Check your inbox and enter the verification code we sent you." },
              { step: "3", title: "Set New Password", desc: "Choose a strong new password. You'll be ready to log in immediately." },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-orange-400 font-black text-sm">{f.step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
