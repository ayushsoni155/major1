"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Mail, Lock, User, ArrowRight, Zap, Eye, EyeOff, CheckCircle2, RotateCcw, Star, AlertCircle } from "lucide-react";
import Link from "next/link";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signUpWithEmail, verifyOtp, resendOtp } = useAuth();

  const [step, setStep] = useState(searchParams.get("step") === "verify" ? "verify" : "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/project/create-project");
    }
  }, [user, authLoading, router]);

  // Countdown for OTP resend
  useEffect(() => {
    if (step !== "verify") return;
    setCountdown(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required";
    else if (name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      setStep("verify");
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data?.message === "string" ? data.message : "Registration failed. Please try again.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setErrors({ otp: "Please enter the 6-digit code" }); return; }
    setErrors({});
    setLoading(true);
    try {
      await verifyOtp(email, code);
      router.push("/project/create-project");
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || "Invalid or expired code" });
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOtp(email);
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(interval); setCanResend(true); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setServerError(err.response?.data?.message || "Could not resend code");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "Enter" && otp.join("").length === 6) handleVerify();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); otpRefs.current[5]?.focus(); }
  };

  const clearErr = (field) => setErrors(p => ({ ...p, [field]: "" }));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }
  if (user) return null;

  return (
    <div className="min-h-screen w-full flex bg-[#08080f] text-white">
      {/* Left Column */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative z-10 w-full lg:w-1/2 max-w-2xl mx-auto lg:mx-0 overflow-y-auto py-16">
        <Link href="/" className="absolute top-8 left-8 sm:left-12 flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight">RapidBase</span>
        </Link>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 mt-8 sm:mt-0">
          {["register", "verify"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${step === s ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]" : i === 0 && step === "verify" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-zinc-500"}`}>
                {step === "verify" && s === "register" ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${step === s ? "text-white" : "text-zinc-500"}`}>
                {s === "register" ? "Details" : "Verify Email"}
              </span>
              {i < 1 && <div className="w-6 h-px bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        {/* Server error banner */}
        {serverError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{serverError}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === "register" && (
            <motion.div key="register" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Create your account</h1>
              <p className="text-zinc-400 mb-8 text-sm sm:text-base">Get started with RapidBase for free.</p>

              <form onSubmit={handleRegister} className="space-y-4" noValidate>
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Full Name</Label>
                  <div className="relative group">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.name ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                    <Input value={name} onChange={(e) => { setName(e.target.value); clearErr("name"); }} placeholder="John Doe"
                      className={`pl-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl ${errors.name ? "border-red-500/60 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`} />
                  </div>
                  {errors.name && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email Address</Label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                    <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearErr("email"); }} placeholder="you@example.com"
                      className={`pl-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl ${errors.email ? "border-red-500/60 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`} />
                  </div>
                  {errors.email && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Password</Label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); clearErr("password"); }} placeholder="Min 8 characters"
                      className={`pl-11 pr-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl ${errors.password ? "border-red-500/60 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.confirmPassword ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                    <Input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearErr("confirmPassword"); }} placeholder="••••••••"
                      className={`pl-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl ${errors.confirmPassword ? "border-red-500/60 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`} />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>

              <p className="mt-8 text-sm text-center text-zinc-500">
                Already have an account?{" "}
                <Link href="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === "verify" && (
            <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <Mail className="w-7 h-7 text-violet-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Check your email</h1>
              <p className="text-zinc-400 text-sm sm:text-base mb-1">We sent a 6-digit code to</p>
              <p className="text-violet-300 font-semibold text-lg mb-8">{email}</p>

              <div className="flex gap-2.5 mb-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <motion.input
                    key={i} ref={(el) => (otpRefs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-black text-white bg-white/[0.03] border rounded-xl focus:outline-none focus:bg-white/[0.06] transition-all caret-violet-400 ${errors.otp ? "border-red-500/60" : "border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"}`}
                  />
                ))}
              </div>
              {errors.otp && <p className="text-xs text-red-400 flex items-center gap-1 mb-4"><AlertCircle className="w-3 h-3" />{errors.otp}</p>}

              <Button onClick={handleVerify} disabled={loading || otp.join("").length !== 6} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-6 mt-4">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Email <CheckCircle2 className="w-5 h-5 ml-2" /></>}
              </Button>

              <div className="text-center mb-5">
                {canResend ? (
                  <button onClick={handleResend} className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors">
                    <RotateCcw className="w-4 h-4" /> Resend verification code
                  </button>
                ) : (
                  <p className="text-sm text-zinc-500">Resend in <span className="text-zinc-300 font-mono">{countdown}s</span></p>
                )}
              </div>
              <button onClick={() => { setStep("register"); setOtp(["", "", "", "", "", ""]); setErrors({}); }} className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2 mx-auto">
                ← Use a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Column */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/20 via-[#08080f] to-[#08080f] z-0" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute inset-0 opacity-[0.05] z-0" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

        <div className="relative z-10 w-full max-w-lg glass-card border-white/10 rounded-[2rem] p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-1 mb-8">{[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}</div>
          <h2 className="text-2xl font-medium leading-snug mb-8 text-white/90">
            &ldquo;RapidBase completely changed how we ship products. We launched our API in minutes, not weeks.&rdquo;
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-lg font-bold text-white shadow-lg">AK</div>
            <div>
              <p className="font-bold text-white text-sm">Alex K.</p>
              <p className="text-zinc-500 text-sm">CTO, DataFlow Inc.</p>
            </div>
          </div>
          <div className="mt-10 space-y-4 pt-8 border-t border-white/10">
            {[["PostgreSQL 16","Auto-scaling"],["PostgREST API","Global Edge"]].map((row, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                {row.map(item => <span key={item} className="text-zinc-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" />{item}</span>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
