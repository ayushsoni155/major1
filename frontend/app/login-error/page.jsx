"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center text-center px-6 overflow-hidden bg-[#08080f] text-white">
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay" />
        
        {/* Animated Grid SVG */}
        <motion.svg className="absolute inset-0 w-full h-full opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(244, 63, 94, 0.3)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </motion.svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-lg"
      >
        <div className="relative mb-8 flex justify-center items-center w-32 h-32 rounded-3xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.15)] backdrop-blur-xl">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ShieldAlert className="w-16 h-16 text-rose-500 opacity-90" />
          </motion.div>
          
          {/* Decorative Ring */}
          <motion.div 
            animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 border-2 border-rose-500/30 rounded-3xl"
          />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-red-600 drop-shadow-lg">
          Authentication Error
        </h1>
        
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-10 max-w-sm mx-auto">
          Something went wrong during login or your session has expired. Please verify your credentials and try again.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            onClick={() => router.back()}
            className="h-12 px-6 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
          <Link href="/">
            <Button
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-[0_0_20px_rgba(244,63,94,0.25)] border-0 transition-all hover:scale-[1.02]"
            >
              <Home className="w-4 h-4 mr-2" /> Return Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
