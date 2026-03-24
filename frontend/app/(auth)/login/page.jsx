"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { Loader2, Mail, Lock, ArrowRight, Zap, Eye, EyeOff, Database, Shield, Code2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/project/create-project");
    }
  }, [user, authLoading, router]);

  const validate = () => {
    const errs = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.data?.requiresVerification) {
        router.push(`/signup?email=${encodeURIComponent(email)}&step=verify`);
        return;
      }
      router.push("/project/create-project");
    } catch (err) {
      const data = err.response?.data;
      if (data?.data?.requiresVerification) {
        router.push(`/signup?email=${encodeURIComponent(email)}&step=verify`);
      } else {
        const msg = typeof data?.message === "string" ? data.message : "Invalid email or password";
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  // Prevent flash of login page if already logged in
  if (user) return null;

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
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Welcome back</h1>
          <p className="text-zinc-400 mb-8 text-sm sm:text-base">Sign in to your account to continue building.</p>

          {/* Server Error Banner */}
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

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email */}
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

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Password</Label>
                <Link href="#" className="text-xs text-violet-400 hover:text-violet-300 font-medium">Forgot password?</Link>
              </div>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"}`} />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({...p, password: ""})); }}
                  placeholder="••••••••"
                  className={`pl-11 pr-11 h-12 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:bg-white/[0.05] transition-all rounded-xl ${errors.password ? "border-red-500/60 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30" : "border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />{errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>

          <p className="mt-8 text-sm text-center text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">Sign up for free</Link>
          </p>
        </motion.div>
      </div>

      {/* Right Column - Visuals */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-[#08080f] to-[#08080f] z-0" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute inset-0 opacity-[0.05] z-0" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

        <div className="relative z-10 w-full max-w-lg glass-card border-white/10 rounded-[2rem] p-10 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Build faster.</span>
          </h2>
          <div className="space-y-6">
            {[
              { icon: Database, title: "Instant REST APIs", desc: "Your PostgreSQL schema instantly generates robust, documented APIs." },
              { icon: Shield, title: "Secure by Default", desc: "Baked-in Row-Level Security ensuring absolute data isolation." },
              { icon: Code2, title: "Developer First", desc: "SQL Editor, API Keys, Schema Visualization — all in one place." },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 p-5 rounded-xl bg-violet-500/10 border border-violet-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent" />
            <p className="relative text-sm font-mono text-violet-200">
              <span className="text-violet-400">const</span> {"{ data }"} = <span className="text-violet-400">await</span> rapidbase<br/>
              &nbsp;&nbsp;.from(<span className="text-green-300">&apos;users&apos;</span>)<br/>
              &nbsp;&nbsp;.select(<span className="text-green-300">&apos;*&apos;</span>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
