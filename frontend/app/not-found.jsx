"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowLeft, Compass, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center text-center px-6 overflow-hidden bg-[#08080f] text-white">
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay" />
        
        {/* Animated Grid SVG */}
        <motion.svg className="absolute inset-0 w-full h-full opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </motion.svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-lg"
      >
        <div className="relative mb-8 flex justify-center items-center w-32 h-32 rounded-3xl bg-white/[0.03] border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-xl">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Compass className="w-16 h-16 text-violet-400 opacity-80" />
          </motion.div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center backdrop-blur-md">
            <Search className="w-5 h-5 text-violet-300" />
          </div>
        </div>

        <h1 className="text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-white/80 to-white/20">
          404
        </h1>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Lost in the void
        </h2>
        
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-10 max-w-sm">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            onClick={() => router.back()}
            className="h-12 px-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
          <Link href="/">
            <Button
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] border-0 transition-all hover:scale-[1.02]"
            >
              Return Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
