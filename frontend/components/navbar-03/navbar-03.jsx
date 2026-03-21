"use client";

import React, { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Bot, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { ProfilePopup } from "@/components/global/ProfilePopup";
import LoginPopup from "@/components/global/LoginPopup";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";
import { useAuth } from "@/providers/AuthContext";

const Navbar03Page = () => {
  const { user, loading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    if (user) {
      router.push("/project/create-project");
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      <div className="fixed top-0 md:top-2 flex justify-center items-center w-full py-0 md:py-3 z-50">
        <nav
          className="flex h-14 w-full max-w-6xl items-center justify-between px-4
          border bg-background shadow-sm shadow-[0_0_15px] shadow-primary/40
          dark:shadow-[0_0_20px] dark:shadow-primary/30 transition-all rounded-xl"
        >
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 font-semibold ml-1">
              <Bot className="h-5 w-5" /> GoRapidBase
            </div>
            {/* Desktop NavMenu */}
            <NavMenu className="hidden md:block" />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1">
            {/* CTA (Desktop Only) */}
            <Button className="px-4 hidden md:flex" onClick={handleButtonClick} disabled={loading}>
              {user ? "Dashboard" : "Get Started"}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>

            {/* Symmetric Icons (Desktop Only) */}
            <div className="hidden md:flex items-center">
              <ProfilePopup />
              <ThemeToggleButton variant="circle-blur" start="top-right" />
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center md:hidden">
              <ProfilePopup />
              <NavigationSheet />
            </div>
          </div>
        </nav>
      </div>

      {/* Login Modal */}
      <LoginPopup open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
};

export default Navbar03Page;
