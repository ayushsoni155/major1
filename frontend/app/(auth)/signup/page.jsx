"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Mail, Lock, User, ArrowRight, Zap, Eye, EyeOff, CheckCircle2, RotateCcw, Star } from "lucide-react";
import Link from "next/link";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUpWithEmail, verifyOtp, resendOtp } = useAuth();

  // Step: "register" | "verify"
  const [step, setStep] = useState(searchParams.get("step") === "verify" ? "verify" : "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef([]);

  // Countdown timer for resend
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) { toast.error("Please fill all fields"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      toast.success("Verification code sent to your email!");
      setStep("verify");
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data?.message === 'string' ? data.message : "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Please enter the 6-digit code"); return; }
    setLoading(true);
    try {
      await verifyOtp(email, code);
      toast.success("Email verified! Welcome to RapidBase 🚀");
      router.push("/project/create-project");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code");
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
      toast.success("New code sent!");
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
      toast.error(err.response?.data?.message || "Could not resend code");
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
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === 6) handleVerify();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#08080f] text-white">
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative z-10 w-full lg:w-1/2 max-w-2xl mx-auto lg:mx-0 overflow-y-auto py-12">
        <Link href="/" className="absolute top-8 left-8 sm:left-12 flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight drop-shadow-md">RapidBase</span>
        </Link>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8 mt-8 sm:mt-0">
          {["register", "verify"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  step === s ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]" :
                  (s === "verify" && step === "verify") || i === 0 ? "bg-white/10 text-zinc-400" :
                  "bg-white/10 text-zinc-500"
                }`}
              >
                {step === "verify" && s === "register" ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${step === s ? "text-white" : "text-zinc-500"}`}>
                {s === "register" ? "Details" : "Verify Email"}
              </span>
              {i < 1 && <div className="w-6 h-px bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "register" && (
            <motion.div key="register" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="relative">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Create your account</h1>
              <p className="text-zinc-400 mb-8 text-sm sm:text-base">Get started with RapidBase for free and build faster.</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="pl-11 h-12 bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/[0.05] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-11 h-12 bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/[0.05] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} className="pl-11 pr-11 h-12 bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/[0.05] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all rounded-xl" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="pl-11 h-12 bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/[0.05] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all rounded-xl" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-4">
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
            <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="relative">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <Mail className="w-8 h-8 text-violet-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Check your email</h1>
              <p className="text-zinc-400 text-sm sm:text-base mb-1">We sent a 6-digit code to</p>
              <p className="text-violet-300 font-medium text-lg mb-8">{email}</p>

              <div className="flex gap-3 mb-8" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <motion.input
                    key={i} ref={(el) => (otpRefs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black text-white bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:bg-white/[0.06] focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all caret-violet-400"
                  />
                ))}
              </div>

              <Button onClick={handleVerify} disabled={loading || otp.join("").length !== 6} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-6">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Email <CheckCircle2 className="w-5 h-5 ml-2" /></>}
              </Button>

              <div className="text-center mb-6">
                {canResend ? (
                  <button onClick={handleResend} className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors">
                    <RotateCcw className="w-4 h-4" /> Resend verification code
                  </button>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Resend code in <span className="text-zinc-300 font-mono tracking-wider">{countdown}s</span>
                  </p>
                )}
              </div>

              <button onClick={() => { setStep("register"); setOtp(["", "", "", "", "", ""]); }} className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2 mx-auto">
                &larr; Use a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Column - Visuals */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/20 via-[#08080f] to-[#08080f] z-0" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05] z-0" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

        <div className="relative z-10 w-full max-w-lg glass-card border-white/10 rounded-[2rem] p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-1 mb-8">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
          </div>
          <h2 className="text-2xl font-medium leading-snug mb-8 text-white/90">
            "RapidBase completely changed how we ship products. We went from spending weeks on backend architecture to launching our API in just a few minutes."
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-lg font-bold text-white shadow-lg">
              AK
            </div>
            <div>
              <p className="font-bold text-white text-sm">Alex K.</p>
              <p className="text-zinc-500 text-sm">CTO, DataFlow Inc.</p>
            </div>
          </div>
          
          <div className="mt-12 space-y-4 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> PostgreSQL 16</span>
              <span className="text-zinc-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-scaling</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> PostgREST API</span>
              <span className="text-zinc-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Global Edge</span>
            </div>
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
